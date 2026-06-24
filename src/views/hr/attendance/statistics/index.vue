<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">生成报表</el-button>
        <el-button type="success" :icon="Download" plain @click="handleExport">导出Excel</el-button>
        <el-button type="warning" :icon="Printer" plain @click="handlePrint">打印报表</el-button>
        <el-button type="primary" :icon="PieChart" plain @click="handleChart">可视化图表</el-button>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" />
      </div>
    </div>
    <BaseTable
      ref="tableRef"
      :columns="columns"
      :table-data="tableData"
      :loading="loading"
      :total="total"
      :current-page.sync="queryParams.pageNum"
      :page-size.sync="queryParams.pageSize"
      :show-selection="true"
      :show-index="true"
      @selection-change="handleSelectionChange"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #attendanceRate="{ row }">
        <el-progress :percentage="parseFloat(row.attendanceRate)" :stroke-width="10" :color="rateColor(parseFloat(row.attendanceRate))" style="width: 90px" />
      </template>
      <template #operation="{ row }">
        <MoreActions :items="rowActions(row)" :max="3" />
      </template>
    </BaseTable>

    <!-- 汇总统计卡片 -->
    <div class="summary-cards">
      <div class="stat-card" v-for="(item, index) in summaryStats" :key="index">
        <div class="stat-icon" :style="{ background: item.color }"><el-icon :size="24"><component :is="item.icon" /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ item.value }}</span>
          <span class="stat-label">{{ item.label }}</span>
        </div>
      </div>
    </div>

    <BaseDialog v-model="dialogVisible" title="考勤详情" width="600px" @cancel="dialogVisible = false">
      <div v-if="currentRow" class="detail-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="员工">{{ currentRow.employeeName }} ({{ currentRow.empNo }})</el-descriptions-item>
          <el-descriptions-item label="部门">{{ currentRow.deptName }}</el-descriptions-item>
          <el-descriptions-item label="统计月份">{{ currentRow.month }}</el-descriptions-item>
          <el-descriptions-item label="应出勤天数">{{ currentRow.workDays }}天</el-descriptions-item>
          <el-descriptions-item label="实际出勤">{{ currentRow.actualDays }}天</el-descriptions-item>
          <el-descriptions-item label="出勤率"><el-progress :percentage="parseFloat(currentRow.attendanceRate)" style="width: 120px" /></el-descriptions-item>
          <el-descriptions-item label="迟到次数">{{ currentRow.lateCount }}次</el-descriptions-item>
          <el-descriptions-item label="早退次数">{{ earlyCount }}次</el-descriptions-item>
          <el-descriptions-item label="旷工天数">{{ currentRow.absentCount }}天</el-descriptions-item>
          <el-descriptions-item label="请假天数">{{ currentRow.leaveDays }}天</el-descriptions-item>
          <el-descriptions-item label="加班时长">{{ currentRow.overtimeHours }}小时</el-descriptions-item>
        </el-descriptions>
      </div>
    </BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Refresh, Download, Printer, PieChart, User, Warning, Timer, Clock } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import MoreActions from '@/components/MoreActions.vue'

// 每行操作按钮配置
function rowActions(row) {
  return [
    { label: '详情', type: 'primary', important: true, onClick: () => handleView(row) },
    { label: '日报明细', type: 'primary', important: true, onClick: () => handleDaily(row) },
    { label: '调整考勤', type: 'warning', important: true, onClick: () => handleAdjust(row) },
    { label: '确认', type: 'success', onClick: () => handleConfirm(row) }
  ]
}
import BaseDialog from '@/components/BaseDialog.vue'
import { getAttendanceStatistics } from '@/api/hr'

const searchItems = [
  { prop: 'employeeName', label: '员工姓名', type: 'input' },
  { prop: 'empNo', label: '工号', type: 'input' },
  { prop: 'deptName', label: '部门', type: 'select', options: [
    { value: '', label: '全部' }, { value: '技术部', label: '技术部' }, { value: '销售部', label: '销售部' },
    { value: '财务部', label: '财务部' }, { value: '生产部', label: '生产部' }, { value: '采购部', label: '采购部' }
  ]},
  { prop: 'month', label: '统计月份', type: 'input', defaultValue: '2026-05' }
]

