<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button :icon="Download" plain>导出</el-button><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'warning'">{{ row.status === 1 ? '已付清' : '未付清' }}</BaseStatusTag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleView(row)">查看</el-button></template>
    </BaseTable>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'

const searchItems = [ { prop: 'supplierName', label: '供应商', type: 'input' }, { prop: 'orderNo', label: '关联订单', type: 'input' }, { prop: 'dateRange', label: '日期范围', type: 'daterange' } ]
const columns = [ { prop: 'payableNo', label: '应付单号', width: 190 }, { prop: 'supplierName', label: '供应商', width: 130 }, { prop: 'orderNo', label: '关联订单', width: 180 }, { prop: 'amount', label: '金额', width: 120 }, { prop: 'paidAmount', label: '已付金额', width: 120 }, { prop: 'remainAmount', label: '剩余金额', width: 120 }, { prop: 'dueDate', label: '到期日', width: 120 }, { prop: 'status', label: '状态', width: 90, slot: 'status' } ]

const loading = ref(false), tableData = ref([]), total = ref(0)
const queryParams = reactive({ pageNum: 1, pageSize: 10, supplierName: '', orderNo: '', dateRange: [] })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/finance/payable/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleView(row) { ElMessage.info(`查看: ${row.payableNo}`) }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
