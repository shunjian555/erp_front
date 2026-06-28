<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('inventory.addAdjust') }}</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #adjustType="{ row }"><el-tag :type="row.adjustType === 'increase' ? 'success' : 'danger'" size="small">{{ row.adjustType === 'increase' ? t('inventory.adjustIncrease') : t('inventory.adjustDecrease') }}</el-tag></template>
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'warning'">{{ row.status === 1 ? t('inventory.statusCompleted') : t('inventory.statusPending') }}</BaseStatusTag></template>
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

    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>

    <!-- Detail -->
    <el-dialog v-model="viewVisible" :title="t('inventory.adjustDetail')" width="640px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="t('inventory.adjustNo')">{{ viewRow.adjustNo }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.adjustType')"><BaseStatusTag :type="viewRow.status === 1 ? 'success' : 'warning'">{{ viewRow.status === 1 ? t('inventory.statusCompleted') : t('inventory.statusPending') }}</BaseStatusTag></el-descriptions-item>
        <el-descriptions-item :label="t('inventory.goodsName')">{{ viewRow.goodsName }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.adjustType')">
          <el-tag :type="viewRow.adjustType === 'increase' ? 'success' : 'danger'" size="small">{{ viewRow.adjustType === 'increase' ? t('inventory.adjustIncrease') : t('inventory.adjustDecrease') }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('inventory.adjustQty')">{{ viewRow.adjustQty }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.operator')">{{ viewRow.operator }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.remark')" :span="2">{{ viewRow.reason }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.updateTime')" :span="2">{{ viewRow.createTime }}</el-descriptions-item>
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
import BaseStatusTag from '@/components/BaseStatusTag.vue'
import request from '@/utils/request'

const { t } = useI18n()

const searchItems = computed(() => [
  { prop: 'adjustNo', label: t('inventory.adjustNo'), type: 'input' },
  { prop: 'goodsName', label: t('inventory.goodsName'), type: 'input' }
])
const columns = computed(() => [
  { prop: 'adjustNo', label: t('inventory.adjustNo'), width: 190 },
  { prop: 'goodsName', label: t('inventory.goodsName'), width: 130 },
  { prop: 'adjustType', label: t('inventory.adjustType'), width: 80, slot: 'adjustType' },
  { prop: 'adjustQty', label: t('inventory.adjustQty'), width: 80, align: 'center' },
  { prop: 'reason', label: t('inventory.remark'), minWidth: 150, showOverflowTooltip: true },
  { prop: 'operator', label: t('inventory.operator'), width: 90 },
  { prop: 'status', label: t('inventory.stockStatus'), width: 90, slot: 'status' },
  { prop: 'createTime', label: t('inventory.updateTime'), width: 170 }
])
const formItems = computed(() => [
  { prop: 'adjustNo', label: t('inventory.adjustNo'), type: 'input', span: 12 },
  { prop: 'goodsName', label: t('inventory.goodsName'), type: 'input', span: 12 },
  { prop: 'adjustType', label: t('inventory.adjustType'), type: 'radio', span: 12, options: [{ value: 'increase', label: t('inventory.adjustIncrease') }, { value: 'decrease', label: t('inventory.adjustDecrease') }] },
  { prop: 'adjustQty', label: t('inventory.adjustQty'), type: 'number', span: 12 },
  { prop: 'reason', label: t('inventory.remark'), type: 'textarea', rows: 3, span: 24 }
])
const formRules = computed(() => ({
  adjustNo: [{ required: true, message: t('inventory.inputAdjustNo'), trigger: 'blur' }],
  goodsName: [{ required: true, message: t('inventory.selectGoods'), trigger: 'blur' }]
}))

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, adjustNo: '', goodsName: '' })
const formData = reactive({ id: undefined, adjustNo: '', goodsName: '', adjustType: 'increase', adjustQty: undefined, reason: '' })
const viewVisible = ref(false), viewRow = ref(null)

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/inventory/adjust/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = t('inventory.addAdjust'); Object.keys(formData).forEach(k => { if (k === 'adjustType') formData[k] = 'increase'; else if (k === 'id') formData[k] = undefined; else formData[k] = '' }); dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
function handleEdit(r) { dialogTitle.value = t('inventory.editAdjust'); Object.assign(formData, r); dialogVisible.value = true }
async function handleApprove(r) {
  await ElMessageBox.confirm(t('inventory.adjustApproveConfirm', { no: r.adjustNo }), t('common.hint'), { type: 'warning' })
  await request({ url: '/api/inventory/adjust/approve', method: 'post', data: { id: r.id } }).catch(() => {})
  ElMessage.success(t('inventory.adjustApproveSuccess'))
  loadData()
}
async function handleDelete(r) {
  await ElMessageBox.confirm(t('inventory.adjustDeleteConfirm', { no: r.adjustNo }), t('common.hint'), { type: 'warning' })
  await request({ url: '/api/inventory/adjust/delete', method: 'post', data: { id: r.id } }).catch(() => {})
  ElMessage.success(t('common.deleteSuccess'))
  loadData()
}
function getActions(row) {
  const actions = [{ key: 'view', label: t('common.detail'), type: 'primary', handler: handleView }]
  if (row.status === 0) {
    actions.push({ key: 'edit', label: t('common.edit'), type: 'primary', handler: handleEdit })
    actions.push({ key: 'approve', label: t('inventory.adjustApprove'), type: 'success', handler: handleApprove })
    actions.push({ key: 'delete', label: t('common.delete'), type: 'danger', handler: handleDelete })
  }
  return actions
}
function handleCommand(cmd, row) { const action = getActions(row).find(a => a.key === cmd); action?.handler(row) }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await request({ url: '/api/inventory/adjust/save', method: 'post', data: formData }); ElMessage.success(t('inventory.adjustSaveSuccess')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('inventory.adjustSaveFailed')) } finally { submitLoading.value = false } }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
