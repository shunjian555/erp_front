<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新增</el-button><el-button :icon="Download" plain>导出</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #demandQty="{ row }">{{ row.demandQty }}</template>
      <template #shortageQty="{ row }">
        <span :style="{ color: row.netReqQty > 0 ? '#f56c6c' : '#67c23a', fontWeight: 600 }">{{ row.netReqQty }}</span>
      </template>
      <template #status="{ row }"><el-tag :type="statusMap[row.status]?.type || 'info'" size="small">{{ statusMap[row.status]?.label || '未知' }}</el-tag></template>
      <template #sourceType="{ row }"><el-tag :type="row.sourceType === '生产' ? 'success' : 'primary'" size="small">{{ row.sourceType }}</el-tag></template>
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

    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="650px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>

    <el-dialog v-model="viewVisible" title="MRP需求详情" width="720px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="MRP单号">{{ viewRow.planNo }}</el-descriptions-item>
        <el-descriptions-item label="物料编码">{{ viewRow.materialCode }}</el-descriptions-item>
        <el-descriptions-item label="物料名称" :span="2">{{ viewRow.materialName }}</el-descriptions-item>
        <el-descriptions-item label="规格">{{ viewRow.spec }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ viewRow.unit }}</el-descriptions-item>
        <el-descriptions-item label="毛需求量">{{ viewRow.demandQty }}</el-descriptions-item>
        <el-descriptions-item label="现有库存">{{ viewRow.onHandQty }}</el-descriptions-item>
        <el-descriptions-item label="在途数量">{{ viewRow.onOrderQty }}</el-descriptions-item>
        <el-descriptions-item label="净需求量" :span="2"><span :style="{ color: '#f56c6c', fontWeight: 600 }">{{ viewRow.netReqQty }}</span></el-descriptions-item>
        <el-descriptions-item label="建议订货量">{{ viewRow.suggestedQty }}</el-descriptions-item>
        <el-descriptions-item label="需求日期">{{ viewRow.requiredDate }}</el-descriptions-item>
        <el-descriptions-item label="来源"><el-tag :type="viewRow.sourceType === '生产' ? 'success' : 'primary'" size="small">{{ viewRow.sourceType }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="statusMap[viewRow.status]?.type" size="small">{{ statusMap[viewRow.status]?.label }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="计算时间" :span="2">{{ viewRow.runTime }}</el-descriptions-item>
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

const statusMap = { 0: { label: '待处理', type: 'warning' }, 1: { label: '已转采购申请', type: 'primary' }, 2: { label: '已转生产订单', type: 'success' }, 3: { label: '已关闭', type: 'info' } }

const searchItems = [
  { prop: 'planNo', label: 'MRP单号', type: 'input' },
  { prop: 'materialName', label: '物料名称', type: 'input' },
  { prop: 'sourceType', label: '来源', type: 'select', options: [{ label: '采购', value: '采购' }, { label: '生产', value: '生产' }] },
  { prop: 'status', label: '状态', type: 'select', options: Object.entries(statusMap).map(([v, l]) => ({ value: Number(v), label: l.label })) }
]
const columns = [
  { prop: 'planNo', label: 'MRP单号', width: 200 },
  { prop: 'materialName', label: '物料名称', minWidth: 160 },
  { prop: 'spec', label: '规格', width: 140 },
  { prop: 'unit', label: '单位', width: 60, align: 'center' },
  { prop: 'demandQty', label: '毛需求', width: 90, slot: 'demandQty', align: 'right' },
  { prop: 'onHandQty', label: '现有库存', width: 100, align: 'right' },
  { prop: 'onOrderQty', label: '在途', width: 90, align: 'right' },
  { prop: 'netReqQty', label: '净需求', width: 90, slot: 'shortageQty', align: 'right' },
  { prop: 'sourceType', label: '建议来源', width: 100, slot: 'sourceType' },
  { prop: 'requiredDate', label: '需求日期', width: 110 },
  { prop: 'status', label: '状态', width: 110, slot: 'status' }
]
const formItems = [
  { prop: 'materialCode', label: '物料编码', type: 'input' },
  { prop: 'materialName', label: '物料名称', type: 'input' },
  { prop: 'spec', label: '规格', type: 'input' },
  { prop: 'unit', label: '单位', type: 'input' },
  { prop: 'demandQty', label: '毛需求', type: 'number' },
  { prop: 'suggestedQty', label: '建议数量', type: 'number' },
  { prop: 'sourceType', label: '来源', type: 'select', options: [{ label: '采购', value: '采购' }, { label: '生产', value: '生产' }] },
  { prop: 'requiredDate', label: '需求日期', type: 'date' }
]
const formRules = {
  materialName: [{ required: true, message: '请输入物料名称', trigger: 'blur' }]
}

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, planNo: '', materialName: '', sourceType: '', status: '' })
const formData = reactive({ id: undefined, materialCode: '', materialName: '', spec: '', unit: '个', demandQty: 0, suggestedQty: 0, sourceType: '采购', requiredDate: '' })
const viewVisible = ref(false), viewRow = ref(null)

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/production/mrp/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增MRP需求'; Object.keys(formData).forEach(k => formData[k] = ''); formData.unit = '个'; formData.sourceType = '采购'; formData.id = undefined; dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑MRP需求'; Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('保存成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('保存失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除MRP需求【${row.planNo}】?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
async function handleConvertToPurchase(row) { await ElMessageBox.confirm(`确定将【${row.materialName}】的需求转为采购申请?`, '提示', { type: 'warning' }); ElMessage.success('已转采购申请'); loadData() }
async function handleConvertToProduction(row) { await ElMessageBox.confirm(`确定将【${row.materialName}】的需求转为生产订单?`, '提示', { type: 'warning' }); ElMessage.success('已转生产订单'); loadData() }

function getActions(row) {
  const actions = [{ key: 'view', label: '查看', type: 'primary', handler: handleView }]
  if (row.status === 0) {
    if (row.sourceType === '采购') actions.push({ key: 'purchase', label: '转采购', type: 'success', handler: handleConvertToPurchase })
    if (row.sourceType === '生产') actions.push({ key: 'production', label: '转生产', type: 'success', handler: handleConvertToProduction })
    actions.push({ key: 'edit', label: '编辑', type: 'primary', handler: handleEdit })
    actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete })
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
