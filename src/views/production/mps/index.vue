<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增计划</el-button>
        <el-button type="success" :icon="Cpu" plain @click="handleGenerate">MRP计算</el-button>
        <el-button :icon="Download" plain>导出</el-button>
      </div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #priority="{ row }"><el-tag :type="priorityMap[row.priority]?.type || 'info'" size="small">{{ row.priority }}</el-tag></template>
      <template #status="{ row }"><el-tag :type="statusMap[row.status]?.type || 'info'" size="small">{{ statusMap[row.status]?.label || '未知' }}</el-tag></template>
      <template #sourceType="{ row }"><el-tag :type="row.sourceType === '订单' ? 'primary' : 'warning'" size="small">{{ row.sourceType }}</el-tag></template>
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

    <el-dialog v-model="viewVisible" title="主生产计划详情" width="720px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="计划号">{{ viewRow.planNo }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="statusMap[viewRow.status]?.type" size="small">{{ statusMap[viewRow.status]?.label }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="产品编码">{{ viewRow.productCode }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ viewRow.productName }}</el-descriptions-item>
        <el-descriptions-item label="计划数量">{{ viewRow.planQty }}</el-descriptions-item>
        <el-descriptions-item label="优先级"><el-tag :type="priorityMap[viewRow.priority]?.type" size="small">{{ viewRow.priority }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="计划开始">{{ viewRow.planStartDate }}</el-descriptions-item>
        <el-descriptions-item label="计划结束">{{ viewRow.planEndDate }}</el-descriptions-item>
        <el-descriptions-item label="实际开始">{{ viewRow.actualStartDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="实际结束">{{ viewRow.actualEndDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="车间">{{ viewRow.workshop }}</el-descriptions-item>
        <el-descriptions-item label="来源"><el-tag :type="viewRow.sourceType === '订单' ? 'primary' : 'warning'" size="small">{{ viewRow.sourceType }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="创建人" :span="2">{{ viewRow.createBy }}（{{ viewRow.createTime }}）</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Refresh, ArrowDown, Cpu } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import request from '@/utils/request'

const statusMap = { 0: { label: '草稿', type: 'info' }, 1: { label: '已审核', type: 'primary' }, 2: { label: '已下达', type: 'success' }, 3: { label: '执行中', type: 'warning' }, 4: { label: '已完成', type: 'success' } }
const priorityMap = { '低': { type: 'info' }, '普通': { type: 'primary' }, '高': { type: 'warning' }, '紧急': { type: 'danger' } }

const searchItems = [
  { prop: 'planNo', label: '计划号', type: 'input' },
  { prop: 'productName', label: '产品名称', type: 'input' },
  { prop: 'priority', label: '优先级', type: 'select', options: Object.keys(priorityMap).map(k => ({ label: k, value: k })) },
  { prop: 'status', label: '状态', type: 'select', options: Object.entries(statusMap).map(([v, l]) => ({ value: Number(v), label: l.label })) }
]
const columns = [
  { prop: 'planNo', label: '计划号', width: 200 },
  { prop: 'productName', label: '产品名称', minWidth: 160 },
  { prop: 'planQty', label: '计划数量', width: 100, align: 'right' },
  { prop: 'planStartDate', label: '计划开始', width: 110 },
  { prop: 'planEndDate', label: '计划结束', width: 110 },
  { prop: 'workshop', label: '车间', width: 130 },
  { prop: 'priority', label: '优先级', width: 90, slot: 'priority' },
  { prop: 'sourceType', label: '来源', width: 80, slot: 'sourceType' },
  { prop: 'status', label: '状态', width: 100, slot: 'status' },
  { prop: 'createBy', label: '创建人', width: 90 }
]
const formItems = [
  { prop: 'productCode', label: '产品编码', type: 'input' },
  { prop: 'productName', label: '产品名称', type: 'input' },
  { prop: 'planQty', label: '计划数量', type: 'number' },
  { prop: 'planStartDate', label: '计划开始', type: 'date' },
  { prop: 'planEndDate', label: '计划结束', type: 'date' },
  { prop: 'workshop', label: '车间', type: 'input' },
  { prop: 'priority', label: '优先级', type: 'select', options: Object.keys(priorityMap).map(k => ({ label: k, value: k })) },
  { prop: 'sourceType', label: '来源', type: 'select', options: [{ label: '订单', value: '订单' }, { label: '预测', value: '预测' }] }
]
const formRules = {
  productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  planQty: [{ required: true, message: '请输入计划数量', trigger: 'blur' }]
}

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, planNo: '', productName: '', priority: '', status: '' })
const formData = reactive({ id: undefined, productCode: '', productName: '', planQty: 0, planStartDate: '', planEndDate: '', workshop: '', priority: '普通', sourceType: '订单' })
const viewVisible = ref(false), viewRow = ref(null)

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/production/mps/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增MPS计划'; Object.keys(formData).forEach(k => formData[k] = ''); formData.priority = '普通'; formData.sourceType = '订单'; formData.id = undefined; dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑MPS计划'; Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('保存成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('保存失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除计划【${row.planNo}】?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
async function handleRelease(row) { await ElMessageBox.confirm(`确定下达计划【${row.planNo}】?下达后不可修改`, '提示', { type: 'warning' }); ElMessage.success('已下达'); loadData() }
async function handleGenerate() { await ElMessageBox.confirm('确认执行MRP计算？将根据MPS和库存生成物料需求', 'MRP计算', { type: 'info' }); ElMessage.success('MRP计算完成，请前往【物料需求计划】查看结果'); }

function getActions(row) {
  const actions = [{ key: 'view', label: '查看', type: 'primary', handler: handleView }]
  if (row.status === 0) {
    actions.push({ key: 'edit', label: '编辑', type: 'primary', handler: handleEdit })
    actions.push({ key: 'release', label: '下达', type: 'success', handler: handleRelease })
    actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete })
  }
  if (row.status === 1) {
    actions.push({ key: 'release', label: '下达', type: 'success', handler: handleRelease })
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
