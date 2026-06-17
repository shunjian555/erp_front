<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" v-permission="['product:goods:add']" @click="handleAdd">新增商品</el-button>
        <el-button :icon="Delete" plain @click="handleBatchDelete">批量删除</el-button>
        <el-button :icon="Upload" plain>导入</el-button>
        <el-button :icon="Download" plain>导出</el-button>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" />
      </div>
    </div>
    <BaseTable
      :columns="columns"
      :table-data="tableData"
      :loading="loading"
      :total="total"
      :current-page.sync="queryParams.pageNum"
      :page-size.sync="queryParams.pageSize"
      :show-selection="true"
      :show-index="true"
      @selection-change="handleSelectionChange"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #specType="{ row }">
        <el-tag :type="row.specType === 'multi' ? 'warning' : 'success'" size="small">
          {{ row.specType === 'multi' ? '多规格' : '单规格' }}
        </el-tag>
      </template>
      <template #skuCount="{ row }">
        <span v-if="row.specType === 'multi'" class="sku-count">{{ row.skus?.length || 0 }} 个SKU</span>
        <span v-else>-</span>
      </template>
      <template #status="{ row }">
        <BaseStatusTag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '上架' : '下架' }}</BaseStatusTag>
      </template>
      <template #operation="{ row }">
        <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
        <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
      </template>
    </BaseTable>

    <!-- 新增/编辑弹窗 -->
    <BaseDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="900px"
      :confirm-loading="submitLoading"
      @confirm="handleSubmit"
      @cancel="cancelDialog"
    >
      <el-form ref="goodsFormRef" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="商品编码" prop="goodsCode">
              <el-input v-model="formData.goodsCode" placeholder="请输入商品编码" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品名称" prop="goodsName">
              <el-input v-model="formData.goodsName" placeholder="请输入商品名称" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="formData.category" placeholder="请选择分类" filterable clearable style="width:100%">
                <el-option v-for="opt in categoryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品牌" prop="brand">
              <el-input v-model="formData.brand" placeholder="请输入品牌" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规格类型" prop="specType">
              <el-radio-group v-model="formData.specType" @change="handleSpecTypeChange">
                <el-radio value="single">单规格</el-radio>
                <el-radio value="multi">多规格</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="formData.specType === 'single'">
            <el-form-item label="单位" prop="unit">
              <el-input v-model="formData.unit" placeholder="请输入单位" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 单规格：价格库存 -->
        <template v-if="formData.specType === 'single'">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="售价" prop="price">
                <el-input-number v-model="formData.price" :precision="2" :min="0" controls-position="right" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="成本价" prop="costPrice">
                <el-input-number v-model="formData.costPrice" :precision="2" :min="0" controls-position="right" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="库存" prop="stock">
                <el-input-number v-model="formData.stock" :min="0" controls-position="right" style="width:100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <!-- 多规格：规格名 + SKU表格 -->
        <template v-if="formData.specType === 'multi'">
          <el-divider content-position="left">规格设置</el-divider>

          <!-- 规格名管理 -->
          <div class="spec-names-section">
            <div v-for="(specName, sIdx) in formData.specNames" :key="sIdx" class="spec-name-row">
              <el-form-item :label="`规格名 ${sIdx + 1}`" :prop="`specNames.${sIdx}.name`" :rules="specNameRules">
                <div class="spec-name-inline">
                  <el-input v-model="specName.name" placeholder="如：颜色、尺寸" style="width:160px" />
                  <div class="spec-values-wrapper">
                    <el-tag
                      v-for="(val, vIdx) in specName.values"
                      :key="vIdx"
                      closable
                      :type="sIdx === 0 ? '' : 'warning'"
                      @close="removeSpecValue(sIdx, vIdx)"
                      class="spec-value-tag"
                    >
                      {{ val }}
                    </el-tag>
                    <el-input
                      v-if="specName.inputVisible"
                      ref="specValueInputRefs"
                      v-model="specName.inputValue"
                      size="small"
                      style="width:80px"
                      @keyup.enter="addSpecValue(sIdx)"
                      @blur="addSpecValue(sIdx)"
                    />
                    <el-button v-else size="small" @click="showSpecValueInput(sIdx)">+ 添加</el-button>
                  </div>
                  <el-button :icon="Delete" type="danger" circle size="small" @click="removeSpecName(sIdx)" v-if="formData.specNames.length > 1" />
                </div>
              </el-form-item>
            </div>
            <el-button type="primary" plain size="small" @click="addSpecName" style="margin-left:100px">+ 添加规格名</el-button>
          </div>

          <!-- SKU 表格 -->
          <el-divider content-position="left">SKU 列表</el-divider>
          <div class="sku-table-wrapper">
            <el-table :data="formData.skus" border size="small" style="width:100%">
              <el-table-column type="index" label="#" width="50" align="center" />
              <el-table-column
                v-for="(specName, sIdx) in formData.specNames"
                :key="sIdx"
                :label="specName.name || `规格${sIdx + 1}`"
                :prop="`specValues.${sIdx}`"
                width="120"
                align="center"
              >
                <template #default="{ row }">
                  <span>{{ row.specValues?.[sIdx] || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="SKU编码" prop="skuCode" width="150" align="center">
                <template #default="{ row }">
                  <el-input v-model="row.skuCode" size="small" placeholder="自动生成" />
                </template>
              </el-table-column>
              <el-table-column label="售价" prop="price" width="130" align="center">
                <template #default="{ row }">
                  <el-input-number v-model="row.price" :precision="2" :min="0" size="small" controls-position="right" style="width:100%" />
                </template>
              </el-table-column>
              <el-table-column label="成本价" prop="costPrice" width="130" align="center">
                <template #default="{ row }">
                  <el-input-number v-model="row.costPrice" :precision="2" :min="0" size="small" controls-position="right" style="width:100%" />
                </template>
              </el-table-column>
              <el-table-column label="库存" prop="stock" width="110" align="center">
                <template #default="{ row }">
                  <el-input-number v-model="row.stock" :min="0" size="small" controls-position="right" style="width:100%" />
                </template>
              </el-table-column>
              <el-table-column label="状态" prop="status" width="80" align="center">
                <template #default="{ row }">
                  <el-switch v-model="row.status" :active-value="1" :inactive-value="0" size="small" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>

        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Upload, Download, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'

const categoryOptions = [
  { value: '电子产品', label: '电子产品' },
  { value: '办公用品', label: '办公用品' },
  { value: '食品饮料', label: '食品饮料' },
  { value: '服装鞋帽', label: '服装鞋帽' },
  { value: '家居用品', label: '家居用品' },
  { value: '原材料', label: '原材料' }
]

const searchItems = [
  { prop: 'goodsCode', label: '商品编码', type: 'input' },
  { prop: 'goodsName', label: '商品名称', type: 'input' },
  { prop: 'category', label: '分类', type: 'select', options: categoryOptions },
  { prop: 'brand', label: '品牌', type: 'input' }
]

const columns = [
  { prop: 'goodsCode', label: '编码', width: 150 },
  { prop: 'goodsName', label: '名称', minWidth: 150 },
  { prop: 'category', label: '分类', width: 110 },
  { prop: 'brand', label: '品牌', width: 100 },
  { prop: 'specType', label: '规格类型', width: 90, slot: 'specType' },
  { prop: 'skuCount', label: 'SKU数', width: 90, slot: 'skuCount' },
  { prop: 'unit', label: '单位', width: 60, align: 'center' },
  { prop: 'price', label: '价格', width: 100 },
  { prop: 'stock', label: '库存', width: 80, align: 'center' },
  { prop: 'status', label: '状态', width: 80, slot: 'status' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]

const formRules = {
  goodsCode: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  goodsName: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

const specNameRules = [{ required: true, message: '请输入规格名', trigger: 'blur' }]

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const selectedRows = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const goodsFormRef = ref(null)
const specValueInputRefs = ref([])

const queryParams = reactive({ pageNum: 1, pageSize: 10, goodsCode: '', goodsName: '', category: '', brand: '' })

const defaultFormData = () => ({
  id: undefined,
  goodsCode: '',
  goodsName: '',
  category: '',
  brand: '',
  specType: 'single',
  unit: '',
  price: undefined,
  costPrice: undefined,
  stock: 0,
  remark: '',
  // 多规格字段
  specNames: [{ name: '', values: [], inputVisible: false, inputValue: '' }],
  skus: []
})

const formData = reactive(defaultFormData())

async function loadData() {
  loading.value = true
  try {
    const res = await (await import('@/utils/request')).default({ url: '/api/product/goods/list', method: 'get', params: queryParams })
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }

function handleAdd() {
  dialogTitle.value = '新增商品'
  Object.assign(formData, defaultFormData())
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑商品'
  // 深拷贝编辑数据
  const copy = JSON.parse(JSON.stringify(row))
  if (!copy.specType) copy.specType = 'single'
  if (copy.specType === 'multi') {
    if (!copy.specNames || !copy.specNames.length) {
      copy.specNames = [{ name: '', values: [], inputVisible: false, inputValue: '' }]
    }
    copy.specNames.forEach(sn => {
      if (!sn.inputVisible) sn.inputVisible = false
      if (!sn.inputValue) sn.inputValue = ''
    })
    if (!copy.skus) copy.skus = []
  }
  Object.assign(formData, copy)
  dialogVisible.value = true
}

function cancelDialog() {
  dialogVisible.value = false
  goodsFormRef.value?.resetFields()
}

// 切换规格类型
function handleSpecTypeChange(val) {
  if (val === 'single') {
    formData.unit = ''
    formData.price = undefined
    formData.costPrice = undefined
    formData.stock = 0
    formData.specNames = [{ name: '', values: [], inputVisible: false, inputValue: '' }]
    formData.skus = []
  } else {
    formData.specNames = [{ name: '', values: [], inputVisible: false, inputValue: '' }]
    formData.skus = []
    formData.unit = ''
    formData.price = undefined
    formData.costPrice = undefined
    formData.stock = undefined
  }
}

// ===== 多规格管理 =====

// 添加规格名
function addSpecName() {
  formData.specNames.push({ name: '', values: [], inputVisible: false, inputValue: '' })
}

// 移除规格名
function removeSpecName(idx) {
  formData.specNames.splice(idx, 1)
  generateSkus()
}

// 显示规格值输入框
function showSpecValueInput(sIdx) {
  formData.specNames[sIdx].inputVisible = true
  formData.specNames[sIdx].inputValue = ''
  nextTick(() => {
    if (specValueInputRefs.value && specValueInputRefs.value.length) {
      const input = specValueInputRefs.value[specValueInputRefs.value.length - 1]
      input?.focus()
    }
  })
}

// 添加规格值
function addSpecValue(sIdx) {
  const specName = formData.specNames[sIdx]
  const val = specName.inputValue?.trim()
  if (val && !specName.values.includes(val)) {
    specName.values.push(val)
  }
  specName.inputVisible = false
  specName.inputValue = ''
  generateSkus()
}

// 移除规格值
function removeSpecValue(sIdx, vIdx) {
  formData.specNames[sIdx].values.splice(vIdx, 1)
  generateSkus()
}

// 根据规格名和规格值自动生成 SKU 组合（笛卡尔积）
function generateSkus() {
  const specNames = formData.specNames.filter(sn => sn.values.length > 0)
  if (specNames.length === 0) {
    formData.skus = []
    return
  }

  // 生成笛卡尔积
  const allCombinations = cartesianProduct(specNames.map(sn => sn.values))

  // 尝试保留已有SKU数据（匹配规格值组合）
  const oldSkus = formData.skus || []
  const newSkus = allCombinations.map((combo, idx) => {
    const specValues = combo
    // 查找是否已有匹配的SKU
    const existing = oldSkus.find(sku =>
      sku.specValues && sku.specValues.length === specValues.length &&
      sku.specValues.every((v, i) => v === specValues[i])
    )
    if (existing) {
      return { ...existing, specValues }
    }
    return {
      id: idx + 1,
      skuCode: `SKU-${formData.goodsCode || 'NEW'}-${specValues.join('-')}`,
      specValues,
      price: undefined,
      costPrice: undefined,
      stock: 0,
      status: 1
    }
  })
  formData.skus = newSkus
}

// 笛卡尔积算法
function cartesianProduct(arrays) {
  return arrays.reduce((acc, arr) => {
    const result = []
    acc.forEach(comb => {
      arr.forEach(val => {
        result.push([...comb, val])
      })
    })
    return result
  }, [[]])
}

async function handleSubmit() {
  const valid = await goodsFormRef.value?.validate().catch(() => false)
  if (!valid) return

  // 多规格校验
  if (formData.specType === 'multi') {
    const hasEmptySpecName = formData.specNames.some(sn => !sn.name)
    if (hasEmptySpecName) {
      ElMessage.warning('请填写所有规格名')
      return
    }
    const hasNoValues = formData.specNames.some(sn => sn.values.length === 0)
    if (hasNoValues) {
      ElMessage.warning('每个规格至少需要一个规格值')
      return
    }
    if (formData.skus.length === 0) {
      ElMessage.warning('请生成SKU列表')
      return
    }
  }

  submitLoading.value = true
  try {
    await new Promise(r => setTimeout(r, 500))
    ElMessage.success('操作成功')
    dialogVisible.value = false
    loadData()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除"${row.goodsName}"?`, '提示', { type: 'warning' })
  ElMessage.success('删除成功')
  loadData()
}

async function handleBatchDelete() {
  if (!selectedRows.value.length) return ElMessage.warning('请选择数据')
  await ElMessageBox.confirm(`确定删除 ${selectedRows.value.length} 条?`, '提示', { type: 'warning' })
  ElMessage.success('删除成功')
  loadData()
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; padding: 14px 18px; background: #fff;
  border-radius: var(--border-radius-base);
  .toolbar-left { display: flex; gap: 10px; }
  .toolbar-right { display: flex; gap: 8px; }
}

.sku-count { color: var(--el-color-warning); font-weight: 600; }

.spec-names-section {
  .spec-name-row {
    margin-bottom: 12px;
  }
  .spec-name-inline {
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  }
  .spec-values-wrapper {
    display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  }
  .spec-value-tag {
    margin: 0;
  }
}

.sku-table-wrapper {
  margin-bottom: 16px;
}
</style>