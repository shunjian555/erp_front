<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('wms.transfer.addBtn') }}</el-button>
        <el-button :icon="Download" plain @click="handleExport">{{ t('common.export') }}</el-button>
      </div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><el-tag :type="transferStatusMap[row.status]?.type || 'info'" size="small">{{ transferStatusMap[row.status]?.label || t('common.status') }}</el-tag></template>
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

    <el-dialog v-model="viewVisible" :title="t('wms.transfer.detailTitle')" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="t('wms.transfer.detailTransferNo')">{{ viewRow.transferNo }}</el-descriptions-item>
        <el-descriptions-item :label="t('wms.transfer.detailStatus')">{{ transferStatusMap[viewRow.status]?.label }}</el-descriptions-item>
        <el-descriptions-item :label="t('wms.transfer.detailFromWarehouse')">{{ viewRow.fromWarehouse }}</el-descriptions-item>
        <el-descriptions-item :label="t('wms.transfer.detailToWarehouse')">{{ viewRow.toWarehouse }}</el-descriptions-item>
        <el-descriptions-item :label="t('wms.transfer.detailGoodsName')">{{ viewRow.goodsName }}</el-descriptions-item>
        <el-descriptions-item :label="t('wms.transfer.detailQuantity')">{{ viewRow.quantity }}</el-descriptions-item>
        <el-descriptions-item :label="t('wms.transfer.detailOperator')">{{ viewRow.operator }}</el-descriptions-item>
        <el-descriptions-item :label="t('wms.transfer.detailCreateTime')">{{ viewRow.createTime }}</el-descriptions-item>
        <el-descriptions-item :label="t('wms.transfer.detailReason')" :span="2">{{ viewRow.reason }}</el-descriptions-item>
        <template v-if="viewRow.status === 1 || viewRow.status === 2 || viewRow.status === 3">
          <el-descriptions-item :label="t('wms.transfer.detailAuditor')">{{ viewRow.auditor || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('wms.transfer.detailAuditTime')">{{ viewRow.auditTime || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="viewRow.auditOpinion" :label="t('wms.transfer.detailAuditOpinion')" :span="2">{{ viewRow.auditOpinion }}</el-descriptions-item>
        </template>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="auditVisible" :title="auditForm.approved ? t('wms.transfer.auditApproveTitle') : t('wms.transfer.auditRejectTitle')" width="500px">
      <el-form :model="auditForm" label-width="100px">
        <el-form-item :label="t('wms.transfer.auditTransferNo')">{{ auditForm.transferNo }}</el-form-item>
        <el-form-item :label="t('wms.transfer.auditWarehouse')">{{ auditForm.fromWarehouse }} → {{ auditForm.toWarehouse }}</el-form-item>
        <el-form-item :label="t('wms.transfer.auditGoodsQty')">{{ auditForm.goodsName }} / {{ auditForm.quantity }}</el-form-item>
        <el-form-item :label="auditForm.approved ? t('wms.transfer.auditOpinionLabel') : t('wms.transfer.auditRejectLabel')" required>
          <el-input v-model="auditForm.auditOpinion" type="textarea" :rows="3" :placeholder="auditForm.approved ? t('wms.transfer.auditApprovePlaceholder') : t('wms.transfer.auditRejectPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="confirmAudit">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { Plus, Download, Refresh, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'

const { t } = useI18n({ useScope: 'local' })

const transferStatusMap = computed(() => ({
  0: { label: t('wms.transfer.statusPending'), type: 'warning' },
  1: { label: t('wms.transfer.statusApproved'), type: '' },
  2: { label: t('wms.transfer.statusShipped'), type: 'success' },
  3: { label: t('wms.transfer.statusReceived'), type: 'success' }
}))

const searchItems = computed(() => [
  { prop: 'transferNo', label: t('wms.transfer.searchTransferNoLabel'), type: 'input' },
  { prop: 'goodsName', label: t('wms.transfer.searchGoodsNameLabel'), type: 'input' }
])

const columns = computed(() => [
  { prop: 'transferNo', label: t('wms.transfer.colTransferNo'), width: 190 },
  { prop: 'fromWarehouse', label: t('wms.transfer.colFromWarehouse'), width: 120 },
  { prop: 'toWarehouse', label: t('wms.transfer.colToWarehouse'), width: 120 },
  { prop: 'goodsName', label: t('wms.transfer.colGoodsName'), width: 130 },
  { prop: 'quantity', label: t('wms.transfer.colQuantity'), width: 80, align: 'center' },
  { prop: 'operator', label: t('wms.transfer.colOperator'), width: 90 },
  { prop: 'status', label: t('wms.transfer.colStatus'), width: 90, slot: 'status' },
  { prop: 'createTime', label: t('wms.transfer.colCreateTime'), width: 170 }
])

const formItems = computed(() => [
  { prop: 'transferNo', label: t('wms.transfer.form.transferNoLabel'), type: 'input', span: 12 },
  { prop: 'goodsName', label: t('wms.transfer.form.goodsNameLabel'), type: 'input', span: 12 },
  { prop: 'fromWarehouse', label: t('wms.transfer.form.fromWarehouseLabel'), type: 'input', span: 12 },
  { prop: 'toWarehouse', label: t('wms.transfer.form.toWarehouseLabel'), type: 'input', span: 12 },
  { prop: 'quantity', label: t('wms.transfer.form.quantityLabel'), type: 'number', span: 12 },
  { prop: 'reason', label: t('wms.transfer.form.reasonLabel'), type: 'textarea', rows: 3, span: 24 }
])

const formRules = computed(() => ({
  transferNo: [{ required: true, message: t('wms.transfer.required.transferNo'), trigger: 'blur' }]
}))

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const auditVisible = ref(false), auditForm = reactive({ id: undefined, transferNo: '', fromWarehouse: '', toWarehouse: '', goodsName: '', quantity: undefined, approved: true, auditOpinion: '' })
const queryParams = reactive({ pageNum: 1, pageSize: 10, transferNo: '', goodsName: '' })
const formData = reactive({ id: undefined, transferNo: '', goodsName: '', fromWarehouse: '', toWarehouse: '', quantity: undefined, reason: '' })

async function loadData() {
  loading.value = true
  try {
    const goodsList = ['苹果手机壳', '小米充电宝', '华为耳机', '联想键盘', '罗技鼠标']
    const whs = ['主仓库', '分仓库A', '华南仓库']
    const all = Array.from({ length: 24 }, (_, i) => {
      const stt = i % 4
      const fromIdx = i % 3
      let toIdx = (fromIdx + 1 + (i % 2)) % 3
      if (toIdx === fromIdx) toIdx = (fromIdx + 1) % 3
      return {
        id: i + 1,
        transferNo: `TF${String(i + 1).padStart(4, '0')}`,
        fromWarehouse: whs[fromIdx],
        toWarehouse: whs[toIdx],
        goodsName: goodsList[i % goodsList.length],
        quantity: 50 + (i % 5) * 30,
        operator: ['张三', '李四', '王五', '赵六'][i % 4],
        status: stt,
        createTime: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 09:00:00`,
        reason: '库存调拨',
        auditor: stt > 0 ? ['王经理', '李总'][i % 2] : '',
        auditTime: stt > 0 ? `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 14:00:00` : '',
        auditOpinion: stt === 0 ? '' : (i % 3 === 0 ? '同意' : '情况属实，批准')
      }
    })
    const { transferNo = '', goodsName = '', pageNum = 1, pageSize = 10 } = queryParams
    let filtered = all
    if (transferNo) filtered = filtered.filter(x => x.transferNo.includes(transferNo))
    if (goodsName) filtered = filtered.filter(x => x.goodsName.includes(goodsName))
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = t('wms.transfer.dialogAddTitle'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function handleEdit(r) { dialogTitle.value = t('wms.transfer.dialogEditTitle'); Object.assign(formData, r); dialogVisible.value = true }
function openAudit(row, approved) { Object.assign(auditForm, row, { approved, auditOpinion: '' }); auditVisible.value = true }
async function confirmAudit() {
  if (!auditForm.auditOpinion.trim()) { ElMessage.warning(auditForm.approved ? t('wms.transfer.approveOpinionRequired') : t('wms.transfer.rejectReasonRequired')); return }
  const row = tableData.value.find(x => x.id === auditForm.id)
  if (row) { row.status = 1; row.auditor = '当前用户'; row.auditTime = new Date().toISOString().slice(0, 19).replace('T', ' '); row.auditOpinion = auditForm.auditOpinion }
  ElMessage.success(auditForm.approved ? t('wms.transfer.approveSuccess') : t('wms.transfer.rejectSuccess'))
  auditVisible.value = false
}
function handleOutbound(row) { row.status = 2; ElMessage.success(t('wms.transfer.outboundSuccess')) }
function handleReceive(row) { row.status = 3; ElMessage.success(t('wms.transfer.receiveSuccess')) }
function handleExport() { ElMessage.success(t('wms.transfer.exportSuccess')) }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('common.success')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('common.failed')) } finally { submitLoading.value = false } }
async function handleDelete(row) {
  if (row.status !== 0) { ElMessage.warning(t('wms.transfer.deleteOnlyPending')); return }
  await ElMessageBox.confirm(t('wms.transfer.deleteConfirm', { no: row.transferNo }), t('common.hint'), { type: 'warning' }); ElMessage.success(t('common.deleteSuccess')); loadData()
}
function getActions(row) {
  const actions = [{ key: 'view', label: t('wms.transfer.actionView'), type: 'primary', handler: handleView }]
  if (row.status === 0) {
    actions.push({ key: 'approve', label: t('wms.transfer.actionApprove'), type: 'success', handler: (r) => openAudit(r, true) })
    actions.push({ key: 'reject', label: t('wms.transfer.actionReject'), type: 'danger', handler: (r) => openAudit(r, false) })
    actions.push({ key: 'edit', label: t('wms.transfer.actionEdit'), type: 'primary', handler: handleEdit })
  }
  if (row.status === 1) { actions.push({ key: 'outbound', label: t('wms.transfer.actionOutbound'), type: 'warning', handler: handleOutbound }) }
  if (row.status === 2) { actions.push({ key: 'receive', label: t('wms.transfer.actionReceive'), type: 'success', handler: handleReceive }) }
  if (row.status === 0) { actions.push({ key: 'delete', label: t('wms.transfer.actionDelete'), type: 'danger', handler: handleDelete }) }
  return actions
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
