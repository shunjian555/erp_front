<template>
  <div class="page-container">
    <div class="forecast-summary">
      <div class="summary-card"><div class="summary-label">期初余额</div><div class="summary-value">¥{{ summary.opening.toLocaleString() }}</div></div>
      <div class="summary-card"><div class="summary-label">预计现金流入</div><div class="summary-value" style="color: #67c23a">+¥{{ summary.inflow.toLocaleString() }}</div></div>
      <div class="summary-card"><div class="summary-label">预计现金流出</div><div class="summary-value" style="color: #f56c6c">-¥{{ summary.outflow.toLocaleString() }}</div></div>
      <div class="summary-card"><div class="summary-label">预计期末余额</div><div class="summary-value" :style="{ color: summary.closing >= 0 ? '#67c23a' : '#f56c6c' }">¥{{ summary.closing.toLocaleString() }}</div></div>
    </div>
    <div class="chart-container">
      <BaseChart :option="chartOption" height="400px" />
    </div>
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增预测项</el-button>
        <el-button :icon="DataAnalysis" @click="handleRecalc">重新计算</el-button>
        <el-button :icon="Download" plain @click="handleExport">导出</el-button>
      </div>
    </div>
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #type="{ row }"><el-tag :type="row.type === '流入' ? 'success' : 'danger'" size="small">{{ row.type }}</el-tag></template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 3)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 3" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown><el-dropdown-menu><el-dropdown-item v-for="action in getActions(row).slice(3)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item></el-dropdown-menu></template>
        </el-dropdown>
      </template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="500px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" /></BaseDialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, DataAnalysis, Download, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseChart from '@/components/BaseChart.vue'
import { exportToExcel } from '@/utils/excel'
import { browserPrint } from '@/utils/print'
const summary = reactive({ opening: 2850000, inflow: 3850000, outflow: 2680000 })
summary.closing = summary.opening + summary.inflow - summary.outflow
const chartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['流入', '流出', '净流量'] },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'] },
  yAxis: { type: 'value', name: '金额(万元)' },
  series: [
    { name: '流入', type: 'bar', stack: 'a', data: [320, 380, 410, 450, 480, 520, 560, 600, 540, 580, 620, 680], itemStyle: { color: '#67c23a' } },
    { name: '流出', type: 'bar', stack: 'b', data: [280, 310, 340, 360, 380, 400, 420, 440, 410, 430, 460, 500], itemStyle: { color: '#f56c6c' } },
    { name: '净流量', type: 'line', data: [40, 70, 70, 90, 100, 120, 140, 160, 130, 150, 160, 180], itemStyle: { color: '#409eff' }, smooth: true }
  ]
}))
const searchItems = [{ prop: 'period', label: '期间', type: 'input' }]
const columns = [{ prop: 'period', label: '期间', width: 110 }, { prop: 'type', label: '类型', width: 80, slot: 'type' }, { prop: 'subject', label: '科目', width: 180 }, { prop: 'amount', label: '金额', width: 130, align: 'right' }, { prop: 'probability', label: '发生概率', width: 110, align: 'center' }, { prop: 'remark', label: '备注', minWidth: 200 }]
const formItems = [{ prop: 'period', label: '期间', type: 'input' }, { prop: 'type', label: '类型', type: 'select', options: [{ value: '流入', label: '流入' }, { value: '流出', label: '流出' }] }, { prop: 'subject', label: '科目', type: 'input' }, { prop: 'amount', label: '金额', type: 'number' }, { prop: 'probability', label: '发生概率(%)', type: 'number' }, { prop: 'remark', label: '备注', type: 'textarea', rows: 2 }]
const formRules = { period: [{ required: true, message: '请输入期间', trigger: 'blur' }], amount: [{ required: true, message: '请输入金额', trigger: 'blur' }] }
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, period: '' })
const formData = reactive({ id: undefined, period: '2024-07', type: '流入', subject: '', amount: undefined, probability: 80, remark: '' })
async function loadData() {
  loading.value = true
  try {
    const all = Array.from({ length: 18 }, (_, i) => {
      const tp = i % 3 === 0 ? '流入' : '流出'
      return { id: i + 1, period: `2024-${String((i % 12) + 1).padStart(2, '0')}`, type: tp, subject: ['销售回款', '采购付款', '工资支出', '税费', '投资收益', '其他收入'][i % 6], amount: (20000 + i * 3500).toFixed(2), probability: [90, 70, 85, 60, 75, 50][i % 6], remark: '' }
    })
    const { period = '', pageNum = 1, pageSize = 10 } = queryParams
    let filtered = all
    if (period) filtered = filtered.filter(x => x.period.includes(period))
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增预测项'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.type = '流入'; formData.period = '2024-07'; formData.probability = 80; dialogVisible.value = true }
function handleRecalc() { ElMessage.success('已根据历史数据重新计算预测值') }
function handleExport() { exportToExcel(tableData.value, columns, '现金流预测') }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除「${row.subject}」?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
function getActions(row) {
  return [
    { key: 'view', label: '查看', type: 'primary', handler: (r) => ElMessage.info(`查看 ${r.subject}`) },
    { key: 'edit', label: '编辑', type: 'primary', handler: (r) => { dialogTitle.value = '编辑预测项'; Object.assign(formData, r); dialogVisible.value = true } },
    { key: 'delete', label: '删除', type: 'danger', handler: handleDelete }
  ]
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
<style lang="scss" scoped>
.forecast-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px }
.summary-card { padding: 20px; background: linear-gradient(135deg, #fff, #f5f7fa); border: 1px solid #ebeef5; border-radius: 8px; text-align: center }
.summary-label { font-size: 13px; color: #909399; margin-bottom: 8px }
.summary-value { font-size: 22px; font-weight: 700; color: #303133 }
.chart-container { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
