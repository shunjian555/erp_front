<template>
  <div class="page-container">
    <el-alert title="多账簿管理" type="info" :closable="false" show-icon style="margin-bottom: 16px">
      <template #default>支持多会计准则并行记账（中国企业会计准则 / 国际财务报告准则 / 美国通用会计准则 / 台湾 GAAP），可设置账簿间的折算规则与差异调整。</template>
    </el-alert>
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增账簿</el-button>
        <el-button :icon="Connection" @click="handleCompare">账簿对比</el-button>
        <el-button :icon="Download" plain @click="handleExport">导出</el-button>
      </div>
    </div>
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #standard="{ row }"><el-tag :type="standardMap[row.standard]?.type || ''" size="small">{{ standardMap[row.standard]?.label || row.standard }}</el-tag></template>
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</BaseStatusTag></template>
      <template #isDefault="{ row }">{{ row.isDefault ? '是' : '-' }}</template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 3)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 3" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown><el-dropdown-menu><el-dropdown-item v-for="action in getActions(row).slice(3)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item></el-dropdown-menu></template>
        </el-dropdown>
      </template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>
    <el-dialog v-model="viewVisible" title="账簿详情" width="500px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="账簿编码">{{ viewRow.code }}</el-descriptions-item>
        <el-descriptions-item label="账簿名称">{{ viewRow.name }}</el-descriptions-item>
        <el-descriptions-item label="会计准则">{{ standardMap[viewRow.standard]?.label }}</el-descriptions-item>
        <el-descriptions-item label="本位币">{{ viewRow.currency }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ viewRow.status === 1 ? '启用' : '停用' }}</el-descriptions-item>
        <el-descriptions-item label="默认账簿">{{ viewRow.isDefault ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="汇率来源">{{ viewRow.rateSource || '-' }}</el-descriptions-item>
        <el-descriptions-item label="会计年度" :span="2">{{ viewRow.fiscalYear }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Connection, Download, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
const standardMap = {
  CAS: { label: '中国企业会计准则', type: 'primary' },
  IFRS: { label: '国际财务报告准则', type: 'success' },
  USGAAP: { label: '美国通用会计准则', type: 'warning' },
  TWGAAP: { label: '台湾 GAAP', type: 'info' }
}
const searchItems = [{ prop: 'name', label: '账簿名称', type: 'input' }, { prop: 'standard', label: '准则', type: 'select', options: Object.entries(standardMap).map(([k, v]) => ({ value: k, label: v.label })) }]
const columns = [{ prop: 'code', label: '编码', width: 120 }, { prop: 'name', label: '账簿名称', width: 180 }, { prop: 'standard', label: '会计准则', width: 160, slot: 'standard' }, { prop: 'currency', label: '本位币', width: 80, align: 'center' }, { prop: 'fiscalYear', label: '会计年度', width: 110, align: 'center' }, { prop: 'isDefault', label: '默认', width: 80, align: 'center', slot: 'isDefault' }, { prop: 'status', label: '状态', width: 80, slot: 'status' }]
const formItems = [{ prop: 'code', label: '编码', type: 'input', span: 12 }, { prop: 'name', label: '名称', type: 'input', span: 12 }, { prop: 'standard', label: '会计准则', type: 'select', options: Object.entries(standardMap).map(([k, v]) => ({ value: k, label: v.label })), span: 12 }, { prop: 'currency', label: '本位币', type: 'select', options: [{ value: 'CNY', label: 'CNY 人民币' }, { value: 'USD', label: 'USD 美元' }, { value: 'EUR', label: 'EUR 欧元' }, { value: 'HKD', label: 'HKD 港币' }], span: 12 }, { prop: 'fiscalYear', label: '会计年度', type: 'input', span: 12 }, { prop: 'rateSource', label: '汇率来源', type: 'input', span: 12 }, { prop: 'isDefault', label: '默认账簿', type: 'radio', options: [{ value: true, label: '是' }, { value: false, label: '否' }], span: 24 }, { prop: 'status', label: '状态', type: 'radio', options: [{ value: 1, label: '启用' }, { value: 0, label: '停用' }], span: 24 }]
const formRules = { code: [{ required: true, message: '请输入编码', trigger: 'blur' }], name: [{ required: true, message: '请输入名称', trigger: 'blur' }] }
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, name: '', standard: '' })
const formData = reactive({ id: undefined, code: '', name: '', standard: 'CAS', currency: 'CNY', fiscalYear: '2024', rateSource: '', isDefault: false, status: 1 })
async function loadData() {
  loading.value = true
  try {
    const all = [
      { id: 1, code: 'B001', name: '中国准则账簿', standard: 'CAS', currency: 'CNY', fiscalYear: '2024', isDefault: true, status: 1, rateSource: '中国人民银行' },
      { id: 2, code: 'B002', name: 'IFRS 合并账簿', standard: 'IFRS', currency: 'CNY', fiscalYear: '2024', isDefault: false, status: 1, rateSource: '路透社' },
      { id: 3, code: 'B003', name: 'USGAAP 报告账簿', standard: 'USGAAP', currency: 'USD', fiscalYear: '2024', isDefault: false, status: 1, rateSource: '美联储' },
      { id: 4, code: 'B004', name: '台湾子公司账簿', standard: 'TWGAAP', currency: 'TWD', fiscalYear: '2024', isDefault: false, status: 0, rateSource: '' }
    ]
    const { name = '', standard = '', pageNum = 1, pageSize = 10 } = queryParams
    let filtered = all
    if (name) filtered = filtered.filter(x => x.name.includes(name))
    if (standard) filtered = filtered.filter(x => x.standard === standard)
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增账簿'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.standard = 'CAS'; formData.currency = 'CNY'; formData.fiscalYear = '2024'; formData.isDefault = false; formData.status = 1; dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑账簿'; Object.assign(formData, r); dialogVisible.value = true }
function handleCompare() { ElMessage.success('已生成 IFRS 与 CAS 差异分析报告') }
function handleExport() { exportToExcel(tableData.value, columns, '账簿列表') }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除「${row.name}」?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
function getActions(row) {
  const actions = [{ key: 'view', label: '查看', type: 'primary', handler: handleView }, { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit }]
  actions.push({ key: 'toggle', label: row.status === 1 ? '停用' : '启用', type: 'warning', handler: (r) => { r.status = r.status === 1 ? 0 : 1; ElMessage.success(r.status === 1 ? '已启用' : '已停用') } })
  if (!row.isDefault) actions.push({ key: 'setDefault', label: '设为默认', type: 'success', handler: (r) => { r.isDefault = true; ElMessage.success('已设为默认账簿') } })
  actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete })
  return actions
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
<style lang="scss" scoped>.table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }</style>
