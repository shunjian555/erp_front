<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button :icon="Download" plain>导出预警报告</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag type="danger">预警</BaseStatusTag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleView(row)">详情</el-button><el-button type="warning" link size="small" @click="handleAdjust(row)">调整</el-button></template>
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

const searchItems = [ { prop: 'goodsName', label: '商品名称', type: 'input' }, { prop: 'level', label: '预警级别', type: 'select', options: [{ value: '', label: '全部' }, { value: 'high', label: '高' }, { value: 'medium', label: '中' }, { value: 'low', label: '低' }] } ]
const columns = [ { prop: 'goodsName', label: '商品名称', width: 150 }, { prop: 'goodsCode', label: '编码', width: 140 }, { prop: 'currentStock', label: '当前库存', width: 100, align: 'center' }, { prop: 'safeStock', label: '安全库存', width: 100, align: 'center' }, { prop: 'gap', label: '缺口', width: 80, align: 'center' }, { prop: 'unit', label: '单位', width: 60, align: 'center' }, { prop: 'level', label: '级别', width: 70 }, { prop: 'status', label: '状态', width: 70, slot: 'status' }, { prop: 'lastInDate', label: '最近入库', width: 120 } ]

const loading = ref(false), tableData = ref([]), total = ref(0)
const queryParams = reactive({ pageNum: 1, pageSize: 10, goodsName: '', level: '' })

async function loadData() {
  loading.value = true
  try {
    const res = await (await import('@/utils/request')).default({ url: '/api/inventory/warning/list', method: 'get', params: queryParams })
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleView(row) { ElMessage.info(`查看: ${row.goodsName}`) }
function handleAdjust(row) { ElMessage.info(`调整: ${row.goodsName}`) }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
