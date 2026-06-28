<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" v-permission="['product:goods:add']" @click="handleAdd">{{ $t('product.addGoods') }}</el-button>
        <el-button :icon="Delete" plain @click="handleBatchDelete">{{ $t('common.delete') }}</el-button>
        <el-button :icon="Upload" plain>{{ $t('common.import') }}</el-button>
        <el-button :icon="Download" plain>{{ $t('common.export') }}</el-button>
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
          {{ row.specType === 'multi' ? $t('product.goodsSpecMulti') : $t('product.goodsSpecSingle') }}
        </el-tag>
      </template>
      <template #skuCount="{ row }">
        <span v-if="row.specType === 'multi'" class="sku-count">{{ row.skus?.length || 0 }} SKU</span>
        <span v-else>-</span>
      </template>
      <template #status="{ row }">
        <BaseStatusTag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? $t('product.goodsStatusOn') : $t('product.goodsStatusOff') }}</BaseStatusTag>
      </template>
      <template #operation="{ row }">
        <el-button type="primary" link size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
        <el-button type="danger" link size="small" @click="handleDelete(row)">{{ $t('common.delete') }}</el-button>
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
            <el-form-item :label="$t('product.goodsCode')" prop="goodsCode">
              <el-input v-model="formData.goodsCode" :placeholder="$t('product.inputGoodsCode')" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('product.goodsName')" prop="goodsName">
              <el-input v-model="formData.goodsName" :placeholder="$t('product.inputGoodsName')" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('product.goodsCategory')" prop="category">
              <el-select v-model="formData.category" :placeholder="$t('product.selectCategory')" filterable clearable style="width:100%">
                <el-option v-for="opt in categoryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('product.goodsBrand')" prop="brand">
              <el-input v-model="formData.brand" :placeholder="$t('product.inputBrand')" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('product.goodsSpecType')" prop="specType">
              <el-radio-group v-model="formData.specType" @change="handleSpecTypeChange">
                <el-radio value="single">{{ $t('product.goodsSpecSingle') }}</el-radio>
                <el-radio value="multi">{{ $t('product.goodsSpecMulti') }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="formData.specType === 'single'">
            <el-form-item :label="$t('product.goodsUnit')" prop="unit">
              <el-input v-model="formData.unit" :placeholder="$t('product.goodsUnit')" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 单规格：价格库存 -->
        <template v-if="formData.specType === 'single'">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item :label="$t('product.goodsPrice')" prop="price">
                <el-input-number v-model="formData.price" :precision="2" :min="0" controls-position="right" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('product.goodsCostPrice')" prop="costPrice">
                <el-input-number v-model="formData.costPrice" :precision="2" :min="0" controls-position="right" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('product.goodsStock')" prop="stock">
                <el-input-number v-model="formData.stock" :min="0" controls-position="right" style="width:100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <!-- 多规格：规格名 + SKU表格 -->
        <template v-if="formData.specType === 'multi'">
          <el-divider content-position="left">{{ $t('product.specSetting') }}</el-divider>

          <!-- 规格名管理 -->
          <div class="spec-names-section">
            <div v-for="(specName, sIdx) in formData.specNames" :key="sIdx" class="spec-name-row">
              <el-form-item :label="$t('product.specNameLabel', { index: sIdx + 1 })" :prop="`specNames.${sIdx}.name`" :rules="specNameRules">
                <div class="spec-name-inline">
                  <el-input v-model="specName.name" :placeholder="$t('product.specNamePlaceholder')" style="width:160px" />
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
                    <el-button v-else size="small" @click="showSpecValueInput(sIdx)">{{ $t('product.addSpecValue') }}</el-button>
                  </div>
                  <el-button :icon="Delete" type="danger" circle size="small" @click="removeSpecName(sIdx)" v-if="formData.specNames.length > 1" />
                </div>
              </el-form-item>
            </div>
            <el-button type="primary" plain size="small" @click="addSpecName" style="margin-left:100px">{{ $t('product.addSpecName') }}</el-button>
          </div>

          <!-- SKU 表格 -->
          <el-divider content-position="left">{{ $t('product.skuList') }}</el-divider>
          <div class="sku-table-wrapper">
            <el-table :data="formData.skus" border size="small" style="width:100%">
              <el-table-column type="index" label="#" width="50" align="center" />
              <el-table-column
                v-for="(specName, sIdx) in formData.specNames"
                :key="sIdx"
                :label="specName.name || $t('product.specNameLabel', { index: sIdx + 1 })"
                :prop="`specValues.${sIdx}`"
                width="120"
                align="center"
              >
                <template #default="{ row }">
                  <span>{{ row.specValues?.[sIdx] || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('product.skuCode')" prop="skuCode" width="150" align="center">
                <template #default="{ row }">
                  <el-input v-model="row.skuCode" size="small" :placeholder="$t('product.skuAutoGen')" />
                </template>
              </el-table-column>
              <el-table-column :label="$t('product.goodsPrice')" prop="price" width="130" align="center">
                <template #default="{ row }">
                  <el-input-number v-model="row.price" :precision="2" :min="0" size="small" controls-position="right" style="width:100%" />
                </template>
              </el-table-column>
              <el-table-column :label="$t('product.goodsCostPrice')" prop="costPrice" width="130" align="center">
                <template #default="{ row }">
                  <el-input-number v-model="row.costPrice" :precision="2" :min="0" size="small" controls-position="right" style="width:100%" />
                </template>
              </el-table-column>
              <el-table-column :label="$t('product.goodsStock')" prop="stock" width="110" align="center">
                <template #default="{ row }">
                  <el-input-number v-model="row.stock" :min="0" size="small" controls-position="right" style="width:100%" />
                </template>
              </el-table-column>
              <el-table-column :label="$t('product.goodsStatus')" prop="status" width="80" align="center">
                <template #default="{ row }">
                  <el-switch v-model="row.status" :active-value="1" :inactive-value="0" size="small" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>

        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item :label="$t('product.goodsRemark')" prop="remark">
              <el-input v-model="formData.remark" type="textarea" :rows="3" :placeholder="$t('product.inputRemark')" />
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
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const categoryOptions = computed(() => [
  { value: '电子产品', label: t('menu.productGoods') },
  { value: '办公用品', label: 'Office' },
  { value: '食品饮料', label: 'Food' },
  { value: '服装鞋帽', label: 'Clothing' },
  { value: '家居用品', label: 'Home' },
  { value: '原材料', label: 'Materials' }
])

const searchItems = computed(() => [
  { prop: 'goodsCode', label: t('product.goodsCode'), type: 'input' },
  { prop: 'goodsName', label: t('product.goodsName'), type: 'input' },
  { prop: 'category', label: t('product.goodsCategory'), type: 'select', options: categoryOptions.value },
  { prop: 'brand', label: t('product.goodsBrand'), type: 'input' }
])

const columns = computed(() => [
  { prop: 'goodsCode', label: t('product.goodsCode'), width: 150 },
  { prop: 'goodsName', label: t('product.goodsName'), minWidth: 150 },
  { prop: 'category', label: t('product.goodsCategory'), width: 110 },
  { prop: 'brand', label: t('product.goodsBrand'), width: 100 },
  { prop: 'specType', label: t('product.goodsSpecType'), width: 90, slot: 'specType' },
  { prop: 'skuCount', label: 'SKU', width: 90, slot: 'skuCount' },
  { prop: 'unit', label: t('product.goodsUnit'), width: 60, align: 'center' },
  { prop: 'price', label: t('product.goodsPrice'), width: 100 },
  { prop: 'stock', label: t('product.goodsStock'), width: 80, align: 'center' },
  { prop: 'status', label: t('product.goodsStatus'), width: 80, slot: 'status' },
  { prop: 'createTime', label: t('product.goodsCreateTime'), width: 170 }
])

const formRules = computed(() => ({
  goodsCode: [{ required: true, message: t('product.inputGoodsCode'), trigger: 'blur' }],
  goodsName: [{ required: true, message: t('product.inputGoodsName'), trigger: 'blur' }],
  category: [{ required: true, message: t('product.selectCategory'), trigger: 'change' }]
}))

const specNameRules = computed(() => [{ required: true, message: t('product.specRequired'), trigger: 'blur' }])

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
  dialogTitle.value = t('product.addGoods')
  Object.assign(formData, defaultFormData())
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = t('product.editGoods')
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
      ElMessage.warning(t('product.specRequired'))
      return
    }
    const hasNoValues = formData.specNames.some(sn => sn.values.length === 0)
    if (hasNoValues) {
      ElMessage.warning(t('product.specValueRequired'))
      return
    }
    if (formData.skus.length === 0) {
      ElMessage.warning(t('product.skuRequired'))
      return
    }
  }

  submitLoading.value = true
  try {
    await new Promise(r => setTimeout(r, 500))
    ElMessage.success(t('common.success'))
    dialogVisible.value = false
    loadData()
  } catch {
    ElMessage.error(t('common.failed'))
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(t('product.deleteGoodsConfirm', { name: row.goodsName }), t('header.tips'), { type: 'warning' })
  ElMessage.success(t('common.success'))
  loadData()
}

async function handleBatchDelete() {
  if (!selectedRows.value.length) return ElMessage.warning(t('product.selectCategory'))
  await ElMessageBox.confirm(t('product.batchDeleteGoodsConfirm', { count: selectedRows.value.length }), t('header.tips'), { type: 'warning' })
  ElMessage.success(t('common.success'))
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