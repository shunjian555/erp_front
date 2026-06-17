<template>
  <div class="page-container subject-page">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />

    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd()">新增科目</el-button>
        <el-button :icon="Folder" plain @click="handleExpandAll">{{ expandAll ? '折叠' : '展开' }}全部</el-button>
        <el-button :icon="Download" plain @click="handleExport">导出</el-button>
        <el-button :icon="Upload" plain @click="handleImport">导入预置</el-button>
      </div>
      <div class="toolbar-right">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="tree">树形视图</el-radio-button>
          <el-radio-button label="table">平铺视图</el-radio-button>
        </el-radio-group>
        <el-button :icon="Refresh" circle @click="loadData" />
      </div>
    </div>

    <!-- 树形视图 -->
    <div v-if="viewMode === 'tree'" class="subject-tree">
      <el-table
        ref="treeTableRef"
        v-loading="loading"
        :data="filteredTreeData"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="expandAll"
        :border="true"
        :row-class-name="rowClassName"
      >
        <el-table-column prop="code" label="科目编码" width="180" />
        <el-table-column prop="name" label="科目名称" min-width="180" />
        <el-table-column label="类别" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="categoryTagType(row.category)" size="small">{{ categoryName(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="余额方向" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.direction === 'debit' ? 'success' : 'danger'" size="small">
              {{ row.direction === 'debit' ? '借方' : '贷方' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="辅助核算" width="220" align="center">
          <template #default="{ row }">
            <el-tag v-for="a in parseAssist(row.assistType)" :key="a" size="small" type="info" effect="plain" style="margin-right: 4px">
              {{ assistName(a) }}
            </el-tag>
            <span v-if="!row.assistType" class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="openingDebit" label="期初借方" width="120" align="right">
          <template #default="{ row }">{{ formatMoney(row.openingDebit) }}</template>
        </el-table-column>
        <el-table-column prop="openingCredit" label="期初贷方" width="120" align="right">
          <template #default="{ row }">{{ formatMoney(row.openingCredit) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <BaseStatusTag :type="row.isActive ? 'success' : 'danger'">
              {{ row.isActive ? '启用' : '停用' }}
            </BaseStatusTag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="!row.isLeaf" type="primary" link size="small" @click="handleAdd(row)">新增下级</el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link size="small" @click="handleSetOpening(row)">期初</el-button>
            <el-button type="danger" link size="small" :disabled="!canDelete(row)" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 平铺视图 -->
    <div v-else class="subject-flat">
      <BaseTable
        :columns="flatColumns"
        :table-data="flatData"
        :loading="loading"
        :total="flatTotal"
        :current-page.sync="queryParams.pageNum"
        :page-size.sync="queryParams.pageSize"
        :show-index="true"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #category="{ row }">
          <el-tag :type="categoryTagType(row.category)" size="small">{{ categoryName(row.category) }}</el-tag>
        </template>
        <template #direction="{ row }">
          <el-tag :type="row.direction === 'debit' ? 'success' : 'danger'" size="small">
            {{ row.direction === 'debit' ? '借方' : '贷方' }}
          </el-tag>
        </template>
        <template #assistType="{ row }">
          <el-tag v-for="a in parseAssist(row.assistType)" :key="a" size="small" type="info" effect="plain" style="margin-right: 4px">
            {{ assistName(a) }}
          </el-tag>
          <span v-if="!row.assistType" class="text-muted">—</span>
        </template>
        <template #openingDebit="{ row }">{{ formatMoney(row.openingDebit) }}</template>
        <template #openingCredit="{ row }">{{ formatMoney(row.openingCredit) }}</template>
        <template #isActive="{ row }">
          <BaseStatusTag :type="row.isActive ? 'success' : 'danger'">
            {{ row.isActive ? '启用' : '停用' }}
          </BaseStatusTag>
        </template>
        <template #operation="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="primary" link size="small" @click="handleSetOpening(row)">期初</el-button>
          <el-button type="danger" link size="small" :disabled="!canDelete(row)" @click="handleDelete(row)">删除</el-button>
        </template>
      </BaseTable>
    </div>

    <!-- 编辑对话框 -->
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog">
      <BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" />
    </BaseDialog>

    <!-- 期初余额对话框 -->
    <BaseDialog v-model="openingDialogVisible" title="设置期初余额" width="500px" :confirm-loading="openingSubmitting" @confirm="handleOpeningSubmit" @cancel="openingDialogVisible = false">
      <el-alert :title="`科目：${openingForm.subjectCode} ${openingForm.subjectName}`" type="info" :closable="false" style="margin-bottom: 16px" />
      <el-form :model="openingForm" label-width="100px">
        <el-form-item label="年度">
          <el-select v-model="openingForm.year" style="width: 100%">
            <el-option v-for="y in [2024, 2025, 2026]" :key="y" :label="`${y}年`" :value="y" />
          </el-select>
        </el-form-item>
        <el-form-item label="期初借方">
          <el-input-number v-model="openingForm.openingDebit" :precision="2" :min="0" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="期初贷方">
          <el-input-number v-model="openingForm.openingCredit" :precision="2" :min="0" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-alert type="warning" :closable="false" show-icon>
          <template #title>期初余额只允许在第一个会计期间结账前设置</template>
        </el-alert>
      </el-form>
    </BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Upload, Folder, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
import request from '@/utils/request'

const searchItems = [
  { prop: 'code', label: '科目编码', type: 'input', span: 6 },
  { prop: 'name', label: '科目名称', type: 'input', span: 6 },
  { prop: 'category', label: '科目类别', type: 'select', span: 6, options: [
    { value: '', label: '全部' },
    { value: 'asset', label: '资产类' },
    { value: 'liability', label: '负债类' },
    { value: 'equity', label: '所有者权益' },
    { value: 'cost', label: '成本类' },
    { value: 'profit', label: '损益类' }
  ]}
]

const flatColumns = [
  { prop: 'code', label: '科目编码', width: 160, fixed: true },
  { prop: 'name', label: '科目名称', minWidth: 160 },
  { prop: 'category', label: '类别', width: 100, slot: 'category' },
  { prop: 'direction', label: '方向', width: 80, slot: 'direction' },
  { prop: 'assistType', label: '辅助核算', minWidth: 180, slot: 'assistType' },
  { prop: 'openingDebit', label: '期初借方', width: 120, slot: 'openingDebit', align: 'right' },
  { prop: 'openingCredit', label: '期初贷方', width: 120, slot: 'openingCredit', align: 'right' },
  { prop: 'isActive', label: '状态', width: 80, slot: 'isActive' }
]

const ASSIST_OPTIONS = [
  { value: 'customer', label: '客户' },
  { value: 'supplier', label: '供应商' },
  { value: 'dept', label: '部门' },
  { value: 'staff', label: '职员' },
  { value: 'project', label: '项目' },
  { value: 'goods', label: '商品' },
  { value: 'warehouse', label: '仓库' },
  { value: 'bankAccount', label: '银行账户' }
]

const formItems = [
  { prop: 'code', label: '科目编码', type: 'input', span: 12, placeholder: '如 1001 或 1001.01' },
  { prop: 'name', label: '科目名称', type: 'input', span: 12 },
  { prop: 'parentId', label: '上级科目', type: 'input', span: 12, disabled: true },
  { prop: 'category', label: '科目类别', type: 'select', span: 12, options: [
    { value: 'asset', label: '资产类' },
    { value: 'liability', label: '负债类' },
    { value: 'equity', label: '所有者权益' },
    { value: 'cost', label: '成本类' },
    { value: 'profit', label: '损益类' }
  ] },
  { prop: 'direction', label: '余额方向', type: 'radio', span: 12, options: [
    { value: 'debit', label: '借方' },
    { value: 'credit', label: '贷方' }
  ] },
  { prop: 'isActive', label: '状态', type: 'radio', span: 12, options: [
    { value: true, label: '启用' },
    { value: false, label: '停用' }
  ] },
  { prop: 'assistType', label: '辅助核算', type: 'select', span: 24, multiple: true, options: ASSIST_OPTIONS }
]

const formRules = {
  code: [{ required: true, message: '请输入科目编码', trigger: 'blur' }, { pattern: /^\d{4}(\.\d{2})?$/, message: '编码格式：4位数字 或 4位数字.2位数字', trigger: 'blur' }],
  name: [{ required: true, message: '请输入科目名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择科目类别', trigger: 'change' }],
  direction: [{ required: true, message: '请选择余额方向', trigger: 'change' }]
}

const loading = ref(false)
const treeData = ref([])
const flatData = ref([])
const flatTotal = ref(0)
const viewMode = ref('tree')
const expandAll = ref(false)
const treeTableRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 20, code: '', name: '', category: '' })

const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const formRef = ref(null)
const formData = reactive({ id: undefined, code: '', name: '', parentId: null, parentCode: '', category: 'asset', direction: 'debit', isActive: true, assistType: [] })

const openingDialogVisible = ref(false)
const openingSubmitting = ref(false)
const openingForm = reactive({ id: null, subjectCode: '', subjectName: '', year: 2025, openingDebit: 0, openingCredit: 0 })

async function loadData() {
  loading.value = true
  try {
    const res = await request({ url: '/api/finance/subject/list', method: 'get', params: { pageNum: 1, pageSize: 1000 } })
    const all = res.data.list || []
    flatData.value = all
    flatTotal.value = all.length
    treeData.value = buildTree(all, null)
  } finally {
    loading.value = false
  }
}

function buildTree(list, parentId) {
  return list.filter(s => s.parentId === parentId).map(s => ({
    ...s,
    hasChildren: list.some(x => x.parentId === s.id),
    children: buildTree(list, s.id)
  }))
}

const filteredTreeData = computed(() => {
  let data = treeData.value
  if (queryParams.code) {
    data = filterTree(data, n => n.code.includes(queryParams.code))
  }
  if (queryParams.name) {
    data = filterTree(data, n => n.name.includes(queryParams.name))
  }
  if (queryParams.category) {
    data = filterTree(data, n => n.category === queryParams.category)
  }
  return data
})

function filterTree(data, predicate) {
  const result = []
  data.forEach(n => {
    const childMatched = n.children ? filterTree(n.children, predicate) : []
    if (predicate(n) || childMatched.length) {
      result.push({ ...n, children: childMatched })
    }
  })
  return result
}

function rowClassName({ row }) {
  return row.isLeaf ? 'leaf-row' : 'category-row'
}

function categoryName(c) {
  return { asset: '资产类', liability: '负债类', equity: '权益类', cost: '成本类', profit: '损益类' }[c] || c
}
function categoryTagType(c) {
  return { asset: 'success', liability: 'warning', equity: 'info', cost: '', profit: 'danger' }[c] || ''
}
function parseAssist(s) {
  if (!s) return []
  return s.split(',').filter(Boolean)
}
function assistName(v) {
  return ASSIST_OPTIONS.find(o => o.value === v)?.label || v
}
function formatMoney(v) {
  if (!v && v !== 0) return ''
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function canDelete(row) {
  if (!row.isLeaf) return false
  return row.openingDebit === 0 && row.openingCredit === 0
}

function handleExpandAll() {
  expandAll.value = !expandAll.value
}

function handleAdd(parent) {
  dialogTitle.value = parent ? `新增下级科目（上级：${parent.code} ${parent.name}）` : '新增一级科目'
  Object.keys(formData).forEach(k => {
    if (Array.isArray(formData[k])) formData[k] = []
    else if (typeof formData[k] === 'boolean') formData[k] = true
    else if (typeof formData[k] === 'number') formData[k] = null
    else formData[k] = ''
  })
  formData.id = undefined
  if (parent) {
    formData.parentId = parent.id
    formData.parentCode = `${parent.code} ${parent.name}`
    formData.category = parent.category
  } else {
    formData.parentId = null
  }
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑科目'
  Object.assign(formData, row)
  formData.assistType = parseAssist(row.assistType)
  dialogVisible.value = true
}

function cancelDialog() {
  dialogVisible.value = false
  formRef.value?.resetFields?.()
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    await request({
      url: '/api/finance/subject/save',
      method: 'post',
      data: { ...formData, assistType: (formData.assistType || []).join(',') }
    })
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    submitLoading.value = false
  }
}

function handleSetOpening(row) {
  openingForm.id = row.id
  openingForm.subjectCode = row.code
  openingForm.subjectName = row.name
  openingForm.year = 2025
  openingForm.openingDebit = row.openingDebit
  openingForm.openingCredit = row.openingCredit
  openingDialogVisible.value = true
}

async function handleOpeningSubmit() {
  openingSubmitting.value = true
  try {
    await request({
      url: '/api/finance/subject/save',
      method: 'post',
      data: { id: openingForm.id, openingDebit: openingForm.openingDebit, openingCredit: openingForm.openingCredit }
    })
    ElMessage.success('期初余额设置成功')
    openingDialogVisible.value = false
    loadData()
  } finally {
    openingSubmitting.value = false
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除科目【${row.code} ${row.name}】?`, '提示', { type: 'warning' })
  await request({ url: '/api/finance/subject/delete', method: 'post', data: { id: row.id } })
  ElMessage.success('删除成功')
  loadData()
}

function handleSearch(p) {
  Object.assign(queryParams, p, { pageNum: 1 })
}
function handleReset() {
  Object.keys(queryParams).forEach(k => { if (!['pageNum', 'pageSize'].includes(k)) queryParams[k] = '' })
}
function handlePageChange(p) { queryParams.pageNum = p }
function handleSizeChange(s) { queryParams.pageSize = s }

function handleExport() {
  ElMessage.success('科目已导出为 Excel（mock）')
}
function handleImport() {
  ElMessageBox.confirm('将导入小企业会计准则预置科目体系（59个），是否继续？', '导入预置科目', { type: 'info' })
    .then(async () => {
      const res = await request({ url: '/api/finance/subject/import', method: 'post' })
      ElMessage.success(res.message)
      loadData()
    })
    .catch(() => {})
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.subject-page {
  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 14px 18px;
    background: #fff;
    border-radius: var(--border-radius-base);
    .toolbar-left { display: flex; gap: 10px; }
    .toolbar-right { display: flex; gap: 8px; align-items: center; }
  }
  .subject-tree, .subject-flat {
    background: #fff;
    padding: 16px;
    border-radius: var(--border-radius-base);
  }
  :deep(.leaf-row) {
    font-weight: normal;
  }
  :deep(.category-row) {
    font-weight: bold;
    background: #fafbfc;
  }
  .text-muted { color: #c0c4cc; }
}
</style>
