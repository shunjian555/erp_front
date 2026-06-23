<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新建盘点单</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><el-tag :type="stocktakeStatusMap[row.status]?.type || 'info'" size="small">{{ stocktakeStatusMap[row.status]?.label || '未知' }}</el-tag></template>
      <template #operation="{ row }">
        <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
        <el-button v-if="row.status === 0" type="primary" link size="small" @click="handleStart(row)">开始盘点</el-button>
        <el-button v-if="row.status === 1" type="success" link size="small" @click="handleFinish(row)">完成</el-button>
        <el-button v-if="row.status === 0 || row.status === 1" type="danger" link size="small" @click="handleCancel(row)">作废</el-button>
      </template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" title="新建盘点单" width="550px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" /></BaseDialog>

    <!-- 详情 -->
    <el-dialog v-model="viewVisible" title="盘点单详情" width="640px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="盘点单号">{{ viewRow.stocktakeNo }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="stocktakeStatusMap[viewRow.status]?.type || 'info'" size="small">{{ stocktakeStatusMap[viewRow.status]?.label || '未知' }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="仓库">{{ viewRow.warehouse }}</el-descriptions-item>
        <el-descriptions-item label="执行人">{{ viewRow.executor }}</el-descriptions-item>
        <el-descriptions-item label="SKU 数">{{ viewRow.totalCount }}</el-descriptions-item>
        <el-descriptions-item label="差异数">
          <span :class="viewRow.diffCount > 0 ? 'diff-pos' : viewRow.diffCount < 0 ? 'diff-neg' : ''">{{ viewRow.diffCount }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="开始时间" :span="2">{{ viewRow.startTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import request from '@/utils/request'

const stocktakeStatusMap = { 0: { label: '待盘点', type: 'info' }, 1: { label: '盘点中', type: 'warning' }, 2: { label: '已完成', type: 'success' }, 3: { label: '已作废', type: 'info' } }
const searchItems = [ { prop: 'stocktakeNo', label: '盘点单号', type: 'input' }, { prop: 'warehouse', label: '仓库', type: 'input' }, { prop: 'status', label: '状态', type: 'select', options: Object.entries(stocktakeStatusMap).map(([v, l]) => ({ value: Number(v), label: l.label })) } ]
const columns = [ { prop: 'stocktakeNo', label: '盘点单号', width: 190 }, { prop: 'warehouse', label: '仓库', width: 110 }, { prop: 'totalCount', label: 'SKU数', width: 80, align: 'center' }, { prop: 'diffCount', label: '差异数', width: 80, align: 'center' }, { prop: 'executor', label: '执行人', width: 90 }, { prop: 'startTime', label: '开始时间', width: 170 }, { prop: 'status', label: '状态', width: 90, slot: 'status' } ]
const formItems = [ { prop: 'stocktakeNo', label: '盘点单号', type: 'input' }, { prop: 'warehouse', label: '仓库', type: 'input' }, { prop: 'remark', label: '备注', type: 'textarea', rows: 3 } ]
const formRules = { stocktakeNo: [{ required: true, message: '请输入盘点单号', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, stocktakeNo: '', warehouse: '', status: '' })
const formData = reactive({ id: undefined, stocktakeNo: '', warehouse: '', remark: '' })
const viewVisible = ref(false), viewRow = ref(null)

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/inventory/stocktake/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { Object.keys(formData).forEach(k => { if (k === 'id') formData[k] = undefined; else formData[k] = '' }); dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
async function handleStart(r) { await ElMessageBox.confirm(`确定开始盘点单【${r.stocktakeNo}】?`, '提示', { type: 'warning' }); await request({ url: '/api/inventory/stocktake/start', method: 'post', data: { id: r.id } }).catch(() => {}); ElMessage.success('已开始盘点'); loadData() }
async function handleFinish(r) { await ElMessageBox.confirm(`确定完成盘点单【${r.stocktakeNo}】?`, '提示', { type: 'warning' }); await request({ url: '/api/inventory/stocktake/finish', method: 'post', data: { id: r.id } }).catch(() => {}); ElMessage.success('已完成'); loadData() }
async function handleCancel(r) { await ElMessageBox.confirm(`确定作废盘点单【${r.stocktakeNo}】?`, '提示', { type: 'warning' }); await request({ url: '/api/inventory/stocktake/cancel', method: 'post', data: { id: r.id } }).catch(() => {}); ElMessage.success('已作废'); loadData() }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await request({ url: '/api/inventory/stocktake/save', method: 'post', data: formData }); ElMessage.success('创建成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('创建失败') } finally { submitLoading.value = false } }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
.diff-pos { color: #67c23a; font-weight: 600; }
.diff-neg { color: #f56c6c; font-weight: 600; }
</style>
