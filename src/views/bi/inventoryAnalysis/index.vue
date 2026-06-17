<template>
  <div class="page-container">
    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6" v-for="(item, index) in statCards" :key="index"><el-card shadow="hover" :body-style="{ padding: '20px' }"><div class="stat-item"><div class="stat-label">{{ item.label }}</div><div class="stat-value" :style="{ color: item.color }">{{ item.value }}</div><div class="stat-trend"><span :class="item.trend > 0 ? 'up' : 'down'">{{ item.trend > 0 ? '↑' : '↓' }} {{ Math.abs(item.trend) }}%</span> 较上期</div></div></el-card></el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="14"><el-card><template #header><span>库存周转趋势</span></template><div ref="turnoverChartRef" style="height: 320px"></div></el-card></el-col>
      <el-col :span="10"><el-card><template #header><span>仓库库存分布</span></template><div ref="warehouseChartRef" style="height: 320px"></div></el-card></el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24"><el-card><template #header><span>滞销/畅销TOP10</span></template><BaseTable :columns="analysisColumns" :table-data="analysisData" :show-index="true" /></el-card></el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import BaseTable from '@/components/BaseTable.vue'

const turnoverChartRef = ref(null), warehouseChartRef = ref(null)
let turnoverChart, warehouseChart
const statCards = [
  { label: '总库存量', value: '62,450', color: '#409EFF', trend: 3.2 },
  { label: 'SKU总数', value: '2,356', color: '#67C23A', trend: 15.6 },
  { label: '周转天数', value: '28天', color: '#E6A23C', trend: -8.5 },
  { label: '预警SKU', value: '52', color: '#F56C6C', trend: -22.1 }
]
const analysisColumns = [ { prop: 'name', label: '商品名称', width: 160 }, { prop: 'stock', label: '当前库存', width: 100, align: 'center' }, { prop: 'turnoverRate', label: '周转率', width: 100 }, { prop: 'daysInStock', label: '在库天数', width: 100, align: 'center' }, { prop: 'warehouse', label: '所在仓库', width: 110 }, { prop: 'status', label: '状态', width: 90 } ]
const analysisData = [
  { name: '电子产品A-001', stock: 256, turnoverRate: '12.5x', daysInStock: 29, warehouse: '主仓库', status: '畅销' },
  { name: '办公用品B-002', stock: 189, turnoverRate: '8.3x', daysInStock: 44, warehouse: '分仓库A', status: '正常' },
  { name: '服装C-003', stock: 12, turnoverRate: '0.8x', daysInStock: 365, warehouse: '主仓库', status: '滞销' },
  { name: '食品D-004', stock: 8, turnoverRate: '0.5x', daysInStock: 480, warehouse: '分仓库B', status: '滞销预警' },
  { name: '配件E-005', stock: 320, turnoverRate: '15.2x', daysInStock: 24, warehouse: '主仓库', status: '热销' }
]

function initCharts() {
  turnoverChart = echarts.init(turnoverChartRef.value)
  turnoverChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['周转率(%)','目标线'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['1月','2月','3月','4月','5月','6月'] },
    yAxis: { type: 'value', name: '周转率(%)' },
    series: [
      { name: '周转率', type: 'line', data: [82,88,85,92,98,96], smooth: true, markLine: { data: [{ yAxis: 90, name: '目标线' }] } }
    ]
  })
  warehouseChart = echarts.init(warehouseChartRef.value)
  warehouseChart.setOption({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie', radius: '55%',
      data: [
        { value: 2856, name: '主仓库', itemStyle: { color: '#409EFF' } },
        { value: 1780, name: '分仓库A', itemStyle: { color: '#67C23A' } },
        { value: 1120, name: '分仓库B', itemStyle: { color: '#E6A23C' } },
        { value: 694, name: '临时仓', itemStyle: { color: '#F56C6C' } }
      ]
    }]
  })
}
function handleResize() { turnoverChart?.resize(); warehouseChart?.resize() }
onMounted(() => { initCharts(); window.addEventListener('resize', handleResize) })
onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); turnoverChart?.dispose(); warehouseChart?.dispose() })
</script>

<style lang="scss" scoped>
.stat-cards .stat-item { text-align: center; }
.stat-value { font-size: 28px; font-weight: 600; margin: 10px 0; }
.stat-trend { font-size: 13px; color: #909399; .up { color: #67C23A } .down { color: #F56C6C } }
</style>
