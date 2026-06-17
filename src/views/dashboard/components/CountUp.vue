<template>
  <span class="count-up">{{ displayValue }}</span>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  endVal: {
    type: Number,
    default: 0
  },
  startVal: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 1500
  },
  format: {
    type: String,
    default: 'number' // 'money' | 'number'
  },
  decimals: {
    type: Number,
    default: 2
  }
})

const displayValue = ref(formatValue(props.startVal))

function formatValue(val) {
  if (props.format === 'money') {
    return '¥' + val.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }
  return val.toLocaleString()
}

// 数字动画
function animateNumber(start, end, duration) {
  const startTime = Date.now()
  const diff = end - start

  function step() {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    // easeOutExpo 缓动
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
    const current = start + diff * eased
    displayValue.value = formatValue(Math.round(current))

    if (progress < 1) {
      requestAnimationFrame(step)
    }
  }

  requestAnimationFrame(step)
}

watch(
  () => props.endVal,
  (newVal) => {
    animateNumber(0, newVal, props.duration)
  },
  { immediate: true }
)

onMounted(() => {
  if (props.endVal !== props.startVal) {
    animateNumber(props.startVal, props.endVal, props.duration)
  }
})
</script>

<style lang="scss" scoped>
.count-up {
  font-variant-numeric: tabular-nums;
}
</style>
