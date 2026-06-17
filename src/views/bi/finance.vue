<template>
  <div class="page-container">
    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6" v-for="(item, index) in statCards" :key="index"><el-card shadow="hover" :body-style="{ padding: '20px' }"><div class="stat-item"><div class="stat-label">{{ item.label }}</div><div class="stat-value" :style="{ color: item.color }">{{ item.value }}</div><div class="stat-trend"><span :class="item.trend > 0 ? 'up' : 'down'">{{ item.trend > 0 ? '↑' : '↓' }} {{ Math.abs(item.trend) }}%</span> 较上期</div></div></el-card></el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="14"><el-card><template #header><span>收支趋势</span></template><div ref="trendChartRef" style="height: 320px"></div></el-card></el-col>
      <el-col :span="10"><el-card><template #header><span>费用构成</span></template><div ref="costChartRef" style="height: 320px"></div></el-card></el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24"><el-card><template #header><span>应收应付分析</span></template><BaseTable :columns="financeColumns" :table-data="financeData" :show-index="true" /></el-card></el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import BaseTable from '@/components/BaseTable.vue'

const trendChartRef = ref(null), costChartRef = ref(null)
let trendChart, costChart
const statCards = [
  { label: '总收入', value: '¥2,345,678', color: '#67C23A', trend: 15.3 },
  { label: '总支出', value: '¥1,567,890', color: '#F56C6C', trend: 8.7 },
  { label: '净利润', value: '¥777,788', color: '#409EFF', trend: 22.1 },
  { label: '现金流', value: '¥456,789', color: '#E6A23C', trend: -5.4 }
]
const financeColumns = [ { prop: 'type', label: '类型', width: 120 }, { prop: 'amount', label: '金额', width: 150 }, { prop: 'accountName', label: '账户', width: 130 }, { prop: 'dueDate', label: '到期日', width: 120 }, { prop: 'status', label: '状态', width: 100 } ]
const financeData = [
  { type: '应收账款', amount: '¥234,567', accountName: '客户A', dueDate: '2024-07-01', status: '未到期' },
  { type: '应收账款', amount: '¥123,456', accountName: '客户B', dueDate: '2024-06-15', status: '已逾期' },
  { type: '应付账款', amount: '¥189,000', accountName: '供应商X', dueDate: '2024-06-20', status: '未到期' },
  { type: '应付账款', amount: '¥98,765', accountName: '供应商Y', dueDate: '2024-06-10', status: '已逾期' },
  { type: '预收款项', amount: '¥56,789', accountName: '客户C', dueDate: '-', status: '正常' }
]

function initCharts() {
  trendChart = echarts.init(trendChartRef.value)
  trendChart.setOption({ tooltip: { trigger: 'axis' }, legend: { data: ['收入','支出','利润'] }, xAxis: { type: 'category', data: ['1月','2月','3月','4月','5月','6月'] }, yAxis: { type: 'value' }, series: [{ name: '收入', type: 'bar', stack: 'total', data: [320,332,301,334,390,330] }, { name: '支出', type: 'bar', stack: 'total', data: [-220,-182,-191,-234,-290,-210] }, { name: '利润', type: 'line', data: [100,150,110,100,100,120] }] })
  costChart = echarts.init(costChartRef.value)
  costChart.setOption({ tooltip: { trigger: 'item' }, series: [{ type: 'pie', radius: '55%', data: [{ value: 450, name: '人工成本' }, { value: 320, name: '采购成本' }, { value: 280, name: '运营费用' }, { value: 180, name: '税费' }, { value: 120, name: '其他' }] }] })
}
function handleResize() { trendChart?.resize(); costChart?.resize() }
onMounted(() => { initCharts(); window.addEventListener('resize', handleResize) })
onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); trendChart?.dispose(); costChart?.dispose() })
</script>

<style lang="scss" scoped>
.stat-cards .stat-item { text-align: center; }
.stat-value { font-size: 28px; font-weight: 600; margin: 10px 0; }
.stat-trend { font-size: 13px; color: #909399; .up { color: #67C23A } .down { color: #F56C6C } }
</style>
