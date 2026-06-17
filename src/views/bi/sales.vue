<template>
  <div class="page-container">
    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6" v-for="(item, index) in statCards" :key="index"><el-card shadow="hover" :body-style="{ padding: '20px' }"><div class="stat-item"><div class="stat-label">{{ item.label }}</div><div class="stat-value" :style="{ color: item.color }">{{ item.value }}</div><div class="stat-trend"><span :class="item.trend > 0 ? 'up' : 'down'">{{ item.trend > 0 ? '↑' : '↓' }} {{ Math.abs(item.trend) }}%</span> 较上月</div></div></el-card></el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="16"><el-card><template #header><span>销售趋势</span></template><div ref="salesChartRef" style="height: 350px"></div></el-card></el-col>
      <el-col :span="8"><el-card><template #header><span>销售占比</span></template><div ref="pieChartRef" style="height: 350px"></div></el-card></el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24"><el-card><template #header><span>利润分析</span></template><div ref="profitChartRef" style="height: 300px"></div></el-card></el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const salesChartRef = ref(null), pieChartRef = ref(null), profitChartRef = ref(null)
let salesChart, pieChart, profitChart
const statCards = [
  { label: '总销售额', value: '¥1,234,567', color: '#409EFF', trend: 12.5 },
  { label: '总成本', value: '¥789,123', color: '#E6A23C', trend: -3.2 },
  { label: '净利润', value: '¥445,444', color: '#67C23A', trend: 18.7 },
  { label: '订单数', value: '2,356', color: '#F56C6C', trend: 5.3 }
]

function initCharts() {
  salesChart = echarts.init(salesChartRef.value)
  salesChart.setOption({ tooltip: { trigger: 'axis' }, legend: { data: ['销售额', '成本'] }, grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true }, xAxis: { type: 'category', data: ['1月','2月','3月','4月','5月','6月'] }, yAxis: { type: 'value' }, series: [{ name: '销售额', type: 'line', data: [120000,132000,101000,134000,190000,230000], smooth: true, areaStyle: {} }, { name: '成本', type: 'line', data: [80000,85000,70000,90000,120000,140000], smooth: true }] })
  pieChart = echarts.init(pieChartRef.value)
  pieChart.setOption({ tooltip: { trigger: 'item' }, legend: { bottom: 0 }, series: [{ type: 'pie', radius: ['40%', '70%'], data: [{ value: 1048, name: '电子产品' }, { value: 735, name: '办公用品' }, { value: 580, name: '服装' }, { value: 484, name: '食品' }] }] })
  profitChart = echarts.init(profitChartRef.value)
  profitChart.setOption({ tooltip: { trigger: 'axis' }, legend: { data: ['收入', '支出', '利润'] }, xAxis: { type: 'category', data: ['Q1','Q2','Q3','Q4'] }, yAxis: { type: 'value' }, series: [{ name: '收入', type: 'bar', data: [300000,380000,420000,500000] }, { name: '支出', type: 'bar', data: [200000,250000,280000,320000] }, { name: '利润', type: 'line', data: [100000,130000,140000,180000] }] })
}
function handleResize() { salesChart?.resize(); pieChart?.resize(); profitChart?.resize() }
onMounted(() => { initCharts(); window.addEventListener('resize', handleResize) })
onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); salesChart?.dispose(); pieChart?.dispose(); profitChart?.dispose() })
</script>

<style lang="scss" scoped>
.stat-cards .stat-item { text-align: center; }
.stat-value { font-size: 28px; font-weight: 600; margin: 10px 0; }
.stat-trend { font-size: 13px; color: #909399; .up { color: #67C23A } .down { color: #F56C6C } }
</style>
