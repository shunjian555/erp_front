<template>
  <div class="page-container">
    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6" v-for="(item, index) in statCards" :key="index"><el-card shadow="hover" :body-style="{ padding: '20px' }"><div class="stat-item"><div class="stat-label">{{ item.label }}</div><div class="stat-value" :style="{ color: item.color }">{{ item.value }}</div><div class="stat-trend"><span :class="item.trend > 0 ? 'up' : 'down'">{{ item.trend > 0 ? '↑' : '↓' }} {{ Math.abs(item.trend) }}%</span> 较上期</div></div></el-card></el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="16"><el-card><template #header><span>销售趋势分析</span></template><div ref="trendChartRef" style="height: 350px"></div></el-card></el-col>
      <el-col :span="8"><el-card><template #header><span>产品销售占比</span></template><div ref="pieChartRef" style="height: 350px"></div></el-card></el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24"><el-card><template #header><span>区域销售排行</span></template><BaseTable :columns="rankColumns" :table-data="rankData" :show-index="true" /></el-card></el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import BaseTable from '@/components/BaseTable.vue'

const trendChartRef = ref(null), pieChartRef = ref(null)
let trendChart, pieChart
const statCards = [
  { label: '总销售额', value: '¥2,345,678', color: '#409EFF', trend: 15.3 },
  { label: '订单数', value: '5,678', color: '#67C23A', trend: 8.7 },
  { label: '客单价', value: '¥413', color: '#E6A23C', trend: -2.4 },
  { label: '退货率', value: '2.3%', color: '#F56C6C', trend: -12.1 }
]
const rankColumns = [ { prop: 'region', label: '区域', width: 120 }, { prop: 'salesAmount', label: '销售额', width: 140 }, { prop: 'orderCount', label: '订单数', width: 100, align: 'center' }, { prop: 'growth', label: '增长率', width: 100 }, { prop: 'topProduct', label: '热销品', minWidth: 150 } ]
const rankData = [
  { region: '华东区', salesAmount: '¥892,345', orderCount: 2156, growth: '+18.5%', topProduct: '电子产品A' },
  { region: '华南区', salesAmount: '¥654,123', orderCount: 1580, growth: '+12.3%', topProduct: '办公用品B' },
  { region: '华北区', salesAmount: '¥489,567', orderCount: 1186, growth: '+8.7%', topProduct: '服装C' },
  { region: '西南区', salesAmount: '¥309,643', orderCount: 756, growth: '-2.1%', topProduct: '食品D' }
]

function initCharts() {
  trendChart = echarts.init(trendChartRef.value)
  trendChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['销售额','订单量','客单价'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['1月','2月','3月','4月','5月','6月'] },
    yAxis: [ { type: 'value', name: '金额(万)' }, { type: 'value', name: '订单量' } ],
    series: [
      { name: '销售额', type: 'bar', data: [180,195,210,235,268,290], itemStyle: { borderRadius: [4,4,0,0] } },
      { name: '订单量', type: 'line', yAxisIndex: 1, data: [800,850,920,1050,1180,1250], smooth: true },
      { name: '客单价', type: 'line', data: [225,229,228,224,227,232], smooth: true }
    ]
  })
  pieChart = echarts.init(pieChartRef.value)
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie', radius: ['40%', '70%'], center: ['60%','50%'],
      data: [
        { value: 1048, name: '电子产品', itemStyle: { color: '#409EFF' } },
        { value: 735, name: '办公用品', itemStyle: { color: '#67C23A' } },
        { value: 580, name: '服装鞋帽', itemStyle: { color: '#E6A23C' } },
        { value: 484, name: '食品饮料', itemStyle: { color: '#F56C6C' } },
        { value: 300, name: '其他', itemStyle: { color: '#909399' } }
      ],
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,.5)' } }
    }]
  })
}
function handleResize() { trendChart?.resize(); pieChart?.resize() }
onMounted(() => { initCharts(); window.addEventListener('resize', handleResize) })
onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); trendChart?.dispose(); pieChart?.dispose() })
</script>

<style lang="scss" scoped>
.stat-cards .stat-item { text-align: center; }
.stat-value { font-size: 28px; font-weight: 600; margin: 10px 0; }
.stat-trend { font-size: 13px; color: #909399; .up { color: #67C23A } .down { color: #F56C6C } }
</style>
