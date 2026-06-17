<template>
  <div class="page-container">
    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6" v-for="(item, index) in statCards" :key="index"><el-card shadow="hover" :body-style="{ padding: '20px' }"><div class="stat-item"><div class="stat-label">{{ item.label }}</div><div class="stat-value" :style="{ color: item.color }">{{ item.value }}</div><div class="stat-trend"><span :class="item.trend > 0 ? 'up' : 'down'">{{ item.trend > 0 ? '↑' : '↓' }} {{ Math.abs(item.trend) }}%</span> 较上期</div></div></el-card></el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="14"><el-card><template #header><span>采购金额趋势</span></template><div ref="trendChartRef" style="height: 320px"></div></el-card></el-col>
      <el-col :span="10"><el-card><template #header><span>供应商采购占比</span></template><div ref="supplierChartRef" style="height: 320px"></div></el-card></el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24"><el-card><template #header><span>品类采购明细</span></template><BaseTable :columns="categoryColumns" :table-data="categoryData" :show-index="true" /></el-card></el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import BaseTable from '@/components/BaseTable.vue'

const trendChartRef = ref(null), supplierChartRef = ref(null)
let trendChart, supplierChart
const statCards = [
  { label: '采购总额', value: '¥982,345', color: '#409EFF', trend: -5.2 },
  { label: '采购单数', value: '1,386', color: '#67C23A', trend: 8.1 },
  { label: '供应商数', value: '168', color: '#E6A23C', trend: 12.3 },
  { label: '平均单价', value: '¥709', color: '#F56C6C', trend: -2.1 }
]
const categoryColumns = [ { prop: 'category', label: '品类', width: 130 }, { prop: 'amount', label: '采购金额', width: 140 }, { prop: 'count', label: '采购次数', width: 110, align: 'center' }, { prop: 'avgPrice', label: '均价', width: 110 }, { prop: 'growth', label: '环比', width: 100 }, { prop: 'mainSupplier', label: '主要供应商', minWidth: 140 } ]
const categoryData = [
  { category: '电子元器件', amount: '¥356,789', count: 245, avgPrice: '¥1,456', growth: '+5.2%', mainSupplier: '供应商A' },
  { category: '办公用品', amount: '¥198,456', count: 380, avgPrice: '¥522', growth: '-2.3%', mainSupplier: '供应商B' },
  { category: '包装材料', amount: '¥156,234', count: 520, avgPrice: '¥300', growth: '+8.1%', mainSupplier: '供应商C' },
  { category: '原材料', amount: '¥270,866', count: 241, avgPrice: '¥1,124', growth: '-1.5%', mainSupplier: '供应商D' }
]

function initCharts() {
  trendChart = echarts.init(trendChartRef.value)
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['采购额','成本节约'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: ['1月','2月','3月','4月','5月','6月'] },
    yAxis: { type: 'value', name: '金额(元)' },
    series: [
      { name: '采购额', type: 'line', data: [145000,158000,132000,168000,185000,194000], smooth: true, areaStyle: { opacity: 0.25 } },
      { name: '成本节约', type: 'line', data: [12000,15800,9200,16800,22000,18400], smooth: true, areaStyle: { opacity: 0.15 } }
    ]
  })
  supplierChart = echarts.init(supplierChartRef.value)
  supplierChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    series: [{
      type: 'pie', radius: ['30%', '65%'], roseType: 'area',
      data: [
        { value: 385, name: '战略供应商', itemStyle: { color: '#F56C6C' } },
        { value: 310, name: '核心供应商', itemStyle: { color: '#E6A23C' } },
        { value: 234, name: '普通供应商', itemStyle: { color: '#409EFF' } },
        { value: 135, name: '临时供应商', itemStyle: { color: '#909399' } }
      ]
    }]
  })
}
function handleResize() { trendChart?.resize(); supplierChart?.resize() }
onMounted(() => { initCharts(); window.addEventListener('resize', handleResize) })
onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); trendChart?.dispose(); supplierChart?.dispose() })
</script>

<style lang="scss" scoped>
.stat-cards .stat-item { text-align: center; }
.stat-value { font-size: 28px; font-weight: 600; margin: 10px 0; }
.stat-trend { font-size: 13px; color: #909399; .up { color: #67C23A } .down { color: #F56C6C } }
</style>
