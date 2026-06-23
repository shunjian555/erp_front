<template>
  <div class="page-container">
    <div class="breadcrumb-bar">
      <el-breadcrumb separator=">">
        <el-breadcrumb-item v-for="(b, idx) in breadcrumb" :key="idx" @click="drillUp(idx)">{{ b.label }}</el-breadcrumb-item>
      </el-breadcrumb>
      <el-button v-if="drillData" :icon="Back" size="small" @click="drillUp(breadcrumb.length - 2)">返回上一级</el-button>
    </div>
    <div class="drill-summary">
      <div v-for="(d, i) in currentSummary" :key="i" class="summary-card" @click="drillDown(d)">
        <div class="summary-label">{{ d.label }}</div>
        <div class="summary-value">{{ d.value }}</div>
        <div class="summary-trend" :style="{ color: d.trend >= 0 ? '#67c23a' : '#f56c6c' }">
          {{ d.trend >= 0 ? '↑' : '↓' }} {{ Math.abs(d.trend) }}%
        </div>
      </div>
    </div>
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button :icon="Download" plain @click="handleExport">导出明细</el-button>
        <el-button :icon="DataLine" @click="handleCompare">对比分析</el-button>
      </div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 3)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 3" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown><el-dropdown-menu><el-dropdown-item v-for="action in getActions(row).slice(3)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item></el-dropdown-menu></template>
        </el-dropdown>
      </template>
    </BaseTable>
    <el-dialog v-model="detailVisible" title="订单详情" width="600px">
      <el-descriptions v-if="detailRow" :column="2" border>
        <el-descriptions-item label="订单号">{{ detailRow.code }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ detailRow.customer }}</el-descriptions-item>
        <el-descriptions-item label="金额">¥{{ detailRow.amount }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ detailRow.quantity }}</el-descriptions-item>
        <el-descriptions-item label="日期">{{ detailRow.date }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detailRow.status }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, DataLine, Back, ArrowDown } from '@element-plus/icons-vue'
import BaseTable from '@/components/BaseTable.vue'
const breadcrumb = ref([{ label: '全部订单', level: 0 }])
const drillData = ref(null)
const columns = [
  { prop: 'code', label: '订单号', width: 160 },
  { prop: 'customer', label: '客户', width: 140 },
  { prop: 'amount', label: '金额', width: 120, align: 'right' },
  { prop: 'quantity', label: '数量', width: 80, align: 'center' },
  { prop: 'date', label: '日期', width: 110 },
  { prop: 'status', label: '状态', width: 100 }
]
const loading = ref(false), tableData = ref([]), total = ref(0)
const queryParams = reactive({ pageNum: 1, pageSize: 10 })
const detailVisible = ref(false), detailRow = ref(null)
const currentSummary = ref([
  { label: '订单总数', value: 1256, trend: 12, key: 'orders' },
  { label: '销售总额', value: '¥3.85M', trend: 8, key: 'amount' },
  { label: '客户数', value: 286, trend: 5, key: 'customers' },
  { label: '毛利率', value: '32.5%', trend: -2, key: 'profit' }
])
const summaryByLevel = {
  0: [
    { label: '订单总数', value: 1256, trend: 12, key: 'orders' },
    { label: '销售总额', value: '¥3.85M', trend: 8, key: 'amount' },
    { label: '客户数', value: 286, trend: 5, key: 'customers' },
    { label: '毛利率', value: '32.5%', trend: -2, key: 'profit' }
  ],
  1: [
    { label: '华东区', value: 520, trend: 15, key: 'east' },
    { label: '华北区', value: 380, trend: 10, key: 'north' },
    { label: '华南区', value: 256, trend: 5, key: 'south' },
    { label: '西部区', value: 100, trend: -3, key: 'west' }
  ],
  2: [
    { label: 'A客户', value: 320, trend: 20, key: 'a' },
    { label: 'B客户', value: 280, trend: 12, key: 'b' },
    { label: 'C客户', value: 210, trend: 5, key: 'c' },
    { label: '其他', value: 446, trend: -2, key: 'others' }
  ]
}
async function loadData() {
  loading.value = true
  try {
    const level = breadcrumb.value.length - 1
    const all = Array.from({ length: 18 }, (_, i) => ({
      id: i + 1, code: `SO${String(i + 1).padStart(6, '0')}`, customer: `客户${String.fromCharCode(65 + (i % 10))}`,
      amount: (5000 + i * 350).toFixed(2), quantity: 10 + (i % 50),
      date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      status: ['已发货', '已付款', '待发货', '已完成'][i % 4]
    }))
    const start = (queryParams.pageNum - 1) * queryParams.pageSize
    tableData.value = all.slice(start, start + queryParams.pageSize); total.value = all.length
  } finally { loading.value = false }
}
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function drillDown(d) {
  const cur = breadcrumb.value.length
  if (cur >= 3) { ElMessage.info('已到最明细层级，查看订单明细'); return }
  breadcrumb.value.push({ label: d.label, level: cur })
  drillData.value = d
  currentSummary.value = summaryByLevel[cur] || []
  loadData()
}
function drillUp(idx) {
  if (idx < 0) return
  breadcrumb.value = breadcrumb.value.slice(0, idx + 1)
  const cur = breadcrumb.value.length - 1
  currentSummary.value = summaryByLevel[cur] || []
  if (breadcrumb.value.length === 1) drillData.value = null
  loadData()
}
function handleExport() { exportToExcel(detailData, columns, '数据钻取明细') }
function handleCompare() { ElMessage.success('已生成对比分析') }
function getActions(row) {
  return [
    { key: 'view', label: '查看', type: 'primary', handler: (r) => { detailRow.value = r; detailVisible.value = true } },
    { key: 'drill', label: '钻取', type: 'success', handler: drillDown },
    { key: 'export', label: '导出', type: 'warning', handler: (r) => ElMessage.success(`已导出订单 ${r.code}`) }
  ]
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
<style lang="scss" scoped>
.breadcrumb-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: 8px }
.drill-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 20px }
.summary-card { padding: 20px; background: #fff; border: 1px solid #ebeef5; border-radius: 8px; text-align: center; cursor: pointer; transition: all .2s; &:hover { box-shadow: 0 4px 12px rgba(64,158,255,.2); border-color: #409eff } }
.summary-label { font-size: 13px; color: #909399; margin-bottom: 8px }
.summary-value { font-size: 24px; font-weight: 700; color: #303133; margin-bottom: 4px }
.summary-trend { font-size: 12px; font-weight: 600 }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } }
</style>
