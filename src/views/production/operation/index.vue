<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">工序派工</el-button>
        <el-button type="warning" :icon="Postcard" plain @click="handleReport">报工录入</el-button>
        <el-button :icon="Download" plain>导出</el-button>
      </div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #progress="{ row }">
        <el-progress :percentage="row.plannedQty ? Math.round(row.completedQty / row.plannedQty * 100) : 0" :stroke-width="14" :color="['#67c23a', '#e6a23c', '#f56c6c']" />
      </template>
      <template #qualifiedRate="{ row }">
        <span :style="{ color: row.completedQty ? (row.qualifiedQty / row.completedQty >= 0.98 ? '#67c23a' : '#f56c6c') : '#909399' }">
          {{ row.completedQty ? ((row.qualifiedQty / row.completedQty) * 100).toFixed(1) : 0 }}%
        </span>
      </template>
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

    <el-dialog v-model="viewVisible" title="工序详情" width="760px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="派工号">{{ viewRow.dispatchNo }}</el-descriptions-item>
        <el-descriptions-item label="生产订单">{{ viewRow.productionOrderNo }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ viewRow.productName }}</el-descriptions-item>
        <el-descriptions-item label="工序号">{{ viewRow.sequence }}</el-descriptions-item>
        <el-descriptions-item label="工序名称">{{ viewRow.operationName }}</el-descriptions-item>
        <el-descriptions-item label="工作中心">{{ viewRow.workCenter }}</el-descriptions-item>
        <el-descriptions-item label="操作员">{{ viewRow.worker }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="statusMap[viewRow.status]?.type" size="small">{{ statusMap[viewRow.status]?.label }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="计划数量">{{ viewRow.plannedQty }}</el-descriptions-item>
        <el-descriptions-item label="完成数量">{{ viewRow.completedQty }}</el-descriptions-item>
        <el-descriptions-item label="合格品">{{ viewRow.qualifiedQty }}</el-descriptions-item>
        <el-descriptions-item label="不良品">{{ viewRow.defectQty }}</el-descriptions-item>
        <el-descriptions-item label="标准工时">{{ viewRow.standardTime }}分</el-descriptions-item>
        <el-descriptions-item label="实际工时">{{ viewRow.actualTime }}分</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ viewRow.startTime }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ viewRow.endTime || '—' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Refresh, ArrowDown, Postcard } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import request from '@/utils/request'

const statusMap = {
  0: { label: '待开工', type: 'info' },
  1: { label: '生产中', type: 'warning' },
  2: { label: '已暂停', type: 'danger' },
  3: { label: '已报工', type: 'primary' },
  4: { label: '已完工', type: 'success' }
}

const searchItems = [
  { prop: 'dispatchNo', label: '派工号', type: 'input' },
  { prop: 'productionOrderNo', label: '生产订单', type: 'input' },
  { prop: 'worker', label: '操作员', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: Object.entries(statusMap).map(([v, l]) => ({ value: Number(v), label: l.label })) }
]
const columns = [
  { prop: 'dispatchNo', label: '派工号', width: 180 },
  { prop: 'productionOrderNo', label: '生产订单', width: 180 },
  { prop: 'productName', label: '产品', minWidth: 130 },
  { prop: 'sequence', label: '工序号', width: 70, align: 'center' },
  { prop: 'operationName', label: '工序', width: 90 },
  { prop: 'workCenter', label: '工作中心', width: 130 },
  { prop: 'worker', label: '操作员', width: 90 },
  { prop: 'plannedQty', label: '计划', width: 80, align: 'right' },
  { prop: 'completedQty', label: '完成', width: 80, align: 'right' },
  { prop: 'progress', label: '完工率', width: 140, slot: 'progress' },
  { prop: 'qualifiedRate', label: '合格率', width: 90, slot: 'qualifiedRate', align: 'center' },
  { prop: 'status', label: '状态', width: 90, slot: 'status' }
]
const formItems = [
  { prop: 'productionOrderNo', label: '生产订单', type: 'input' },
  { prop: 'productName', label: '产品', type: 'input' },
  { prop: 'operationName', label: '工序名称', type: 'input' },
  { prop: 'workCenter', label: '工作中心', type: 'input' },
  { prop: 'worker', label: '操作员', type: 'input' },
  { prop: 'plannedQty', label: '计划数量', type: 'number' },
  { prop: 'completedQty', label: '完成数量', type: 'number' },
  { prop: 'qualifiedQty', label: '合格数量', type: 'number' },
  { prop: 'defectQty', label: '不良数量', type: 'number' },
  { prop: 'startTime', label: '开始时间', type: 'datetime' }
]
const formRules = {
  productionOrderNo: [{ required: true, message: '请输入生产订单号', trigger: 'blur' }],
  operationName: [{ required: true, message: '请输入工序名称', trigger: 'blur' }]
}

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, dispatchNo: '', productionOrderNo: '', worker: '', status: '' })
const formData = reactive({ id: undefined, productionOrderNo: '', productName: '', operationName: '', workCenter: '', worker: '', plannedQty: 0, completedQty: 0, qualifiedQty: 0, defectQty: 0, startTime: '' })
const viewVisible = ref(false), viewRow = ref(null)

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/production/operation/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '工序派工'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
function handleReport(r) { dialogTitle.value = '报工录入'; Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('保存成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('保存失败') } finally { submitLoading.value = false } }
async function handleStart(row) { ElMessage.success(`工序【${row.operationName}】开始生产`); loadData() }
async function handlePause(row) { await ElMessageBox.confirm(`确定暂停工序【${row.operationName}】?`, '提示', { type: 'warning' }); ElMessage.success('已暂停'); loadData() }
async function handleFinish(row) { await ElMessageBox.confirm(`确定完工工序【${row.operationName}】?`, '提示', { type: 'warning' }); ElMessage.success('已完工'); loadData() }

function getActions(row) {
  const actions = [{ key: 'view', label: '查看', type: 'primary', handler: handleView }]
  if (row.status === 0) {
    actions.push({ key: 'start', label: '开工', type: 'success', handler: handleStart })
    actions.push({ key: 'report', label: '报工', type: 'primary', handler: handleReport })
  }
  if (row.status === 1) {
    actions.push({ key: 'report', label: '报工', type: 'primary', handler: handleReport })
    actions.push({ key: 'pause', label: '暂停', type: 'warning', handler: handlePause })
    actions.push({ key: 'finish', label: '完工', type: 'success', handler: handleFinish })
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
