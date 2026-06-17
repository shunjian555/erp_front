<template>
  <div class="dashboard-container">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-cards">
      <el-col :xs="24" :sm="12" :md="6" v-for="(item, index) in statCards" :key="item.title">
        <BaseCard hoverable>
          <div class="stat-card">
            <div class="stat-info">
              <p class="stat-label">{{ item.title }}</p>
              <p class="stat-value"><CountUp :end-val="item.value" :format="item.format" /></p>
              <p class="stat-trend" :class="item.trend > 0 ? 'up' : 'down'">
                <el-icon><ArrowUp v-if="item.trend > 0" /><ArrowDown v-else /></el-icon>
                {{ Math.abs(item.trend) }}% 较上月
              </p>
            </div>
            <div class="stat-icon" :style="{ backgroundColor: item.bgColor }">
              <el-icon :size="28" :color="item.iconColor">
                <component :is="item.icon" />
              </el-icon>
            </div>
          </div>
        </BaseCard>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="16">
        <BaseCard title="销售趋势" shadow="hover">
          <template #header>
            <div class="chart-header-extra">
              <el-radio-group v-model="trendRange" size="small" @change="loadSalesTrend">
                <el-radio-button label="7">近7天</el-radio-button>
                <el-radio-button label="30">近30天</el-radio-button>
                <el-radio-button label="90">近90天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <BaseChart ref="salesTrendChartRef" :option="salesTrendOption" height="360px" />
        </BaseCard>
      </el-col>
      <el-col :xs="24" :lg="8">
        <BaseCard title="销售排行 Top10" shadow="hover">
          <BaseChart :option="rankingOption" height="360px" />
        </BaseCard>
      </el-col>
    </el-row>

    <!-- 底部区域 -->
    <el-row :gutter="16" class="bottom-row">
      <el-col :xs="24" :lg="12">
        <BaseCard title="库存预警" shadow="hover">
          <template #header>
            <el-tag type="danger" size="small" effect="dark">{{ warningList.length }} 条预警</el-tag>
          </template>
          <el-table :data="warningList" size="small" stripe max-height="300" empty-text="暂无库存预警">
            <el-table-column prop="goodsName" label="商品名称" min-width="120" show-overflow-tooltip />
            <el-table-column prop="currentStock" label="当前库存" width="90" align="center">
              <template #default="{ row }">
                <span :style="{ color: row.currentStock === 0 ? '#f56c6c' : '#e6a23c' }">{{ row.currentStock }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="safeStock" label="安全库存" width="90" align="center" />
            <el-table-column prop="unit" label="单位" width="60" align="center" />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.currentStock === 0 ? 'danger' : 'warning'" size="small" effect="dark">
                  {{ row.currentStock === 0 ? '缺货' : '预警' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </BaseCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <BaseCard title="待办事项" shadow="hover">
          <div class="todo-list">
            <div
              v-for="todo in todoList"
              :key="todo.type"
              class="todo-item"
              @click="handleTodo(todo)"
            >
              <div class="todo-icon" :style="{ backgroundColor: todo.color + '20' }">
                <el-icon :size="22" :style="{ color: todo.color }">
                  <component :is="todo.icon" />
                </el-icon>
              </div>
              <div class="todo-info">
                <span class="todo-title">{{ todo.title }}</span>
                <span class="todo-count">{{ todo.count }} 条待处理</span>
              </div>
              <el-badge :value="todo.count" :max="99" :type="todo.count > 10 ? 'danger' : 'primary'" class="todo-badge" />
              <el-icon class="todo-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </BaseCard>
      </el-col>
    </el-row>

    <!-- 快捷操作 -->
    <el-row :gutter="16" class="quick-action-row">
      <el-col :span="24">
        <BaseCard title="快捷操作" shadow="hover">
          <div class="quick-actions">
            <div
              v-for="action in quickActions"
              :key="action.title"
              class="action-item"
              @click="handleQuickAction(action)"
            >
              <div class="action-icon" :style="{ backgroundColor: action.bgColor }">
                <el-icon :size="24" :color="action.color">
                  <component :is="action.icon" />
                </el-icon>
              </div>
              <span class="action-title">{{ action.title }}</span>
            </div>
          </div>
        </BaseCard>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowUp, ArrowDown, ArrowRight } from '@element-plus/icons-vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseChart from '@/components/BaseChart.vue'
import CountUp from './components/CountUp.vue'
import {
  getDashboardStats,
  getSalesTrend,
  getSalesRanking,
  getInventoryWarning,
  getTodoList
} from '@/api/dashboard'

const router = useRouter()

// ==================== 统计卡片数据 ====================
const statCards = reactive([
  { title: '销售额', value: 0, icon: 'TrendCharts', format: 'money', trend: 12.5, bgColor: '#ecf5ff', iconColor: '#409eff' },
  { title: '订单数', value: 0, icon: 'Document', format: 'number', trend: 8.3, bgColor: '#f0f9eb', iconColor: '#67c23a' },
  { title: '采购额', value: 0, icon: 'ShoppingCart', format: 'money', trend: -3.2, bgColor: '#fdf6ec', iconColor: '#e6a23c' },
  { title: '利润', value: 0, icon: 'Money', format: 'money', trend: 15.8, bgColor: '#fef0f0', iconColor: '#f56c6c' }
])

// 销售趋势时间范围
const trendRange = ref('7')
const salesTrendChartRef = ref(null)

// ==================== 销售趋势图 ====================
const salesTrendData = ref({ dates: [], values: [] })

const salesTrendOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' },
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: '#eee',
    textStyle: { color: '#333' },
    formatter(params) {
      const p = params[0]
      return `<div style="font-weight:600;margin-bottom:4px">${p.axisValue}</div>
        <div style="display:flex;align-items:center;gap:4px">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${'#409eff'}"></span>
          <span>销售额: ¥${(p.value / 10000).toFixed(2)}万</span>
        </div>`
    }
  },
  legend: {
    data: ['销售额'],
    top: 0,
    right: 0,
    textStyle: { fontSize: 12, color: '#999' }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: 36,
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: salesTrendData.value.dates,
    boundaryGap: false,
    axisLine: { lineStyle: { color: '#e0e0e0' } },
    axisLabel: { color: '#666', fontSize: 11 },
    axisTick: { show: false }
  },
  yAxis: {
    type: 'value',
    name: '销售额(万元)',
    nameTextStyle: { color: '#999', fontSize: 11 },
    axisLine: { show: false },
    splitLine: { lineStyle: { color: '#f0f0f0' } },
    axisLabel: { color: '#999', fontSize: 11, formatter: (v) => (v / 10000).toFixed(0) + 'w' }
  },
  series: [{
    name: '销售额',
    data: salesTrendData.value.values,
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: { width: 3, color: '#409eff' },
    areaStyle: {
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(64,158,255,0.3)' },
          { offset: 1, color: 'rgba(64,158,255,0.02)' }
        ]
      }
    },
    itemStyle: { color: '#409eff', borderWidth: 2, borderColor: '#fff' }
  }]
}))

