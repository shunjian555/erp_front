<template>
  <div class="page-container">
    <div class="filter-bar">
      <el-form :model="filterForm" inline>
        <el-form-item label="维度">
          <el-select v-model="filterForm.dimension" style="width: 140px">
            <el-option label="按月" value="month" /><el-option label="按季" value="quarter" /><el-option label="按年" value="year" />
          </el-select>
        </el-form-item>
        <el-form-item label="对比模式">
          <el-radio-group v-model="filterForm.mode">
            <el-radio value="yoy">同比</el-radio><el-radio value="mom">环比</el-radio><el-radio value="cum">累计</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="指标">
          <el-select v-model="filterForm.metric" style="width: 160px">
            <el-option label="销售额" value="amount" /><el-option label="订单数" value="orders" /><el-option label="利润" value="profit" />
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" @click="handleAnalyze">分析</el-button></el-form-item>
      </el-form>
    </div>
    <div class="kpi-row">
      <div class="kpi-card"><div class="kpi-label">本期</div><div class="kpi-value">¥{{ kpi.current.toLocaleString() }}</div></div>
      <div class="kpi-card"><div class="kpi-label">上期</div><div class="kpi-value">¥{{ kpi.previous.toLocaleString() }}</div></div>
      <div class="kpi-card"><div class="kpi-label">同比/环比</div><div class="kpi-value" :style="{ color: kpi.growth >= 0 ? '#67c23a' : '#f56c6c' }">{{ kpi.growth > 0 ? '+' : '' }}{{ kpi.growth }}%</div></div>
      <div class="kpi-card"><div class="kpi-label">年累计</div><div class="kpi-value">¥{{ kpi.ytd.toLocaleString() }}</div></div>
    </div>
    <div class="chart-box">
      <BaseChart :option="chartOption" height="360px" />
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :show-index="true">
      <template #growth="{ row }">
        <span :style="{ color: row.growth >= 0 ? '#67c23a' : '#f56c6c' }">{{ row.growth > 0 ? '+' : '' }}{{ row.growth }}%</span>
      </template>
    </BaseTable>
  </div>
</template>
<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { exportToExcel } from '@/utils/excel'
import { browserPrint } from '@/utils/print'
import BaseTable from '@/components/BaseTable.vue'
import BaseChart from '@/components/BaseChart.vue'
import { Download, Printer } from '@element-plus/icons-vue'
const filterForm = reactive({ dimension: 'month', mode: 'yoy', metric: 'amount' })
const kpi = reactive({ current: 3850000, previous: 3480000, ytd: 22350000 })
kpi.growth = Math.round(((kpi.current - kpi.previous) / kpi.previous) * 100)
const columns = [
  { prop: 'period', label: '期间', width: 110 },
  { prop: 'current', label: '本期', width: 140, align: 'right' },
  { prop: 'previous', label: '上期', width: 140, align: 'right' },
  { prop: 'growth', label: '增长率', width: 100, align: 'center', slot: 'growth' },
  { prop: 'cumulative', label: '累计', width: 140, align: 'right' }
]
const tableData = ref([
  { period: '2024-01', current: 2850000, previous: 2480000, growth: 15, cumulative: 2850000 },
  { period: '2024-02', current: 3120000, previous: 2680000, growth: 16, cumulative: 5970000 },
  { period: '2024-03', current: 3580000, previous: 3050000, growth: 17, cumulative: 9550000 },
  { period: '2024-04', current: 3200000, previous: 2980000, growth: 7, cumulative: 12750000 },
  { period: '2024-05', current: 3680000, previous: 3250000, growth: 13, cumulative: 16430000 },
  { period: '2024-06', current: 3850000, previous: 3480000, growth: 11, cumulative: 20280000 },
  { period: '2024-07', current: 4250000, previous: 3680000, growth: 15, cumulative: 24530000 }
])
const chartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['本期', '上期', '增长率'] },
  xAxis: { type: 'category', data: tableData.value.map(t => t.period) },
  yAxis: [
    { type: 'value', name: '金额', position: 'left' },
    { type: 'value', name: '增长率(%)', position: 'right' }
  ],
  series: [
    { name: '本期', type: 'bar', data: tableData.value.map(t => t.current), itemStyle: { color: '#409eff' } },
    { name: '上期', type: 'bar', data: tableData.value.map(t => t.previous), itemStyle: { color: '#e6a23c' } },
    { name: '增长率', type: 'line', yAxisIndex: 1, data: tableData.value.map(t => t.growth), itemStyle: { color: '#f56c6c' }, smooth: true }
  ]
}))
function handleAnalyze() { ElMessage.success('已重新分析') }
function handleExport() { exportToExcel(tableData.value, columns, '对比分析') }
function handlePrint() { browserPrint({ title: '对比分析' }) }
onMounted(() => {})
</script>
<style lang="scss" scoped>
.filter-bar { background: #fff; padding: 16px 20px; border-radius: 8px; margin-bottom: 16px }
.kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 20px }
.kpi-card { padding: 20px; background: linear-gradient(135deg, #fff, #f5f7fa); border: 1px solid #ebeef5; border-radius: 8px; text-align: center }
.kpi-label { font-size: 13px; color: #909399; margin-bottom: 8px }
.kpi-value { font-size: 24px; font-weight: 700; color: #303133 }
.chart-box { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px }
</style>
