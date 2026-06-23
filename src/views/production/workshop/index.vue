<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新增车间</el-button><el-button :icon="Download" plain>导出</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #manager="{ row }">
        <el-avatar :size="24" style="margin-right: 6px; vertical-align: middle;">{{ row.manager?.charAt(0) || '—' }}</el-avatar>
        <span>{{ row.manager }}</span>
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

    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="650px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>

    <el-dialog v-model="viewVisible" title="车间详情" width="650px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="车间编码">{{ viewRow.workshopCode }}</el-descriptions-item>
        <el-descriptions-item label="车间名称">{{ viewRow.workshopName }}</el-descriptions-item>
        <el-descriptions-item label="车间主管">{{ viewRow.manager }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="viewRow.status === 1 ? 'success' : 'danger'" size="small">{{ viewRow.status === 1 ? '启用' : '停用' }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="工作中心数">{{ viewRow.workCenterCount }}</el-descriptions-item>
        <el-descriptions-item label="员工总数">{{ viewRow.workerCount }}</el-descriptions-item>
        <el-descriptions-item label="在制订单数">{{ viewRow.activeOrders }}</el-descriptions-item>
        <el-descriptions-item label="面积(㎡)">{{ viewRow.area }}</el-descriptions-item>
        <el-descriptions-item label="位置" :span="2">{{ viewRow.location }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ viewRow.description || '—' }}</el-descriptions-item>
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
  { prop: 'workshopName', label: '车间名称', type: 'input' },
  { prop: 'manager', label: '车间主管', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: [{ value: 1, label: '启用' }, { value: 0, label: '停用' }] }
]
const columns = [
  { prop: 'workshopCode', label: '编码', width: 120 },
  { prop: 'workshopName', label: '车间名称', minWidth: 140 },
  { prop: 'manager', label: '车间主管', width: 130, slot: 'manager' },
  { prop: 'workCenterCount', label: '工作中心', width: 90, align: 'center' },
  { prop: 'workerCount', label: '员工总数', width: 90, align: 'center' },
  { prop: 'activeOrders', label: '在制订单', width: 100, align: 'center' },
  { prop: 'area', label: '面积(㎡)', width: 100, align: 'right' },
  { prop: 'location', label: '位置', width: 150 },
  { prop: 'status', label: '状态', width: 80, slot: 'status' }
]
const formItems = [
  { prop: 'workshopCode', label: '编码', type: 'input' },
  { prop: 'workshopName', label: '名称', type: 'input' },
  { prop: 'manager', label: '车间主管', type: 'input' },
  { prop: 'area', label: '面积(㎡)', type: 'number' },
  { prop: 'location', label: '位置', type: 'input' },
  { prop: 'status', label: '启用', type: 'switch' },
  { prop: 'description', label: '描述', type: 'textarea', rows: 3, span: 24 }
]
const formRules = {
  workshopCode: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  workshopName: [{ required: true, message: '请输入名称', trigger: 'blur' }]
}

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, workshopName: '', manager: '', status: '' })
const formData = reactive({ id: undefined, workshopCode: '', workshopName: '', manager: '', area: 0, location: '', status: 1, description: '' })
const viewVisible = ref(false), viewRow = ref(null)

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/production/workshop/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增车间'; Object.keys(formData).forEach(k => formData[k] = ''); formData.status = 1; formData.id = undefined; dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑车间'; Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('保存成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('保存失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除车间【${row.workshopName}】?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
async function handleToggle(row) { row.status = row.status === 1 ? 0 : 1; ElMessage.success(row.status === 1 ? '已启用' : '已停用'); loadData() }

function getActions(row) {
  return [
    { key: 'view', label: '查看', type: 'primary', handler: handleView },
    { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit },
    { key: 'toggle', label: row.status === 1 ? '停用' : '启用', type: row.status === 1 ? 'warning' : 'success', handler: handleToggle },
    { key: 'delete', label: '删除', type: 'danger', handler: handleDelete }
  ]
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
