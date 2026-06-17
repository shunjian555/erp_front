<template>
  <div ref="chartRef" class="base-chart" :style="{ width, height }"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  option: {
    type: Object,
    required: true
  },
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '400px'
  },
  theme: {
    type: String,
    default: 'default'
  }
})

const chartRef = ref(null)
let chartInstance = null

// 初始化图表
function initChart() {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value, props.theme)
  chartInstance.setOption(props.option)
}

// 更新图表
function updateChart() {
  if (!chartInstance) return
  chartInstance.setOption(props.option, true)
}

// 响应式处理
function handleResize() {
  chartInstance?.resize()
}

// 监听option变化
watch(
  () => props.option,
  () => {
    nextTick(updateChart)
  },
  { deep: true }
)

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})

// 暴露实例
defineExpose({
  getInstance: () => chartInstance,
  resize: handleResize
})
</script>

<style lang="scss" scoped>
.base-chart {
  min-height: 300px;
}
</style>
