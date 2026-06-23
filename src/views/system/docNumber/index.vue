<template>
  <div class="page-container">
    <el-alert title="单据编号规则" type="info" :closable="false" show-icon style="margin-bottom: 16px">
      <template #default>支持自定义各种业务单据的编号生成规则，可使用前缀、日期、流水号、变量替换。例如：SO202407-0001</template>
    </el-alert>
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增规则</el-button>
        <el-button :icon="VideoPlay" @click="handlePreview">预览</el-button>
      </div>
    </div>
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</BaseStatusTag></template>
      <template #preview="{ row }">
        <el-tag size="small" type="primary" effect="plain">{{ generatePreview(row) }}</el-tag>
      </template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 3)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 3" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown><el-dropdown-menu><el-dropdown-item v-for="action in getActions(row).slice(3)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item></el-dropdown-menu></template>
        </el-dropdown>
      </template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog">
      <el-form :model="formData" label-width="120px">
        <el-form-item label="单据类型" required>
          <el-select v-model="formData.docType" style="width: 100%">
            <el-option v-for="d in docTypes" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则名称" required><el-input v-model="formData.name" /></el-form-item>
        <el-form-item label="前缀"><el-input v-model="formData.prefix" placeholder="如 SO" /></el-form-item>
        <el-form-item label="日期格式">
          <el-select v-model="formData.dateFormat" style="width: 100%">
            <el-option label="无" value="" /><el-option label="YYYY" value="YYYY" /><el-option label="YYYYMM" value="YYYYMM" /><el-option label="YYYY-MM-DD" value="YYYY-MM-DD" />
            <el-option label="YYMM" value="YYMM" />
          </el-select>
        </el-form-item>
        <el-form-item label="流水号位数">
          <el-input-number v-model="formData.serialLength" :min="0" :max="10" style="width: 100%" />
        </el-form-item>
        <el-form-item label="连接符">
          <el-radio-group v-model="formData.separator">
            <el-radio value="">无</el-radio><el-radio value="-">-</el-radio><el-radio value="_">_</el-radio><el-radio value="/">/</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="重置周期">
          <el-radio-group v-model="formData.resetCycle">
            <el-radio value="none">不重置</el-radio><el-radio value="day">每日</el-radio><el-radio value="month">每月</el-radio><el-radio value="year">每年</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="预览">
          <el-tag type="success" size="large">{{ generatePreview(formData) }}</el-tag>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio><el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </BaseDialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, VideoPlay, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
import { browserPrint } from '@/utils/print'
const docTypes = [
  { value: 'SO', label: '销售订单 SO' }, { value: 'PO', label: '采购订单 PO' }, { value: 'IO', label: '入库单 IO' }, { value: 'OO', label: '出库单 OO' },
  { value: 'TF', label: '调拨单 TF' }, { value: 'PI', label: '采购发票 PI' }, { value: 'SI', label: '销售发票 SI' }, { value: 'RV', label: '收款单 RV' }, { value: 'PV', label: '付款单 PV' }
]
const searchItems = [{ prop: 'name', label: '规则名称', type: 'input' }]
const columns = [{ prop: 'name', label: '规则名称', width: 180 }, { prop: 'docType', label: '单据类型', width: 140 }, { prop: 'prefix', label: '前缀', width: 80, align: 'center' }, { prop: 'dateFormat', label: '日期格式', width: 130, align: 'center' }, { prop: 'serialLength', label: '流水号位数', width: 110, align: 'center' }, { prop: 'resetCycle', label: '重置周期', width: 100, align: 'center' }, { prop: 'preview', label: '预览', width: 200, slot: 'preview' }, { prop: 'status', label: '状态', width: 80, slot: 'status' }]
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false)
const queryParams = reactive({ pageNum: 1, pageSize: 10, name: '' })
const formData = reactive({ id: undefined, docType: 'SO', name: '', prefix: 'SO', dateFormat: 'YYYYMM', serialLength: 4, separator: '', resetCycle: 'month', status: 1 })
function generatePreview(r) {
  if (!r.prefix && !r.dateFormat) return `(纯流水 ${r.serialLength}位)`
  let date = ''
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  if (r.dateFormat === 'YYYY') date = String(now.getFullYear())
  else if (r.dateFormat === 'YYYYMM') date = `${now.getFullYear()}${pad(now.getMonth() + 1)}`
  else if (r.dateFormat === 'YYMM') date = `${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}`
  else if (r.dateFormat === 'YYYY-MM-DD') date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const serial = '0'.repeat(r.serialLength || 0).replace(/0/g, () => '') + '1'.padStart(r.serialLength || 1, '0')
  const sep = r.separator || ''
  return [r.prefix, date, serial].filter(Boolean).join(sep)
}
async function loadData() {
  loading.value = true
  try {
    const all = [
      { id: 1, docType: 'SO', name: '销售订单规则', prefix: 'SO', dateFormat: 'YYYYMM', serialLength: 4, separator: '', resetCycle: 'month', status: 1 },
      { id: 2, docType: 'PO', name: '采购订单规则', prefix: 'PO', dateFormat: 'YYYYMM', serialLength: 4, separator: '', resetCycle: 'month', status: 1 },
      { id: 3, docType: 'IO', name: '入库单规则', prefix: 'IO', dateFormat: 'YYYYMMDD', serialLength: 4, separator: '-', resetCycle: 'day', status: 1 },
      { id: 4, docType: 'OO', name: '出库单规则', prefix: 'OO', dateFormat: 'YYYYMMDD', serialLength: 4, separator: '-', resetCycle: 'day', status: 1 },
      { id: 5, docType: 'TF', name: '调拨单规则', prefix: 'TF', dateFormat: 'YYYYMM', serialLength: 4, separator: '', resetCycle: 'month', status: 1 },
      { id: 6, docType: 'RV', name: '收款单规则', prefix: 'RV', dateFormat: 'YYYY', serialLength: 5, separator: '', resetCycle: 'year', status: 1 },
      { id: 7, docType: 'PV', name: '付款单规则', prefix: 'PV', dateFormat: 'YYYY', serialLength: 5, separator: '', resetCycle: 'year', status: 0 }
    ]
    const { name = '', pageNum = 1, pageSize = 10 } = queryParams
    let filtered = all
    if (name) filtered = filtered.filter(x => x.name.includes(name))
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增编号规则'; formData.id = undefined; formData.docType = 'SO'; formData.name = ''; formData.prefix = 'SO'; formData.dateFormat = 'YYYYMM'; formData.serialLength = 4; formData.separator = ''; formData.resetCycle = 'month'; formData.status = 1; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑编号规则'; Object.assign(formData, r); dialogVisible.value = true }
function handlePreview() { browserPrint({ title: `单据编号预览 - ${formData.module}` }) }
async function handleSubmit() { if (!formData.name) return ElMessage.warning('请输入规则名称'); submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('保存成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('保存失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除「${row.name}」?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
function getActions(row) {
  return [
    { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit },
    { key: 'toggle', label: row.status === 1 ? '停用' : '启用', type: 'warning', handler: (r) => { r.status = r.status === 1 ? 0 : 1; ElMessage.success(r.status === 1 ? '已启用' : '已停用') } },
    { key: 'reset', label: '重置流水', type: 'success', handler: (r) => ElMessage.success(`已重置 ${r.name} 流水号`) },
    { key: 'delete', label: '删除', type: 'danger', handler: handleDelete }
  ]
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
<style lang="scss" scoped>.table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } }</style>
