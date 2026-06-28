<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('inventory.addStocktake') }}</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><el-tag :type="stocktakeStatusMap[row.status]?.type || 'info'" size="small">{{ stocktakeStatusMap[row.status]?.label || '—' }}</el-tag></template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 2)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 2" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">{{ t('common.moreActions') }}<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="action in getActions(row).slice(2)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="t('inventory.addStocktake')" width="550px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" /></BaseDialog>

    <!-- Detail -->
    <el-dialog v-model="viewVisible" :title="t('inventory.stocktakeDetail')" width="640px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="t('inventory.stocktakeNo')">{{ viewRow.stocktakeNo }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.stockStatus')"><el-tag :type="stocktakeStatusMap[viewRow.status]?.type || 'info'" size="small">{{ stocktakeStatusMap[viewRow.status]?.label || '—' }}</el-tag></el-descriptions-item>
        <el-descriptions-item :label="t('inventory.warehouse')">{{ viewRow.warehouse }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.executor')">{{ viewRow.executor }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.skuCount')">{{ viewRow.totalCount }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.diffCount')">
          <span :class="viewRow.diffCount > 0 ? 'diff-pos' : viewRow.diffCount < 0 ? 'diff-neg' : ''">{{ viewRow.diffCount }}</span>
        </el-descriptions-item>
        <el-descriptions-item :label="t('inventory.startTime')" :span="2">{{ viewRow.startTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, ArrowDown } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import request from '@/utils/request'

const { t } = useI18n()

const stocktakeStatusMap = computed(() => ({
  0: { label: t('inventory.statusPending'), type: 'info' },
  1: { label: t('inventory.statusCounting'), type: 'warning' },
  2: { label: t('inventory.statusCompleted'), type: 'success' },
  3: { label: t('inventory.statusCancelled'), type: 'info' }
}))

const searchItems = computed(() => [
  { prop: 'stocktakeNo', label: t('inventory.stocktakeNo'), type: 'input' },
  { prop: 'warehouse', label: t('inventory.warehouse'), type: 'input' },
  { prop: 'status', label: t('inventory.stockStatus'), type: 'select', options: Object.entries(stocktakeStatusMap.value).map(([v, l]) => ({ value: Number(v), label: l.label })) }
])
const columns = computed(() => [
  { prop: 'stocktakeNo', label: t('inventory.stocktakeNo'), width: 190 },
  { prop: 'warehouse', label: t('inventory.warehouse'), width: 110 },
  { prop: 'totalCount', label: t('inventory.skuCount'), width: 80, align: 'center' },
  { prop: 'diffCount', label: t('inventory.diffCount'), width: 80, align: 'center' },
  { prop: 'executor', label: t('inventory.executor'), width: 90 },
  { prop: 'startTime', label: t('inventory.startTime'), width: 170 },
  { prop: 'status', label: t('inventory.stockStatus'), width: 90, slot: 'status' }
])
const formItems = computed(() => [
  { prop: 'stocktakeNo', label: t('inventory.stocktakeNo'), type: 'input' },
  { prop: 'warehouse', label: t('inventory.warehouse'), type: 'input' },
  { prop: 'remark', label: t('inventory.remark'), type: 'textarea', rows: 3 }
])
const formRules = computed(() => ({
  stocktakeNo: [{ required: true, message: t('inventory.inputStocktakeNo'), trigger: 'blur' }]
}))

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
async function handleStart(r) { await ElMessageBox.confirm(t('inventory.startConfirm', { no: r.stocktakeNo }), t('common.hint'), { type: 'warning' }); await request({ url: '/api/inventory/stocktake/start', method: 'post', data: { id: r.id } }).catch(() => {}); ElMessage.success(t('inventory.startSuccess')); loadData() }
async function handleFinish(r) { await ElMessageBox.confirm(t('inventory.finishConfirm', { no: r.stocktakeNo }), t('common.hint'), { type: 'warning' }); await request({ url: '/api/inventory/stocktake/finish', method: 'post', data: { id: r.id } }).catch(() => {}); ElMessage.success(t('inventory.finishSuccess')); loadData() }
async function handleCancel(r) { await ElMessageBox.confirm(t('inventory.cancelConfirm', { no: r.stocktakeNo }), t('common.hint'), { type: 'warning' }); await request({ url: '/api/inventory/stocktake/cancel', method: 'post', data: { id: r.id } }).catch(() => {}); ElMessage.success(t('inventory.cancelSuccess')); loadData() }
function getActions(row) {
  const actions = [{ key: 'view', label: t('common.detail'), type: 'primary', handler: handleView }]
  if (row.status === 0) {
    actions.push({ key: 'start', label: t('inventory.startStocktake'), type: 'primary', handler: handleStart })
    actions.push({ key: 'cancel', label: t('inventory.cancelStocktake'), type: 'danger', handler: handleCancel })
  }
  if (row.status === 1) {
    actions.push({ key: 'finish', label: t('inventory.finishStocktake'), type: 'success', handler: handleFinish })
    actions.push({ key: 'cancel', label: t('inventory.cancelStocktake'), type: 'danger', handler: handleCancel })
  }
  return actions
}
function handleCommand(cmd, row) { const action = getActions(row).find(a => a.key === cmd); action?.handler(row) }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await request({ url: '/api/inventory/stocktake/save', method: 'post', data: formData }); ElMessage.success(t('inventory.createSuccess')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('inventory.createFailed')) } finally { submitLoading.value = false } }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
.diff-pos { color: #67c23a; font-weight: 600; }
.diff-neg { color: #f56c6c; font-weight: 600; }
</style>