// ==================== 销售排行图 ====================
const rankingData = ref([])

const rankingOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter(params) {
      const p = params[0]
      return `${p.name}<br/>销售额: ¥${(p.value / 10000).toFixed(2)}万`
    }
  },
  grid: {
    left: '3%',
    right: '12%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: '#f0f0f0' } },
    axisLabel: { color: '#999', fontSize: 11, formatter: (v) => (v / 10000).toFixed(0) + 'w' }
  },
  yAxis: {
    type: 'category',
    data: rankingData.value.map((item) => item.name).reverse(),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#666', fontSize: 11 }
  },
  series: [{
    type: 'bar',
    data: rankingData.value.map((item) => item.sales).reverse(),
    barWidth: 18,
    itemStyle: {
      borderRadius: [0, 4, 4, 0],
      color: (params) => {
        const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399']
        const idx = params.dataIndex % colors.length
        return {
          type: 'linear',
          x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [{ offset: 0, color: colors[idx] }, { offset: 1, color: colors[idx] + 'aa' }]
        }
      }
    }
  }]
}))

// ==================== 库存预警 ====================
const warningList = ref([])

// ==================== 待办事项 ====================
const todoList = ref([])

// ==================== 快捷操作 ====================
const quickActions = [
  { title: '新建订单', icon: 'DocumentAdd', path: '/sales/order', bgColor: '#ecf5ff', color: '#409eff' },
  { title: '采购申请', icon: 'EditPen', path: '/purchase/request', bgColor: '#f0f9eb', color: '#67c23a' },
  { title: '客户管理', icon: 'User', path: '/crm/customer', bgColor: '#fdf6ec', color: '#e6a23c' },
  { title: '商品管理', icon: 'Goods', path: '/product/goods', bgColor: '#fef0f0', color: '#f56c6c' },
  { title: '审批中心', icon: 'Finished', path: '/oa/approval', bgColor: '#f4f4f5', color: '#909399' },
  { title: '库存查询', icon: 'Box', path: '/inventory/query', bgColor: '#f9f0ff', color: '#b37feb' }
]

