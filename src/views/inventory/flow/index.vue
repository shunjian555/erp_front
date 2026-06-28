<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button :icon="Download" plain @click="handleExport">{{ t('common.export') }}</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #type="{ row }"><el-tag :type="row.type === 'in' ? 'success' : 'danger'" size="small">{{ row.type === 'in' ? t('inventory.stockIn') : t('inventory.stockOutAction') }}</el-tag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleView(row)">{{ t('common.detail') }}</el-button></template>
    </BaseTable>

    <!-- Detail -->
    <el-dialog v-model="viewVisible" :title="t('inventory.flowDetail')" width="640px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="t('inventory.flowNo')">{{ viewRow.flowNo }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.adjustType')">
          <el-tag :type="viewRow.type === 'in' ? 'success' : 'danger'" size="small">{{ viewRow.type === 'in' ? t('inventory.stockIn') : t('inventory.stockOutAction') }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('inventory.goodsName')">{{ viewRow.goodsName }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.sourceType')">{{ viewRow.sourceType }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.changeQty')" :span="2">{{ viewRow.quantity }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.changeBefore')">{{ viewRow.beforeStock }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.changeAfter')">{{ viewRow.afterStock }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.operator')">{{ viewRow.operator }}</el-descriptions-item>
        <el-descriptions-item :label="t('inventory.updateTime')">{{ viewRow.createTime }}</el-descriptions-item>
      </el-descriptions>
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
import request from '@/utils/request'

const { t } = useI18n()

const searchItems = computed(() => [
  { prop: 'goodsName', label: t('inventory.goodsName'), type: 'input' },
  { prop: 'type', label: t('inventory.adjustType'), type: 'select', options: [{ value: '', label: t('inventory.all') }, { value: 'in', label: t('inventory.stockIn') }, { value: 'out', label: t('inventory.stockOutAction') }] },
  { prop: 'dateRange', label: '日期范围', type: 'daterange' }
])
const columns = computed(() => [
  { prop: 'flowNo', label: t('inventory.flowNo'), width: 180 },
  { prop: 'goodsName', label: t('inventory.goodsName'), width: 130 },
  { prop: 'type', label: t('inventory.adjustType'), width: 80, slot: 'type' },
  { prop: 'quantity', label: t('inventory.adjustQty'), width: 80, align: 'center' },
  { prop: 'beforeStock', label: t('inventory.changeBefore'), width: 110, align: 'center' },
  { prop: 'afterStock', label: t('inventory.changeAfter'), width: 110, align: 'center' },
  { prop: 'sourceType', label: t('inventory.sourceType'), width: 100 },
  { prop: 'operator', label: t('inventory.operator'), width: 90 },
  { prop: 'createTime', label: t('inventory.updateTime'), width: 170 }
])

const loading = ref(false), tableData = ref([]), total = ref(0)
const queryParams = reactive({ pageNum: 1, pageSize: 10, goodsName: '', type: '', dateRange: [] })
const viewVisible = ref(false), viewRow = ref(null)

async function loadData() {
  loading.value = true
  try {
    const res = await request({ url: '/api/inventory/flow/list', method: 'get', params: queryParams })
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function handleExport() { ElMessage.success(t('inventory.exportSuccess')) }

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
