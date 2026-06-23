<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增订单</el-button>
        <el-button type="success" :icon="VideoPlay" plain @click="handleBatchRelease" :disabled="!selectedRows.length">批量下达</el-button>
        <el-button :icon="Download" plain>导出</el-button>
      </div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #progress="{ row }">
        <el-progress :percentage="row.plannedQty ? Math.round(row.completedQty / row.plannedQty * 100) : 0" :stroke-width="14" :color="['#67c23a', '#e6a23c', '#f56c6c']" />
      </template>
      <template #priority="{ row }"><el-tag :type="priorityMap[row.priority]?.type || 'info'" size="small">{{ row.priority }}</el-tag></template>
      <template #status="{ row }"><el-tag :type="statusMap[row.status]?.type || 'info'" size="small">{{ statusMap[row.status]?.label || '未知' }}</el-tag></template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 3)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 3" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="action in getActions(row).slice(3)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </BaseTable>

    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="700px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>

    <el-dialog v-model="viewVisible" title="生产订单详情" width="760px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="订单号">{{ viewRow.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="statusMap[viewRow.status]?.type" size="small">{{ statusMap[viewRow.status]?.label }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="产品编码">{{ viewRow.productCode }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ viewRow.productName }}</el-descriptions-item>
        <el-descriptions-item label="规格">{{ viewRow.spec }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ viewRow.unit }}</el-descriptions-item>
        <el-descriptions-item label="计划数量">{{ viewRow.plannedQty }}</el-descriptions-item>
        <el-descriptions-item label="完成数量">{{ viewRow.completedQty }}</el-descriptions-item>
        <el-descriptions-item label="报废数量">{{ viewRow.scrapQty }}</el-descriptions-item>
        <el-descriptions-item label="完成率">{{ viewRow.plannedQty ? Math.round(viewRow.completedQty / viewRow.plannedQty * 100) : 0 }}%</el-descriptions-item>
        <el-descriptions-item label="计划开始">{{ viewRow.planStartDate }}</el-descriptions-item>
        <el-descriptions-item label="计划结束">{{ viewRow.planEndDate }}</el-descriptions-item>
        <el-descriptions-item label="实际开始">{{ viewRow.actualStartDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="实际结束">{{ viewRow.actualEndDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="车间">{{ viewRow.workshop }}</el-descriptions-item>
        <el-descriptions-item label="优先级"><el-tag :type="priorityMap[viewRow.priority]?.type" size="small">{{ viewRow.priority }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="来源单号">{{ viewRow.sourceNo }}</el-descriptions-item>
        <el-descriptions-item label="创建人" :span="2">{{ viewRow.createBy }}（{{ viewRow.createTime }}）</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Refresh, ArrowDown, VideoPlay } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import request from '@/utils/request'

const statusMap = {
  0: { label: '草稿', type: 'info' },
  1: { label: '已审核', type: 'primary' },
  2: { label: '已下达', type: 'success' },
  3: { label: '生产中', type: 'warning' },
  4: { label: '部分入库', type: 'warning' },
  5: { label: '已完工', type: 'success' },
  6: { label: '已关闭', type: 'info' }
}
const priorityMap = { '低': { type: 'info' }, '普通': { type: 'primary' }, '高': { type: 'warning' }, '紧急': { type: 'danger' } }

const searchItems = [
  { prop: 'orderNo', label: '订单号', type: 'input' },
  { prop: 'productName', label: '产品名称', type: 'input' },
  { prop: 'workshop', label: '车间', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: Object.entries(statusMap).map(([v, l]) => ({ value: Number(v), label: l.label })) }
]
const columns = [
  { prop: 'orderNo', label: '订单号', width: 200 },
  { prop: 'productName', label: '产品名称', minWidth: 140 },
  { prop: 'plannedQty', label: '计划数量', width: 90, align: 'right' },
  { prop: 'completedQty', label: '已完成', width: 90, align: 'right' },
  { prop: 'progress', label: '完工率', width: 160, slot: 'progress' },
  { prop: 'planStartDate', label: '计划开始', width: 110 },
  { prop: 'planEndDate', label: '计划结束', width: 110 },
  { prop: 'workshop', label: '车间', width: 130 },
  { prop: 'priority', label: '优先级', width: 90, slot: 'priority' },
  { prop: 'status', label: '状态', width: 100, slot: 'status' }
]
const formItems = [
  { prop: 'orderNo', label: '订单号', type: 'input' },
  { prop: 'productCode', label: '产品编码', type: 'input' },
  { prop: 'productName', label: '产品名称', type: 'input' },
  { prop: 'plannedQty', label: '计划数量', type: 'number' },
  { prop: 'unit', label: '单位', type: 'input' },
  { prop: 'workshop', label: '车间', type: 'input' },
  { prop: 'planStartDate', label: '计划开始', type: 'date' },
  { prop: 'planEndDate', label: '计划结束', type: 'date' },
  { prop: 'priority', label: '优先级', type: 'select', options: Object.keys(priorityMap).map(k => ({ label: k, value: k })) },
  { prop: 'sourceNo', label: '来源单号', type: 'input' }
]
const formRules = {
  orderNo: [{ required: true, message: '请输入订单号', trigger: 'blur' }],
  productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }]
}

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, orderNo: '', productName: '', workshop: '', status: '' })
const formData = reactive({ id: undefined, orderNo: '', productCode: '', productName: '', plannedQty: 0, unit: '套', workshop: '', planStartDate: '', planEndDate: '', priority: '普通', sourceNo: '' })
const viewVisible = ref(false), viewRow = ref(null)

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/production/order/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }
function handleAdd() { dialogTitle.value = '新增生产订单'; Object.keys(formData).forEach(k => formData[k] = ''); formData.priority = '普通'; formData.unit = '套'; formData.id = undefined; dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑生产订单'; Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('保存成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('保存失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除订单【${row.orderNo}】?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
async function handleRelease(row) { await ElMessageBox.confirm(`确定下达订单【${row.orderNo}】?下达后不可修改`, '提示', { type: 'warning' }); ElMessage.success('已下达'); loadData() }
async function handleStart(row) { ElMessage.success(`订单【${row.orderNo}】开始生产`); loadData() }
async function handleFinish(row) { await ElMessageBox.confirm(`确定完工入库订单【${row.orderNo}】?`, '提示', { type: 'warning' }); ElMessage.success('已完工入库'); loadData() }
async function handleClose(row) { await ElMessageBox.confirm(`确定关闭订单【${row.orderNo}】?`, '提示', { type: 'warning' }); ElMessage.success('已关闭'); loadData() }
async function handleBatchRelease() { await ElMessageBox.confirm(`确定批量下达 ${selectedRows.value.length} 个订单?`, '提示', { type: 'warning' }); ElMessage.success('已批量下达'); loadData() }

function getActions(row) {
  const actions = [{ key: 'view', label: '查看', type: 'primary', handler: handleView }]
  if (row.status === 0) {
    actions.push({ key: 'edit', label: '编辑', type: 'primary', handler: handleEdit })
    actions.push({ key: 'release', label: '下达', type: 'success', handler: handleRelease })
    actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete })
  }
  if (row.status === 1) {
    actions.push({ key: 'start', label: '开工', type: 'success', handler: handleStart })
    actions.push({ key: 'close', label: '关闭', type: 'danger', handler: handleClose })
  }
  if (row.status === 2 || row.status === 3) {
    actions.push({ key: 'finish', label: '完工入库', type: 'success', handler: handleFinish })
  }
  if (row.status === 4) {
    actions.push({ key: 'finish', label: '完工入库', type: 'success', handler: handleFinish })
  }
  return actions
}

function handleCommand(cmd, row) {
  const action = getActions(row).find(a => a.key === cmd)
  action?.handler(row)
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
