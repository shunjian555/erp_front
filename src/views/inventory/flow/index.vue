<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button :icon="Download" plain @click="handleExport">导出</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #type="{ row }"><el-tag :type="row.type === 'in' ? 'success' : 'danger'" size="small">{{ row.type === 'in' ? '入库' : '出库' }}</el-tag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleView(row)">查看</el-button></template>
    </BaseTable>

    <!-- 详情 -->
    <el-dialog v-model="viewVisible" title="流水详情" width="640px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="流水号">{{ viewRow.flowNo }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag :type="viewRow.type === 'in' ? 'success' : 'danger'" size="small">{{ viewRow.type === 'in' ? '入库' : '出库' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ viewRow.goodsName }}</el-descriptions-item>
        <el-descriptions-item label="来源类型">{{ viewRow.sourceType }}</el-descriptions-item>
        <el-descriptions-item label="变动数量" :span="2">{{ viewRow.quantity }}</el-descriptions-item>
        <el-descriptions-item label="变动前库存">{{ viewRow.beforeStock }}</el-descriptions-item>
        <el-descriptions-item label="变动后库存">{{ viewRow.afterStock }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ viewRow.operator }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ viewRow.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import request from '@/utils/request'

const searchItems = [ { prop: 'goodsName', label: '商品名称', type: 'input' }, { prop: 'type', label: '类型', type: 'select', options: [{ value: '', label: '全部' }, { value: 'in', label: '入库' }, { value: 'out', label: '出库' }] }, { prop: 'dateRange', label: '日期范围', type: 'daterange' } ]
const columns = [ { prop: 'flowNo', label: '流水号', width: 180 }, { prop: 'goodsName', label: '商品', width: 130 }, { prop: 'type', label: '类型', width: 80, slot: 'type' }, { prop: 'quantity', label: '数量', width: 80, align: 'center' }, { prop: 'beforeStock', label: '变动前库存', width: 110, align: 'center' }, { prop: 'afterStock', label: '变动后库存', width: 110, align: 'center' }, { prop: 'sourceType', label: '来源', width: 100 }, { prop: 'operator', label: '操作人', width: 90 }, { prop: 'createTime', label: '操作时间', width: 170 } ]

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
function handleExport() { ElMessage.success('导出成功') /* TODO: Excel 导出 */ }

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
