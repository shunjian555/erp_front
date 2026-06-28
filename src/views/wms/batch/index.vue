<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('wms.batch.addBtn') }}</el-button>
        <el-button :icon="Download" plain @click="handleExport">{{ t('wms.batch.exportBtn') }}</el-button>
      </div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? t('wms.batch.statusValid') : t('wms.batch.statusInvalid') }}</BaseStatusTag></template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 2)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 2" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">{{ t('wms.batch.moreActions') }}<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="action in getActions(row).slice(2)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>
    <el-dialog v-model="viewVisible" :title="t('wms.batch.viewTitle')" width="500px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="t('wms.batch.viewBatchNo')">{{ viewRow.batchNo }}</el-descriptions-item>
        <el-descriptions-item :label="t('wms.batch.viewGoodsName')">{{ viewRow.goodsName }}</el-descriptions-item>
        <el-descriptions-item :label="t('wms.batch.viewQuantity')">{{ viewRow.quantity }}</el-descriptions-item>
        <el-descriptions-item :label="t('wms.batch.viewWarehouse')">{{ viewRow.warehouse }}</el-descriptions-item>
        <el-descriptions-item :label="t('wms.batch.viewProduceDate')">{{ viewRow.produceDate }}</el-descriptions-item>
        <el-descriptions-item :label="t('wms.batch.viewExpireDate')">{{ viewRow.expireDate }}</el-descriptions-item>
        <el-descriptions-item :label="t('wms.batch.viewStatus')">{{ viewRow.status === 1 ? t('wms.batch.statusValid') : t('wms.batch.statusInvalid') }}</el-descriptions-item>
        <el-descriptions-item :label="t('wms.batch.viewRemark')" :span="2">{{ viewRow.remark }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Refresh, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'

const { t } = useI18n({ useScope: 'local' })

const searchItems = computed(() => [
  { prop: 'batchNo', label: t('wms.batch.searchBatchNoLabel'), type: 'input' },
  { prop: 'goodsName', label: t('wms.batch.searchGoodsNameLabel'), type: 'input' }
])

const columns = computed(() => [
  { prop: 'batchNo', label: t('wms.batch.colBatchNo'), width: 190 },
  { prop: 'goodsName', label: t('wms.batch.colGoodsName'), width: 130 },
  { prop: 'quantity', label: t('wms.batch.colQuantity'), width: 80, align: 'center' },
  { prop: 'produceDate', label: t('wms.batch.colProduceDate'), width: 120 },
  { prop: 'expireDate', label: t('wms.batch.colExpireDate'), width: 120 },
  { prop: 'warehouse', label: t('wms.batch.colWarehouse'), width: 100 },
  { prop: 'status', label: t('wms.batch.colStatus'), width: 80, slot: 'status' }
])

const formItems = computed(() => [
  { prop: 'batchNo', label: t('wms.batch.formBatchNoLabel'), type: 'input', span: 12 },
  { prop: 'goodsName', label: t('wms.batch.formGoodsNameLabel'), type: 'input', span: 12 },
  { prop: 'quantity', label: t('wms.batch.formQuantityLabel'), type: 'number', span: 12 },
  { prop: 'produceDate', label: t('wms.batch.formProduceDateLabel'), type: 'date', span: 12 },
  { prop: 'expireDate', label: t('wms.batch.formExpireDateLabel'), type: 'date', span: 12 },
  { prop: 'remark', label: t('wms.batch.formRemarkLabel'), type: 'textarea', rows: 3, span: 24 }
])

const formRules = computed(() => ({
  batchNo: [{ required: true, message: t('wms.batch.formBatchNoRequired'), trigger: 'blur' }]
}))

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, batchNo: '', goodsName: '' })
const formData = reactive({ id: undefined, batchNo: '', goodsName: '', quantity: undefined, produceDate: '', expireDate: '', remark: '' })

async function loadData() {
  loading.value = true
  try {
    const goodsList = ['苹果手机壳', '小米充电宝', '华为耳机', '联想键盘', '罗技鼠标']
    const whs = ['主仓库', '分仓库A', '华南仓库']
    const all = Array.from({ length: 25 }, (_, i) => {
      const stt = i % 6 === 5 ? 0 : 1
      return {
        id: i + 1,
        batchNo: `B${String(i + 1).padStart(4, '0')}`,
        goodsName: goodsList[i % goodsList.length],
        quantity: 100 + (i % 5) * 50,
        produceDate: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        expireDate: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        warehouse: whs[i % whs.length],
        status: stt,
        remark: i % 3 === 0 ? '常规批次' : '进口批次'
      }
    })
    const { batchNo = '', goodsName = '', pageNum = 1, pageSize = 10 } = queryParams
    let filtered = all
    if (batchNo) filtered = filtered.filter(x => x.batchNo.includes(batchNo))
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
function handleAdd() { dialogTitle.value = t('wms.batch.dialogNewTitle'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function handleEdit(r) { dialogTitle.value = t('wms.batch.dialogEditTitle'); Object.assign(formData, r); dialogVisible.value = true }
function handleToggle(row) { row.status = row.status === 1 ? 0 : 1; ElMessage.success(row.status === 1 ? t('wms.batch.msgEnableSuccess') : t('wms.batch.msgDisableSuccess')) }
function handleExport() { ElMessage.success(t('wms.batch.msgExportSuccess')) }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('wms.batch.msgOperateSuccess')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('wms.batch.msgOperateFailed')) } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(t('wms.batch.msgDeleteConfirm', { batchNo: row.batchNo }), t('wms.batch.msgDeleteTitle'), { type: 'warning' }); ElMessage.success(t('wms.batch.msgDeleteSuccess')); loadData() }
function getActions(row) {
  const actions = [
    { key: 'view', label: t('wms.batch.actionView'), type: 'primary', handler: handleView },
    { key: 'edit', label: t('wms.batch.actionEdit'), type: 'primary', handler: handleEdit }
  ]
  actions.push({ key: 'toggle', label: row.status === 1 ? t('wms.batch.actionDisable') : t('wms.batch.actionEnable'), type: 'warning', handler: handleToggle })
  actions.push({ key: 'delete', label: t('wms.batch.actionDelete'), type: 'danger', handler: handleDelete })
  return actions
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
