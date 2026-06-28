<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button :icon="Download" plain @click="handleExport">{{ t('inventory.exportWarning') }}</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag type="danger">{{ t('inventory.warningStatus') }}</BaseStatusTag></template>
      <template #level="{ row }"><el-tag :type="levelMap[row.level]?.type || 'info'" size="small">{{ levelMap[row.level]?.label || row.level }}</el-tag></template>
      <template #operation="{ row }">
        <el-button type="primary" link size="small" @click="handleView(row)">{{ t('common.detail') }}</el-button>
        <el-button type="warning" link size="small" @click="handleAdjust(row)">{{ t('inventory.adjust') }}</el-button>
        <el-button type="success" link size="small" @click="handlePurchase(row)">{{ t('inventory.purchaseReplenish') }}</el-button>
      </template>
    </BaseTable>

    <!-- Detail -->
    <el-dialog v-model="viewVisible" :title="t('inventory.warningDetail')" width="640px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="t('inventory.goodsName')">{{ viewRow.goodsName }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.goodsCode')">{{ viewRow.goodsCode }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.currentStock')">{{ viewRow.currentStock }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.safeStock')">{{ viewRow.safeStock }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.gap')">{{ viewRow.gap }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.unit')">{{ viewRow.unit }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.level')">
          <el-tag :type="levelMap[viewRow.level]?.type || 'info'" size="small">{{ levelMap[viewRow.level]?.label || viewRow.level }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('inventory.lastInDate')">{{ viewRow.lastInDate }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.suggestQty')" :span="2">
          <span class="text-warn">{{ t('inventory.suggestText', { qty: viewRow.safeStock * 2 - viewRow.currentStock, unit: viewRow.unit }) }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- Adjust -->
    <el-dialog v-model="adjustVisible" :title="t('inventory.adjustDialog')" width="500px" :close-on-click-modal="false">
      <el-form :model="adjustForm" label-width="100px">
        <el-form-item :label="t('inventory.goodsName')"><el-input v-model="adjustForm.goodsName" disabled /></el-form-item>
        <el-form-item :label="t('inventory.goodsCode')"><el-input v-model="adjustForm.goodsCode" disabled /></el-form-item>
        <el-form-item :label="t('inventory.currentStock')"><el-input :value="adjustForm.currentStock + ' ' + adjustForm.unit" disabled /></el-form-item>
        <el-form-item :label="t('inventory.safeStock')"><el-input :value="adjustForm.safeStock + ' ' + adjustForm.unit" disabled /></el-form-item>
        <el-form-item :label="t('inventory.adjustType')">
          <el-radio-group v-model="adjustForm.adjustType">
            <el-radio value="increase">{{ t('inventory.adjustTypeIncrease') }}</el-radio>
            <el-radio value="decrease">{{ t('inventory.adjustTypeDecrease') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('inventory.adjustQty')" required>
          <el-input-number v-model="adjustForm.qty" :min="0" :max="adjustForm.adjustType === 'decrease' ? adjustForm.currentStock : 99999" />
        </el-form-item>
        <el-form-item :label="t('inventory.adjustReason')">
          <el-select v-model="adjustForm.reason" :placeholder="t('common.selectPlaceholder')" style="width:100%">
            <el-option v-for="r in reasonOptions" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('inventory.remark')"><el-input v-model="adjustForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="adjustLoading" @click="submitAdjust">{{ t('inventory.adjustSubmit') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Refresh } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
import request from '@/utils/request'

const { t } = useI18n()

const levelMap = computed(() => ({
  high: { label: t('inventory.levelHigh'), type: 'danger' },
  medium: { label: t('inventory.levelMedium'), type: 'warning' },
  low: { label: t('inventory.levelLow'), type: 'info' }
}))

const reasonOptions = computed(() => [
  { value: '盘盈', label: t('inventory.reasonStockGain') },
  { value: '盘损', label: t('inventory.reasonStockLoss') },
  { value: '损坏', label: t('inventory.reasonDamaged') },
  { value: '过期', label: t('inventory.reasonExpired') },
  { value: '其他', label: t('inventory.reasonOther') }
])

const searchItems = computed(() => [
  { prop: 'goodsName', label: t('inventory.goodsName'), type: 'input' },
  { prop: 'level', label: t('inventory.level'), type: 'select', options: [{ value: '', label: t('inventory.all') }, { value: 'high', label: t('inventory.levelHigh') }, { value: 'medium', label: t('inventory.levelMedium') }, { value: 'low', label: t('inventory.levelLow') }] }
])
const columns = computed(() => [
  { prop: 'goodsName', label: t('inventory.goodsName'), width: 150 },
  { prop: 'goodsCode', label: t('inventory.goodsCode'), width: 140 },
  { prop: 'currentStock', label: t('inventory.currentStock'), width: 100, align: 'center' },
  { prop: 'safeStock', label: t('inventory.safeStock'), width: 100, align: 'center' },
  { prop: 'gap', label: t('inventory.gap'), width: 80, align: 'center' },
  { prop: 'unit', label: t('inventory.unit'), width: 60, align: 'center' },
  { prop: 'level', label: t('inventory.level'), width: 80, slot: 'level', align: 'center' },
  { prop: 'status', label: t('inventory.stockStatus'), width: 70, slot: 'status' },
  { prop: 'lastInDate', label: t('inventory.lastInDate'), width: 120 }
])

const loading = ref(false), tableData = ref([]), total = ref(0)
const queryParams = reactive({ pageNum: 1, pageSize: 10, goodsName: '', level: '' })
const viewVisible = ref(false), viewRow = ref(null)
const adjustVisible = ref(false), adjustLoading = ref(false), adjustRow = ref(null)
const adjustForm = reactive({ goodsCode: '', goodsName: '', unit: '', currentStock: 0, safeStock: 0, qty: 0, adjustType: 'increase', reason: '', remark: '' })

async function loadData() {
  loading.value = true
  try {
    const res = await request({ url: '/api/inventory/warning/list', method: 'get', params: queryParams })
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function handleAdjust(row) {
  adjustRow.value = row
  adjustForm.goodsCode = row.goodsCode
  adjustForm.goodsName = row.goodsName
  adjustForm.unit = row.unit
  adjustForm.currentStock = row.currentStock
  adjustForm.safeStock = row.safeStock
  adjustForm.qty = Math.max(0, row.safeStock - row.currentStock)
  adjustForm.adjustType = 'increase'
  adjustForm.reason = ''
  adjustForm.remark = ''
  adjustVisible.value = true
}
function handlePurchase(row) { ElMessage.success(t('inventory.purchaseReplenishSuccess', { name: row.goodsName })) }
async function submitAdjust() {
  if (!adjustForm.qty || adjustForm.qty <= 0) { ElMessage.warning(t('inventory.invalidQty')); return }
  if (adjustForm.adjustType === 'decrease' && adjustForm.qty > adjustForm.currentStock) { ElMessage.warning(t('inventory.adjustQtyExceed')); return }
  adjustLoading.value = true
  try {
    await request({ url: '/api/inventory/adjust/save', method: 'post', data: { adjustNo: 'ADJ' + Date.now(), goodsName: adjustForm.goodsName, adjustType: adjustForm.adjustType, adjustQty: adjustForm.qty, reason: adjustForm.reason } }).catch(() => {})
    ElMessage.success(t('inventory.adjustSubmitSuccess'))
    adjustVisible.value = false
    loadData()
  } finally { adjustLoading.value = false }
}
function handleExport() { ElMessage.success(t('inventory.warningExportSuccess')) }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
.text-warn { color: #e6a23c; }
</style>
