<template>
  <div class="page-container">
    <div class="monitor-summary">
      <div class="ms-card ok">
        <el-icon class="ms-icon"><CircleCheckFilled /></el-icon>
        <div>
          <div class="ms-label">系统状态</div>
          <div class="ms-value">运行中</div>
        </div>
      </div>
      <div class="ms-card">
        <el-icon class="ms-icon"><Cpu /></el-icon>
        <div>
          <div class="ms-label">CPU 使用率</div>
          <div class="ms-value">{{ cpu }}%</div>
        </div>
      </div>
      <div class="ms-card">
        <el-icon class="ms-icon"><Coin /></el-icon>
        <div>
          <div class="ms-label">内存使用率</div>
          <div class="ms-value">{{ mem }}%</div>
        </div>
      </div>
      <div class="ms-card">
        <el-icon class="ms-icon"><DataLine /></el-icon>
        <div>
          <div class="ms-label">在线用户</div>
          <div class="ms-value">{{ onlineUsers }}</div>
        </div>
      </div>
    </div>
    <div class="monitor-grid">
      <div class="chart-card">
        <div class="card-title">CPU & 内存趋势 (最近 1 小时)</div>
        <BaseChart :option="cpuOption" height="220px" />
      </div>
      <div class="chart-card">
        <div class="card-title">接口调用量</div>
        <BaseChart :option="apiOption" height="220px" />
      </div>
    </div>
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Refresh" @click="refreshAll">刷新数据</el-button>
        <el-button :icon="Download" plain @click="handleExport">导出报告</el-button>
      </div>
    </div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="慢接口" name="slow">
        <BaseTable :columns="slowColumns" :table-data="slowApis">
          <template #duration="{ row }"><el-tag :type="row.duration > 1000 ? 'danger' : 'warning'" size="small">{{ row.duration }}ms</el-tag></template>
        </BaseTable>
      </el-tab-pane>
      <el-tab-pane label="异常日志" name="error">
        <BaseTable :columns="errorColumns" :table-data="errors">
          <template #level="{ row }"><el-tag :type="row.level === 'ERROR' ? 'danger' : 'warning'" size="small">{{ row.level }}</el-tag></template>
        </BaseTable>
      </el-tab-pane>
      <el-tab-pane label="在线用户" name="online">
        <BaseTable :columns="onlineColumns" :table-data="onlineList">
          <template #status="{ row }"><BaseStatusTag :type="row.status === '在线' ? 'success' : 'info'">{{ row.status }}</BaseStatusTag></template>
        </BaseTable>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { exportToExcel } from '@/utils/excel'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled, Cpu, Coin, DataLine, Refresh, Download } from '@element-plus/icons-vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseChart from '@/components/BaseChart.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
