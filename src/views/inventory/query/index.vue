<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button :icon="Download" plain>导出</el-button><el-button :icon="Printer" plain>打印</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #stock="{ row }"><span :class="{ 'low-stock': row.stock < row.safeStock }">{{ row.stock }}</span></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleView(row)">详情</el-button></template>
    </BaseTable>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Printer, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'

const searchItems = [ { prop: 'goodsName', label: '商品名称', type: 'input' }, { prop: 'goodsCode', label: '商品编码', type: 'input' }, { prop: 'category', label: '分类', type: 'select', options: [{ value: '', label: '全部' }, { value: '电子产品', label: '电子产品' }, { value: '办公用品', label: '办公用品' }] }, { prop: 'warehouse', label: '仓库', type: 'input' } ]
const columns = [ { prop: 'goodsCode', label: '编码', width: 140 }, { prop: 'goodsName', label: '商品名称', width: 150 }, { prop: 'category', label: '分类', width: 110 }, { prop: 'warehouse', label: '仓库', width: 100 }, { prop: 'unit', label: '单位', width: 60, align: 'center' }, { prop: 'safeStock', label: '安全库存', width: 90, align: 'center' }, { prop: 'stock', label: '当前库存', width: 100, align: 'center', slot: 'stock' }, { prop: 'costPrice', label: '成本价', width: 100 }, { prop: 'totalValue', label: '库存金额', width: 120 }, { prop: 'updateTime', label: '更新时间', width: 170 } ]

const loading = ref(false), tableData = ref([]), total = ref(0)
const queryParams = reactive({ pageNum: 1, pageSize: 10, goodsName: '', goodsCode: '', category: '', warehouse: '' })

async function loadData() {
  loading.value = true
  try {
    const res = await (await import('@/utils/request')).default({ url: '/api/inventory/query/list', method: 'get', params: queryParams })
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleView(row) { ElMessage.info(`查看: ${row.goodsName}`) }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
.low-stock { color: var(--danger-color); font-weight: 600; }
</style>
