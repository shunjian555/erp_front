<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('wms.location.addBtn') }}</el-button>
        <el-button type="danger" :icon="Delete" plain :disabled="selectedRows.length === 0" @click="handleBatchDelete">{{ t('wms.location.batchDeleteBtn') }}</el-button>
        <el-button :icon="Download" plain @click="handleExport">{{ t('wms.location.exportBtn') }}</el-button>
      </div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }">
        <BaseStatusTag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? t('wms.location.statusAvailable') : t('wms.location.statusOccupied') }}</BaseStatusTag>
      </template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 2)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 2" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">{{ t('wms.location.more') }}<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="action in getActions(row).slice(2)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="550px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog">
      <BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" />
    </BaseDialog>
    <el-dialog v-model="viewVisible" :title="t('wms.location.detailTitle')" width="500px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="t('wms.location.detailCode')">{{ viewRow.locationCode }}</el-descriptions-item>
        <el-descriptions-item :label="t('wms.location.detailArea')">{{ viewRow.areaName }}</el-descriptions-item>
        <el-descriptions-item :label="t('wms.location.detailWarehouse')">{{ viewRow.warehouseName }}</el-descriptions-item>
        <el-descriptions-item :label="t('wms.location.detailRowCol')">{{ viewRow.rowCol }}</el-descriptions-item>
        <el-descriptions-item :label="t('wms.location.detailMaxWeight')">{{ viewRow.maxWeight }}</el-descriptions-item>
        <el-descriptions-item :label="t('wms.location.detailStatus')">{{ viewRow.status === 1 ? t('wms.location.statusAvailable') : t('wms.location.statusOccupied') }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { Plus, Download, Delete, Refresh, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'

const { t } = useI18n({ useScope: 'local' })

const searchItems = computed(() => [
  { prop: 'locationCode', label: t('wms.location.searchLocationCodeLabel'), type: 'input' },
  { prop: 'areaName', label: t('wms.location.searchAreaNameLabel'), type: 'input' }
])

const columns = computed(() => [
  { prop: 'locationCode', label: t('wms.location.colLocationCode'), width: 140 },
  { prop: 'areaName', label: t('wms.location.colAreaName'), width: 120 },
  { prop: 'warehouseName', label: t('wms.location.colWarehouseName'), width: 120 },
  { prop: 'rowCol', label: t('wms.location.colRowCol'), width: 100, align: 'center' },
  { prop: 'maxWeight', label: t('wms.location.colMaxWeight'), width: 100, align: 'center' },
  { prop: 'status', label: t('wms.location.colStatus'), width: 80, slot: 'status' }
])

const formItems = computed(() => [
  { prop: 'locationCode', label: t('wms.location.form.locationCodeLabel'), type: 'input', span: 12 },
  { prop: 'areaName', label: t('wms.location.form.areaNameLabel'), type: 'input', span: 12 },
  { prop: 'rowCol', label: t('wms.location.form.rowColLabel'), type: 'input', span: 12 },
  { prop: 'maxWeight', label: t('wms.location.form.maxWeightLabel'), type: 'number', span: 12 }
])

const formRules = computed(() => ({
  locationCode: [{ required: true, message: t('wms.location.required.locationCodeInput'), trigger: 'blur' }]
}))

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, locationCode: '', areaName: '' })
const formData = reactive({ id: undefined, locationCode: '', areaName: '', warehouseName: '', rowCol: '', maxWeight: undefined })

async function loadData() {
  loading.value = true
  try {
    const areas = ['A区-常温区', 'B区-冷藏区', 'C区-危险品区', 'D区-暂存区']
    const whs = ['主仓库', '分仓库A', '华南仓库']
    const all = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      locationCode: `L${String(i + 1).padStart(4, '0')}`,
      areaName: areas[i % areas.length],
      warehouseName: whs[i % whs.length],
      rowCol: `${Math.floor(i / 10) + 1}-${(i % 10) + 1}`,
      maxWeight: 100 + (i % 5) * 200,
      status: i % 7 === 6 ? 0 : 1
    }))
    const { locationCode = '', areaName = '', pageNum = 1, pageSize = 10 } = queryParams
    let filtered = all
    if (locationCode) filtered = filtered.filter(x => x.locationCode.includes(locationCode))
    if (areaName) filtered = filtered.filter(x => x.areaName.includes(areaName))
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }
function handleAdd() { dialogTitle.value = t('wms.location.dialogAddTitle'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function handleEdit(r) { dialogTitle.value = t('wms.location.dialogEditTitle'); Object.assign(formData, r); dialogVisible.value = true }
function handleToggle(row) { row.status = row.status === 1 ? 0 : 1; ElMessage.success(`${row.status === 1 ? t('wms.location.statusOccupied') : t('wms.location.statusAvailable')}${t('wms.location.releaseSuccess').includes('成功') ? '成功' : ''}`) }
function handleExport() { ElMessage.success(t('wms.location.exportSuccess')) }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('wms.location.operationSuccess')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('wms.location.operationFailed')) } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(t('wms.location.confirmDelete', { code: row.locationCode }), t('wms.location.promptTitle'), { type: 'warning' }); ElMessage.success(t('wms.location.deleteSuccess')); loadData() }
async function handleBatchDelete() { await ElMessageBox.confirm(t('wms.location.confirmBatchDelete', { count: selectedRows.value.length }), t('wms.location.promptTitle'), { type: 'warning' }); ElMessage.success(t('wms.location.batchDeleteSuccess')); selectedRows.value = []; loadData() }
function getActions(row) {
  const actions = [
    { key: 'view', label: t('wms.location.actionView'), type: 'primary', handler: handleView },
    { key: 'edit', label: t('wms.location.actionEdit'), type: 'primary', handler: handleEdit }
  ]
  actions.push({ key: 'toggle', label: row.status === 1 ? t('wms.location.actionOccupy') : t('wms.location.actionRelease'), type: 'warning', handler: handleToggle })
  actions.push({ key: 'delete', label: t('wms.location.actionDelete'), type: 'danger', handler: handleDelete })
  return actions
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