const activeTab = ref('slow')
const cpu = ref(45), mem = ref(62), onlineUsers = ref(86)
let timer = null
const cpuOption = ref({ tooltip: { trigger: 'axis' }, legend: { data: ['CPU', '内存'] }, xAxis: { type: 'category', data: [] }, yAxis: { type: 'value', max: 100 }, series: [{ name: 'CPU', type: 'line', data: [], smooth: true, itemStyle: { color: '#409eff' }, areaStyle: { opacity: 0.2 } }, { name: '内存', type: 'line', data: [], smooth: true, itemStyle: { color: '#67c23a' }, areaStyle: { opacity: 0.2 } }] })
const apiOption = ref({ tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: [] }, yAxis: { type: 'value' }, series: [{ type: 'bar', data: [], itemStyle: { color: '#e6a23c' } }] })
const slowColumns = [{ prop: 'api', label: '接口', minWidth: 280 }, { prop: 'method', label: '方法', width: 80 }, { prop: 'duration', label: '耗时', width: 100, slot: 'duration', align: 'right' }, { prop: 'calls', label: '调用次数', width: 100, align: 'right' }, { prop: 'lastCall', label: '最近调用', width: 170 }]
const slowApis = ref([
  { id: 1, api: '/api/finance/voucher/list', method: 'GET', duration: 1250, calls: 328, lastCall: '2024-07-20 15:30:25' },
  { id: 2, api: '/api/inventory/query', method: 'GET', duration: 980, calls: 1240, lastCall: '2024-07-20 15:30:24' },
  { id: 3, api: '/api/bi/sales-analysis', method: 'GET', duration: 1560, calls: 86, lastCall: '2024-07-20 15:30:20' },
  { id: 4, api: '/api/production/order/list', method: 'GET', duration: 720, calls: 156, lastCall: '2024-07-20 15:30:15' }
])
const errorColumns = [{ prop: 'time', label: '时间', width: 170 }, { prop: 'level', label: '级别', width: 80, slot: 'level' }, { prop: 'module', label: '模块', width: 120 }, { prop: 'message', label: '错误信息', minWidth: 300 }]
const errors = ref([
  { id: 1, time: '2024-07-20 15:25:30', level: 'ERROR', module: 'finance', message: '凭证保存失败：借贷不平衡' },
  { id: 2, time: '2024-07-20 14:50:12', level: 'WARN', module: 'inventory', message: '库存预警: 商品A 库存不足' },
  { id: 3, time: '2024-07-20 14:30:00', level: 'ERROR', module: 'system', message: 'API 调用超时: /api/xxx' }
])
const onlineColumns = [{ prop: 'user', label: '用户', width: 120 }, { prop: 'dept', label: '部门', width: 120 }, { prop: 'ip', label: 'IP', width: 130 }, { prop: 'loginTime', label: '登录时间', width: 170 }, { prop: 'lastOp', label: '最后操作', width: 170 }, { prop: 'status', label: '状态', width: 90, slot: 'status' }]
const onlineList = ref([
  { id: 1, user: '张三', dept: '销售部', ip: '192.168.1.10', loginTime: '2024-07-20 09:00:00', lastOp: '2024-07-20 15:30:25', status: '在线' },
  { id: 2, user: '李四', dept: '财务部', ip: '192.168.1.20', loginTime: '2024-07-20 08:30:00', lastOp: '2024-07-20 15:25:00', status: '在线' },
  { id: 3, user: '王五', dept: '技术部', ip: '192.168.1.30', loginTime: '2024-07-20 10:00:00', lastOp: '2024-07-20 12:00:00', status: '空闲' }
])
function refreshAll() {
  cpu.value = 30 + Math.floor(Math.random() * 50); mem.value = 50 + Math.floor(Math.random() * 30); onlineUsers.value = 60 + Math.floor(Math.random() * 50)
  updateCharts(); ElMessage.success('已刷新')
}
function updateCharts() {
  const now = new Date(); const x = []; const cpuData = []; const memData = []
  for (let i = 59; i >= 0; i--) { const t = new Date(now.getTime() - i * 60000); x.push(`${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}`); cpuData.push(30 + Math.random() * 40); memData.push(50 + Math.random() * 30) }
  cpuOption.value.xAxis.data = x; cpuOption.value.series[0].data = cpuData; cpuOption.value.series[1].data = memData
  const apiX = ['销售', '采购', '库存', '财务', 'OA', 'CRM']; const apiY = apiX.map(() => 100 + Math.floor(Math.random() * 500))
  apiOption.value.xAxis.data = apiX; apiOption.value.series[0].data = apiY
}
function handleExport() {
  const rows = userData.value.map(u => ({ 用户: u.user, 部门: u.dept, IP: u.ip, 登录时间: u.loginTime, 最后操作: u.lastOp, 状态: u.status }))
  exportToExcel(rows, [{ prop: '用户', label: '用户' }, { prop: '部门', label: '部门' }, { prop: 'IP', label: 'IP' }, { prop: '登录时间', label: '登录时间' }, { prop: '最后操作', label: '最后操作' }, { prop: '状态', label: '状态' }], '系统监控报告')
}
onMounted(() => { updateCharts(); timer = setInterval(refreshAll, 30000) })
onUnmounted(() => clearInterval(timer))
</script>
<style lang="scss" scoped>
.monitor-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px }
.ms-card { display: flex; align-items: center; gap: 16px; padding: 20px; background: #fff; border: 1px solid #ebeef5; border-radius: 8px; .ms-icon { font-size: 36px; color: #409eff } &.ok .ms-icon { color: #67c23a } }
.ms-label { font-size: 13px; color: #909399 }
.ms-value { font-size: 22px; font-weight: 700; margin-top: 4px }
.monitor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px }
.chart-card { background: #fff; padding: 16px 20px; border-radius: 8px }
.card-title { font-size: 14px; font-weight: 600; margin-bottom: 12px }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } }
</style>
