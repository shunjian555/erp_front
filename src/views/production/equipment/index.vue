<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增设备</el-button>
        <el-button type="warning" :icon="Warning" plain @click="showMaintenance = true">维护计划</el-button>
        <el-button :icon="Download" plain>导出</el-button>
      </div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><el-tag :type="statusMap[row.status]?.type || 'info'" size="small">{{ statusMap[row.status]?.label || '未知' }}</el-tag></template>
      <template #health="{ row }">
        <el-rate v-model="row.healthLevel" disabled show-score :colors="['#99A9BF', '#F7BA2A', '#67C23A']" :max="5" />
      </template>
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

    <el-dialog v-model="viewVisible" title="设备详情" width="700px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="设备编号">{{ viewRow.equipmentCode }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ viewRow.equipmentName }}</el-descriptions-item>
        <el-descriptions-item label="设备类型">{{ viewRow.equipmentType }}</el-descriptions-item>
        <el-descriptions-item label="规格">{{ viewRow.spec }}</el-descriptions-item>
        <el-descriptions-item label="所属车间">{{ viewRow.workshop }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="statusMap[viewRow.status]?.type" size="small">{{ statusMap[viewRow.status]?.label }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="购置日期">{{ viewRow.purchaseDate }}</el-descriptions-item>
        <el-descriptions-item label="使用年限">{{ viewRow.usedYears }}年</el-descriptions-item>
        <el-descriptions-item label="原值(元)">{{ viewRow.originalValue }}</el-descriptions-item>
        <el-descriptions-item label="净值(元)">{{ viewRow.netValue }}</el-descriptions-item>
        <el-descriptions-item label="制造商">{{ viewRow.manufacturer }}</el-descriptions-item>
        <el-descriptions-item label="健康度">
          <el-rate v-model="viewRow.healthLevel" disabled show-score :max="5" />
        </el-descriptions-item>
        <el-descriptions-item label="责任人" :span="2">{{ viewRow.responsible }}</el-descriptions-item>
        <el-descriptions-item label="位置" :span="2">{{ viewRow.location }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="showMaintenance" title="设备维护计划" width="900px" :close-on-click-modal="false">
      <el-table :data="maintenanceList" border>
        <el-table-column prop="maintenanceNo" label="维护单号" width="180" />
        <el-table-column prop="equipmentName" label="设备名称" width="140" />
        <el-table-column prop="maintenanceType" label="维护类型" width="100">
          <template #default="{ row }"><el-tag :type="row.maintenanceType === '保养' ? 'primary' : (row.maintenanceType === '维修' ? 'danger' : 'warning')" size="small">{{ row.maintenanceType }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="planDate" label="计划日期" width="120" />
        <el-table-column prop="responsible" label="责任人" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="row.status === '已完成' ? 'success' : (row.status === '进行中' ? 'warning' : 'info')" size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="description" label="维护说明" min-width="180" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Refresh, ArrowDown, Warning } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import request from '@/utils/request'

const statusMap = {
  0: { label: '空闲', type: 'info' },
  1: { label: '使用中', type: 'success' },
  2: { label: '维护中', type: 'warning' },
  3: { label: '已停用', type: 'danger' }
}
const searchItems = [
  { prop: 'equipmentName', label: '设备名称', type: 'input' },
  { prop: 'workshop', label: '所属车间', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: Object.entries(statusMap).map(([v, l]) => ({ value: Number(v), label: l.label })) }
]
const columns = [
  { prop: 'equipmentCode', label: '设备编号', width: 130 },
  { prop: 'equipmentName', label: '设备名称', minWidth: 140 },
  { prop: 'equipmentType', label: '类型', width: 100 },
  { prop: 'spec', label: '规格', width: 120 },
  { prop: 'workshop', label: '所属车间', width: 130 },
  { prop: 'health', label: '健康度', width: 180, slot: 'health' },
  { prop: 'responsible', label: '责任人', width: 100 },
  { prop: 'status', label: '状态', width: 90, slot: 'status' }
]
const formItems = [
  { prop: 'equipmentCode', label: '设备编号', type: 'input' },
  { prop: 'equipmentName', label: '设备名称', type: 'input' },
  { prop: 'equipmentType', label: '设备类型', type: 'input' },
  { prop: 'spec', label: '规格', type: 'input' },
  { prop: 'workshop', label: '所属车间', type: 'input' },
  { prop: 'manufacturer', label: '制造商', type: 'input' },
  { prop: 'purchaseDate', label: '购置日期', type: 'date' },
  { prop: 'originalValue', label: '原值(元)', type: 'number' },
  { prop: 'responsible', label: '责任人', type: 'input' },
  { prop: 'location', label: '安装位置', type: 'input' },
  { prop: 'status', label: '启用', type: 'switch' }
]
const formRules = {
  equipmentCode: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
  equipmentName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }]
}

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, equipmentName: '', workshop: '', status: '' })
const formData = reactive({ id: undefined, equipmentCode: '', equipmentName: '', equipmentType: '', spec: '', workshop: '', manufacturer: '', purchaseDate: '', originalValue: 0, responsible: '', location: '', status: 1 })
const viewVisible = ref(false), viewRow = ref(null)
const showMaintenance = ref(false), maintenanceList = ref([])

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/production/equipment/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增设备'; Object.keys(formData).forEach(k => formData[k] = ''); formData.status = 1; formData.id = undefined; dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑设备'; Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('保存成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('保存失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除设备【${row.equipmentName}】?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
async function handleMaintain(row) { ElMessage.success(`已为【${row.equipmentName}】创建维护单`); showMaintenance.value = true; const res = await request({ url: '/api/production/equipment/maintenance', method: 'get' }); maintenanceList.value = res.data.list || [] }
async function handleScrapped(row) { await ElMessageBox.confirm(`确定报废设备【${row.equipmentName}】?`, '提示', { type: 'warning' }); ElMessage.success('已报废'); loadData() }

function getActions(row) {
  return [
    { key: 'view', label: '查看', type: 'primary', handler: handleView },
    { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit },
    { key: 'maintain', label: '维护', type: 'warning', handler: handleMaintain },
    { key: 'scrap', label: '报废', type: 'danger', handler: handleScrapped },
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
