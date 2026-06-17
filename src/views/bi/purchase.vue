<template>
  <div class="page-container">
    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6" v-for="(item, index) in statCards" :key="index"><el-card shadow="hover"
          :body-style="{ padding: '20px' }">
          <div class="stat-item">
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-value" :style="{ color: item.color }">{{ item.value }}</div>
            <div class="stat-trend"><span :class="item.trend > 0 ? 'up' : 'down'">{{ item.trend > 0 ? '↑' : '↓' }} {{
              Math.abs(item.trend) }}%</span> 较上期</div>
          </div>
        </el-card></el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12"><el-card><template #header><span>采购金额趋势</span></template>
          <div ref="purchaseChartRef" style="height: 300px"></div>
        </el-card></el-col>
      <el-col :span="12"><el-card><template #header><span>供应商采购占比</span></template>
          <div ref="supplierChartRef" style="height: 300px"></div>
        </el-card></el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24"><el-card><template #header><span>采购品类分析</span></template>
          <div ref="categoryChartRef" style="height: 300px"></div>
        </el-card></el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const purchaseChartRef = ref(null), supplierChartRef = ref(null), categoryChartRef = ref(null)
let purchaseChart, supplierChart, categoryChart
const statCards = [
  { label: '采购总额', value: '¥892,345', color: '#409EFF', trend: -5.2 },
  { label: '订单数量', value: '1,286', color: '#67C23A', trend: 8.1 },
  { label: '供应商数', value: '156', color: '#E6A23C', trend: 12.3 },
  { label: '平均单价', value: '¥694', color: '#F56C6C', trend: -2.1 }
]

function initCharts() {
  purchaseChart = echarts.init(purchaseChartRef.value)
  purchaseChart.setOption({ tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] }, yAxis: { type: 'value' }, series: [{ type: 'bar', data: [130000, 145000, 125000, 160000, 178000, 154000], itemStyle: { borderRadius: [4, 4, 0, 0] } }] })
  supplierChart = echarts.init(supplierChartRef.value)
  supplierChart.setOption({ tooltip: { trigger: 'item' }, series: [{ type: 'pie', radius: '65%', data: [{ value: 335, name: '供应商A' }, { value: 310, name: '供应商B' }, { value: 234, name: '供应商C' }, { value: 135, name: '其他' }] }] })
  categoryChart = echarts.init(categoryChartRef.value)
  categoryChart.setOption({ tooltip: { trigger: 'axis' }, legend: {}, radar: { indicator: [{ name: '电子产品', max: 200 }, { name: '办公用品', max: 200 }, { name: '原材料', max: 200 }, { name: '包装材料', max: 200 }, { name: '设备配件', max: 200 }] }, series: [{ type: 'radar', data: [{ value: [180, 150, 120, 90, 110], name: '本期' }, { value: [160, 140, 100, 80, 95], name: '上期' }] }] })
}
function handleResize() { purchaseChart?.resize(); supplierChart?.resize(); categoryChart?.resize() }
onMounted(() => { initCharts(); window.addEventListener('resize', handleResize) })
onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); purchaseChart?.dispose(); supplierChart?.dispose(); categoryChart?.dispose() })
</script>

<style lang="scss" scoped>
.stat-cards .stat-item {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  margin: 10px 0;
}

.stat-trend {
  font-size: 13px;
  color: #909399;

  .up {
    color: #67C23A
  }

  .down {
    color: #F56C6C
  }
}
</style>
