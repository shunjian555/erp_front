<template>
  <div class="page-container">
    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6" v-for="(item, index) in statCards" :key="index"><el-card shadow="hover" :body-style="{ padding: '20px' }"><div class="stat-item"><div class="stat-label">{{ item.label }}</div><div class="stat-value" :style="{ color: item.color }">{{ item.value }}</div><div class="stat-trend"><span :class="item.trend > 0 ? 'up' : 'down'">{{ item.trend > 0 ? '↑' : '↓' }} {{ Math.abs(item.trend) }}%</span> 较上期</div></div></el-card></el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="14"><el-card><template #header><span>库存周转率</span></template><div ref="turnoverChartRef" style="height: 320px"></div></el-card></el-col>
      <el-col :span="10"><el-card><template #header><span>库存分布</span></template><div ref="stockChartRef" style="height: 320px"></div></el-card></el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24"><el-card><template #header><span>库存预警TOP10</span></template><BaseTable :columns="warningColumns" :table-data="warningData" :show-index="true" /></el-card></el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import BaseTable from '@/components/BaseTable.vue'

const turnoverChartRef = ref(null), stockChartRef = ref(null)
let turnoverChart, stockChart
const statCards = [
  { label: '总库存量', value: '58,432', color: '#409EFF', trend: 3.2 },
  { label: 'SKU总数', value: '2,156', color: '#67C23A', trend: 15.6 },
  { label: '周转天数', value: '32天', color: '#E6A23C', trend: -8.5 },
  { label: '预警商品', value: '48', color: '#F56C6C', trend: -22.1 }
]
const warningColumns = [ { prop: 'name', label: '商品名称', width: 150 }, { prop: 'currentStock', label: '当前库存', width: 100, align: 'center' }, { prop: 'safeStock', label: '安全库存', width: 100, align: 'center' }, { prop: 'gap', label: '缺口', width: 80, align: 'center' }, { prop: 'warehouse', label: '仓库', width: 100 } ]
const warningData = [
  { name: '商品A-001', currentStock: 12, safeStock: 50, gap: 38, warehouse: '主仓库' },
  { name: '商品B-002', currentStock: 5, safeStock: 30, gap: 25, warehouse: '分仓库A' },
  { name: '商品C-003', currentStock: 8, safeStock: 25, gap: 17, warehouse: '主仓库' },
  { name: '商品D-004', currentStock: 3, safeStock: 20, gap: 17, warehouse: '分仓库B' },
  { name: '商品E-005', currentStock: 10, safeStock: 25, gap: 15, warehouse: '主仓库' }
]

function initCharts() {
  turnoverChart = echarts.init(turnoverChartRef.value)
  turnoverChart.setOption({ tooltip: { trigger: 'axis' }, xAxis: { type: 'category', boundaryGap: false, data: ['1月','2月','3月','4月','5月','6月'] }, yAxis: { type: 'value', name: '周转率(%)' }, series: [{ type: 'line', data: [85,92,88,96,102,98], smooth: true, areaStyle: { opacity: 0.3 } }] })
  stockChart = echarts.init(stockChartRef.value)
  stockChart.setOption({ tooltip: { trigger: 'item' }, series: [{ type: 'pie', radius: ['35%', '60%'], roseType: 'area', data: [{ value: 2356, name: '主仓库' }, { value: 1580, name: '分仓库A' }, { value: 980, name: '分仓库B' }, { value: 520, name: '临时仓' }] }] })
}
function handleResize() { turnoverChart?.resize(); stockChart?.resize() }
onMounted(() => { initCharts(); window.addEventListener('resize', handleResize) })
onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); turnoverChart?.dispose(); stockChart?.dispose() })
</script>

<style lang="scss" scoped>
.stat-cards .stat-item { text-align: center; }
.stat-value { font-size: 28px; font-weight: 600; margin: 10px 0; }
.stat-trend { font-size: 13px; color: #909399; .up { color: #67C23A } .down { color: #F56C6C } }
</style>