const columns = [
  { prop: 'employeeName', label: '姓名', width: 90 },
  { prop: 'empNo', label: '工号', width: 115 },
  { prop: 'deptName', label: '部门', width: 95 },
  { prop: 'month', label: '月份', width: 90, align: 'center' },
  { prop: 'workDays', label: '应出勤', width: 75, align: 'center' },
  { prop: 'actualDays', label: '实出勤', width: 75, align: 'center' },
  { prop: 'lateCount', label: '迟到', width: 60, align: 'center' },
  { prop: 'earlyCount', label: '早退', width: 60, align: 'center' },
  { prop: 'absentCount', label: '旷工', width: 60, align: 'center' },
  { prop: 'leaveDays', label: '请假', width: 60, align: 'center' },
  { prop: 'overtimeHours', label: '加班(h)', width: 80, align: 'center' },
  { prop: 'attendanceRate', label: '出勤率', width: 130, slot: 'attendanceRate' }
]

// 汇总统计数据（从表格数据计算）
const summaryStats = computed(() => {
  const total = tableData.value.length || 1
  const avgRate = (tableData.value.reduce((s, r) => s + parseFloat(r.attendanceRate || 0), 0) / total).toFixed(1)
  const totalLate = tableData.value.reduce((s, r) => s + (r.lateCount || 0), 0)
  const totalAbsent = tableData.value.reduce((s, r) => s + (r.absentCount || 0), 0)
  const totalOvertime = tableData.value.reduce((s, r) => s + parseFloat(r.overtimeHours || 0), 0).toFixed(1)
  return [
    { icon: User, label: '总人数', value: String(total), color: 'linear-gradient(135deg,#667eea,#764ba2)' },
    { icon: Clock, label: '平均出勤率', value: avgRate + '%', color: 'linear-gradient(135deg,#43e97b,#38f9d7)' },
    { icon: Warning, label: '累计迟到', value: totalLate + '次', color: 'linear-gradient(135deg,#fa709a,#fee140)' },
    { icon: Timer, label: '累计加班', value: totalOvertime + 'h', color: 'linear-gradient(135deg,#30cfd0,#330867)' }
  ]
})

function rateColor(rate) { if (rate >= 98) return '#67C23A'; if (rate >= 90) return '#409EFF'; if (rate >= 80) return '#E6A23C'; return '#F56C6C' }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), currentRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, employeeName: '', empNo: '', deptName: '', month: '2026-05' })

async function loadData() {
  loading.value = true
  try { const res = await getAttendanceStatistics(queryParams); tableData.value = res.data.list || []; total.value = res.data.total || 0 }
  finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.assign(queryParams, { pageNum: 1, employeeName: '', empNo: '', deptName: '', month: '2026-05' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }

function handleView(row) { currentRow.value = { ...row }; dialogVisible.value = true }
function handleDaily(row) { ElMessage.info(`查看 ${row.employeeName} 的每日考勤明细`) }
function handleAdjust(row) { ElMessage.info(`调整 ${row.employeeName} 的考勤数据`) }
function handleConfirm(row) { ElMessage.success(`${row.employeeName} 考勤数据已确认`) }
function handleExport() { ElMessage.success('正在导出考勤统计Excel...') }
function handlePrint() { ElMessage.info('打印考勤统计报表') }
function handleChart() { ElMessage.info('打开考勤可视化图表') }
function handleAdd() { ElMessage.info('生成新的考勤统计报表') }

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
.summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;
  .stat-card { background: #fff; border-radius: var(--border-radius-base); padding: 18px; display: flex; align-items: center; gap: 16px; box-shadow: var(--box-shadow-lighter);
    .stat-icon { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
    .stat-info { display: flex; flex-direction: column;
      .stat-value { font-size: 22px; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
      .stat-label { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }
    }
  }
}
.detail-content { padding: 8px 0; }
</style>
