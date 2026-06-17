<template>
  <div class="page-container">
    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6" v-for="(item, index) in statCards" :key="index"><el-card shadow="hover" :body-style="{ padding: '20px' }"><div class="stat-item"><div class="stat-label">{{ item.label }}</div><div class="stat-value" :style="{ color: item.color }">{{ item.value }}</div><div class="stat-trend"><span :class="item.trend > 0 ? 'up' : 'down'">{{ item.trend > 0 ? '↑' : '↓' }} {{ Math.abs(item.trend) }}%</span> 较上期</div></div></el-card></el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="14"><el-card><template #header><span>收支利润趋势</span></template><div ref="profitTrendRef" style="height: 320px"></div></el-card></el-col>
      <el-col :span="10"><el-card><template #header><span>成本构成分析</span></template><div ref="costPieRef" style="height: 320px"></div></el-card></el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24"><el-card><template #header><span>部门费用对比</span></template><div ref="deptCostRef" style="height: 280px"></div></el-card></el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const profitTrendRef = ref(null), costPieRef = ref(null), deptCostRef = ref(null)
let profitTrendChart, costPieChart, deptCostChart
const statCards = [
  { label: '总收入', value: '¥2,888,999', color: '#67C23A', trend: 18.5 },
  { label: '总支出', value: '¥1,923,456', color: '#F56C6C', trend: 6.2 },
  { label: '净利润', value: '¥965,543', color: '#409EFF', trend: 28.3 },
  { label: '净利率', value: '33.4%', color: '#E6A23C', trend: 8.1 }
]

function initCharts() {
  profitTrendChart = echarts.init(profitTrendRef.value)
  profitTrendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入','支出','净利润'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['Q1','Q2','Q3','Q4'] },
    yAxis: { type: 'value', name: '金额(万元)' },
    series: [
      { name: '收入', type: 'bar', stack: 'total', data: [580,680,750,820] },
      { name: '支出', type: 'bar', stack: 'total', data: [-380,-420,-480,-520] },
      { name: '净利润', type: 'line', data: [200,260,270,300] }
    ]
  })
  costPieChart = echarts.init(costPieRef.value)
  costPieChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['35%', '60%'], avoidLabelOverlap: true,
      data: [
        { value: 420, name: '人工成本', itemStyle: { color: '#409EFF' } },
        { value: 350, name: '采购成本', itemStyle: { color: '#67C23A' } },
        { value: 280, name: '运营费用', itemStyle: { color: '#E6A23C' } },
        { value: 180, name: '税费', itemStyle: { color: '#F56C6C' } },
        { value: 120, name: '其他', itemStyle: { color: '#909399' } }
      ]
    }]
  })
  deptCostChart = echarts.init(deptCostRef.value)
  deptCostChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['预算','实际'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['技术部','销售部','市场部','财务部','行政部'] },
    yAxis: { type: 'value', name: '金额(万元)' },
    series: [
      { name: '预算', type: 'bar', data: [80,50,40,30,20] },
      { name: '实际', type: 'bar', data: [85,58,35,28,22] }
    ]
  })
}
function handleResize() { profitTrendChart?.resize(); costPieChart?.resize(); deptCostChart?.resize() }
onMounted(() => { initCharts(); window.addEventListener('resize', handleResize) })
onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); profitTrendChart?.dispose(); costPieChart?.dispose(); deptCostChart?.dispose() })
</script>

<style lang="scss" scoped>
.stat-cards .stat-item { text-align: center; }
.stat-value { font-size: 28px; font-weight: 600; margin: 10px 0; }
.stat-trend { font-size: 13px; color: #909399; .up { color: #67C23A } .down { color: #F56C6C } }
</style>
