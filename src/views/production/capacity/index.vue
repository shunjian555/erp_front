<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新增工作中心</el-button><el-button :icon="Download" plain>导出</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #utilization="{ row }">
        <el-progress :percentage="row.utilization" :color="utilizationColor(row.utilization)" :stroke-width="14" />
      </template>
      <template #efficiency="{ row }">
        <span :style="{ color: efficiencyColor(row.efficiency) }">{{ row.efficiency }}%</span>
      </template>
      <template #status="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '启用' : '停用' }}</el-tag></template>
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

    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>

    <el-dialog v-model="viewVisible" title="工作中心详情" width="600px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="工作中心编码">{{ viewRow.workCenterCode }}</el-descriptions-item>
        <el-descriptions-item label="工作中心名称">{{ viewRow.workCenterName }}</el-descriptions-item>
        <el-descriptions-item label="所属车间">{{ viewRow.workshop }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="viewRow.status === 1 ? 'success' : 'danger'" size="small">{{ viewRow.status === 1 ? '启用' : '停用' }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="标准产能(件/时)">{{ viewRow.standardCapacity }}</el-descriptions-item>
        <el-descriptions-item label="实际产能(件/时)">{{ viewRow.actualCapacity }}</el-descriptions-item>
        <el-descriptions-item label="利用率">{{ viewRow.utilization }}%</el-descriptions-item>
        <el-descriptions-item label="效率">{{ viewRow.efficiency }}%</el-descriptions-item>
        <el-descriptions-item label="人员数">{{ viewRow.workerCount }}</el-descriptions-item>
        <el-descriptions-item label="设备数">{{ viewRow.equipmentCount }}</el-descriptions-item>
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

const searchItems = [
  { prop: 'workCenterName', label: '工作中心', type: 'input' },
  { prop: 'workshop', label: '所属车间', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: [{ value: 1, label: '启用' }, { value: 0, label: '停用' }] }
]
const columns = [
  { prop: 'workCenterCode', label: '编码', width: 120 },
  { prop: 'workCenterName', label: '工作中心', minWidth: 140 },
  { prop: 'workshop', label: '所属车间', width: 140 },
  { prop: 'standardCapacity', label: '标准产能', width: 110, align: 'right' },
  { prop: 'actualCapacity', label: '实际产能', width: 110, align: 'right' },
  { prop: 'utilization', label: '利用率', width: 180, slot: 'utilization' },
  { prop: 'efficiency', label: '效率', width: 90, slot: 'efficiency', align: 'center' },
  { prop: 'workerCount', label: '人员', width: 70, align: 'center' },
  { prop: 'equipmentCount', label: '设备', width: 70, align: 'center' },
  { prop: 'status', label: '状态', width: 80, slot: 'status' }
]
const formItems = [
  { prop: 'workCenterCode', label: '编码', type: 'input' },
  { prop: 'workCenterName', label: '名称', type: 'input' },
  { prop: 'workshop', label: '所属车间', type: 'input' },
  { prop: 'standardCapacity', label: '标准产能', type: 'number' },
  { prop: 'workerCount', label: '人员数', type: 'number' },
  { prop: 'equipmentCount', label: '设备数', type: 'number' },
  { prop: 'status', label: '启用', type: 'switch' }
]
const formRules = {
  workCenterCode: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  workCenterName: [{ required: true, message: '请输入名称', trigger: 'blur' }]
}

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, workCenterName: '', workshop: '', status: '' })
const formData = reactive({ id: undefined, workCenterCode: '', workCenterName: '', workshop: '', standardCapacity: 100, workerCount: 0, equipmentCount: 0, status: 1 })
const viewVisible = ref(false), viewRow = ref(null)

function utilizationColor(v) {
  if (v >= 90) return '#f56c6c'
  if (v >= 75) return '#e6a23c'
  return '#67c23a'
}
function efficiencyColor(v) { return v >= 85 ? '#67c23a' : (v >= 60 ? '#e6a23c' : '#f56c6c') }

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/production/capacity/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增工作中心'; Object.keys(formData).forEach(k => formData[k] = ''); formData.status = 1; formData.id = undefined; dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑工作中心'; Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('保存成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('保存失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除"${row.workCenterName}"?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }

function getActions(row) {
  return [
    { key: 'view', label: '查看', type: 'primary', handler: handleView },
    { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit },
    { key: 'toggle', label: row.status === 1 ? '停用' : '启用', type: row.status === 1 ? 'warning' : 'success', handler: handleToggle },
    { key: 'delete', label: '删除', type: 'danger', handler: handleDelete }
  ]
}
async function handleToggle(row) { row.status = row.status === 1 ? 0 : 1; ElMessage.success(row.status === 1 ? '已启用' : '已停用'); loadData() }

function handleCommand(cmd, row) {
  const action = getActions(row).find(a => a.key === cmd)
  action?.handler(row)
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