function handleTodo(todo) {
  router.push(todo.path || '/')
}

function handleQuickAction(action) {
  router.push(action.path)
}

// 加载数据
async function loadDashboardData() {
  try {
    // 并行加载所有数据
    const [statsRes, trendRes, rankRes, warnRes, todoRes] = await Promise.allSettled([
      getDashboardStats(),
      getSalesTrend(trendRange.value),
      getSalesRanking(),
      getInventoryWarning(),
      getTodoList()
    ])

    // 统计数据
    if (statsRes.status === 'fulfilled') {
      const stats = statsRes.value.data
      statCards[0].value = stats.salesAmount
      statCards[1].value = stats.orderCount
      statCards[2].value = stats.purchaseAmount
      statCards[3].value = stats.profit
    }

    // 销售趋势
    if (trendRes.status === 'fulfilled') {
      salesTrendData.value = trendRes.value.data
    }

    // 销售排行
    if (rankRes.status === 'fulfilled') {
      rankingData.value = rankRes.value.data
    }

    // 库存预警
    if (warnRes.status === 'fulfilled') {
      warningList.value = warnRes.value.data.list
    }

    // 待办事项
    if (todoRes.status === 'fulfilled') {
      todoList.value = todoRes.value.data
    }
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
  }
}

async function loadSalesTrend() {
  try {
    const res = await getSalesTrend(trendRange.value)
    salesTrendData.value = res.data
  } catch (error) {
    console.error('加载销售趋势失败:', error)
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  .stat-cards {
    margin-bottom: 16px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .stat-info {
      flex: 1;
      min-width: 0;

      .stat-label {
        font-size: 13px;
        color: var(--text-secondary);
        margin-bottom: 10px;
      }

      .stat-value {
        font-size: 26px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 8px;
        line-height: 1.2;
      }

      .stat-trend {
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 2px;

        &.up { color: var(--success-color); }
        &.down { color: var(--danger-color); }
      }
    }

    .stat-icon {
      width: 54px;
      height: 54px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-left: 12px;
    }
  }

  .chart-row {
    margin-bottom: 16px;
  }

  .chart-header-extra {
    display: flex;
    gap: 8px;
  }

  .bottom-row {
    margin-bottom: 16px;

    .todo-list {
      .todo-item {
        display: flex;
        align-items: center;
        padding: 14px 12px;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.25s ease;
        margin-bottom: 8px;
        border: 1px solid transparent;

        &:hover {
          background-color: #f5f7fa;
          border-color: #ebeef5;
          transform: translateX(4px);
        }

        &:last-child {
          margin-bottom: 0;
        }

        .todo-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 14px;
          flex-shrink: 0;
        }

        .todo-info {
          flex: 1;
          min-width: 0;

          .todo-title {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: 4px;
          }

          .todo-count {
            font-size: 12px;
            color: var(--text-secondary);
          }
        }

        .todo-badge {
          margin-right: 8px;
        }

        .todo-arrow {
          color: #c0c4cc;
          transition: transform 0.25s ease;
        }

        &:hover .todo-arrow {
          transform: translateX(4px);
          color: #909399;
        }
      }
    }
  }

  .quick-action-row {
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 16px;

      .action-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px 12px;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.25s ease;
        border: 1px solid transparent;

        &:hover {
          background-color: #fafafa;
          border-color: #ebeef5;
          transform: translateY(-3px);

          .action-icon {
            transform: scale(1.08);
          }
        }

        .action-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
          transition: transform 0.25s ease;
        }

        .action-title {
          font-size: 13px;
          color: var(--text-primary);
          font-weight: 500;
        }
      }
    }
  }
}
</style>
