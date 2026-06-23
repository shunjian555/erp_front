<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增委外单</el-button>
        <el-button :icon="Download" plain>导出</el-button>
      </div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #totalAmount="{ row }">{{ formatMoney(row.totalAmount) }}</template>
      <template #progress="{ row }">
        <el-progress :percentage="row.outboundQty ? Math.round(row.receivedQty / row.outboundQty * 100) : 0" :stroke-width="14" :color="['#67c23a', '#e6a23c', '#f56c6c']" />
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

    <el-dialog v-model="viewVisible" title="委外加工单详情" width="720px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="委外单号">{{ viewRow.outsourceNo }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="statusMap[viewRow.status]?.type" size="small">{{ statusMap[viewRow.status]?.label }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="供应商">{{ viewRow.supplierName }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ viewRow.contact }}</el-descriptions-item>
        <el-descriptions-item label="物料编码">{{ viewRow.materialCode }}</el-descriptions-item>
        <el-descriptions-item label="物料名称">{{ viewRow.materialName }}</el-descriptions-item>
        <el-descriptions-item label="规格">{{ viewRow.spec }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ viewRow.unit }}</el-descriptions-item>
        <el-descriptions-item label="委外数量">{{ viewRow.outsourceQty }}</el-descriptions-item>
        <el-descriptions-item label="已收数量">{{ viewRow.receivedQty }}</el-descriptions-item>
        <el-descriptions-item label="单价">{{ formatMoney(viewRow.price) }}</el-descriptions-item>
        <el-descriptions-item label="总金额">{{ formatMoney(viewRow.totalAmount) }}</el-descriptions-item>
        <el-descriptions-item label="发出日期">{{ viewRow.outboundDate }}</el-descriptions-item>
        <el-descriptions-item label="交付日期">{{ viewRow.deliveryDate }}</el-descriptions-item>
        <el-descriptions-item label="创建人" :span="2">{{ viewRow.createBy }}（{{ viewRow.createTime }}）</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Refresh, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import request from '@/utils/request'

function formatMoney(v) { if (v == null || v === '') return '0.00'; return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

const statusMap = {
  0: { label: '草稿', type: 'info' },
  1: { label: '已审核', type: 'primary' },
  2: { label: '已发出', type: 'warning' },
  3: { label: '部分到货', type: 'warning' },
  4: { label: '已入库', type: 'success' },
  5: { label: '已结算', type: 'success' }
}
const searchItems = [
  { prop: 'outsourceNo', label: '委外单号', type: 'input' },
  { prop: 'supplierName', label: '供应商', type: 'input' },
  { prop: 'materialName', label: '物料名称', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: Object.entries(statusMap).map(([v, l]) => ({ value: Number(v), label: l.label })) }
]
const columns = [
  { prop: 'outsourceNo', label: '委外单号', width: 200 },
  { prop: 'supplierName', label: '供应商', minWidth: 160 },
  { prop: 'materialName', label: '物料名称', minWidth: 140 },
  { prop: 'spec', label: '规格', width: 130 },
  { prop: 'outsourceQty', label: '委外数量', width: 100, align: 'right' },
  { prop: 'receivedQty', label: '已收数量', width: 100, align: 'right' },
  { prop: 'progress', label: '到货率', width: 140, slot: 'progress' },
  { prop: 'totalAmount', label: '总金额', width: 110, slot: 'totalAmount', align: 'right' },
  { prop: 'deliveryDate', label: '交付日期', width: 110 },
  { prop: 'status', label: '状态', width: 100, slot: 'status' }
]
const formItems = [
  { prop: 'outsourceNo', label: '委外单号', type: 'input' },
  { prop: 'supplierName', label: '供应商', type: 'input' },
  { prop: 'contact', label: '联系人', type: 'input' },
  { prop: 'materialCode', label: '物料编码', type: 'input' },
  { prop: 'materialName', label: '物料名称', type: 'input' },
  { prop: 'spec', label: '规格', type: 'input' },
  { prop: 'outsourceQty', label: '委外数量', type: 'number' },
  { prop: 'price', label: '单价', type: 'number' },
  { prop: 'outboundDate', label: '发出日期', type: 'date' },
  { prop: 'deliveryDate', label: '交付日期', type: 'date' }
]
const formRules = {
  outsourceNo: [{ required: true, message: '请输入委外单号', trigger: 'blur' }],
  supplierName: [{ required: true, message: '请输入供应商', trigger: 'blur' }]
}

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, outsourceNo: '', supplierName: '', materialName: '', status: '' })
const formData = reactive({ id: undefined, outsourceNo: '', supplierName: '', contact: '', materialCode: '', materialName: '', spec: '', outsourceQty: 0, price: 0, outboundDate: '', deliveryDate: '' })
const viewVisible = ref(false), viewRow = ref(null)

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/production/outsourcing/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增委外单'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑委外单'; Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('保存成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('保存失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除委外单【${row.outsourceNo}】?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
async function handleAudit(row) { await ElMessageBox.confirm(`确定审核委外单【${row.outsourceNo}】?`, '提示', { type: 'warning' }); ElMessage.success('审核成功'); loadData() }
async function handleOutbound(row) { ElMessage.success(`委外单【${row.outsourceNo}】已发出`); loadData() }
async function handleReceive(row) { ElMessage.success(`委外单【${row.outsourceNo}】入库成功`); loadData() }

function getActions(row) {
  const actions = [{ key: 'view', label: '查看', type: 'primary', handler: handleView }]
  if (row.status === 0) {
    actions.push({ key: 'edit', label: '编辑', type: 'primary', handler: handleEdit })
    actions.push({ key: 'audit', label: '审核', type: 'success', handler: handleAudit })
    actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete })
  }
  if (row.status === 1) {
    actions.push({ key: 'outbound', label: '发出', type: 'warning', handler: handleOutbound })
  }
  if (row.status === 2 || row.status === 3) {
    actions.push({ key: 'receive', label: '入库', type: 'success', handler: handleReceive })
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
