<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalAmount }}</div>
              <div class="stat-label">本月工资总额</div>
            </div>
            <el-icon :size="40" color="#409EFF"><Money /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value" style="color: #67C23A">{{ statistics.avgSalary }}</div>
              <div class="stat-label">人均工资</div>
            </div>
            <el-icon :size="40" color="#67C23A"><UserFilled /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value" style="color: #E6A23C">{{ statistics.employeeCount }}</div>
              <div class="stat-label">发薪人数</div>
            </div>
            <el-icon :size="40" color="#E6A23C"><Avatar /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value" style="color: #F56C6C">{{ statistics.taxTotal }}</div>
              <div class="stat-label">个税总额</div>
            </div>
            <el-icon :size="40" color="#F56C6C"><Wallet /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />

    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleCalculate">工资核算</el-button>
        <el-button type="success" :icon="Check" plain @click="handleApprove">审批发放</el-button>
        <el-button type="warning" :icon="Edit" plain @click="handleAdjust">调薪管理</el-button>
        <el-button type="info" :icon="Download" plain @click="handleExport">导出工资表</el-button>
        <el-button type="primary" :icon="Printer" plain @click="handlePrint">打印工资条</el-button>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" />
      </div>
    </div>

    <BaseTable
      :columns="columns"
      :table-data="tableData"
      :loading="loading"
      :total="pagination.total"
      :current-page="pagination.current"
      :page-size="pagination.pageSize"
      @selection-change="handleSelectionChange"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <!-- 基本工资列 -->
      <template #baseSalary="{ row }">
        <span class="money">￥{{ row.baseSalary.toLocaleString() }}</span>
      </template>

      <!-- 绩效工资列 -->
      <template #performanceSalary="{ row }">
        <span class="money success">￥{{ row.performanceSalary.toLocaleString() }}</span>
      </template>

      <!-- 应发合计列 -->
      <template #grossSalary="{ row }">
        <span class="money primary">￥{{ row.grossSalary.toLocaleString() }}</span>
      </template>

      <!-- 代扣个税列 -->
      <template #tax="{ row }">
        <span class="money danger">-￥{{ row.tax.toLocaleString() }}</span>
      </template>

      <!-- 实发工资列 -->
      <template #netSalary="{ row }">
        <strong class="money success">￥{{ row.netSalary.toLocaleString() }}</strong>
      </template>

      <!-- 状态列 -->
      <template #status="{ row }">
        <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
      </template>

      <!-- 操作列 -->
      <template #action="{ row }">
        <MoreActions :items="rowActions(row)" :max="3" />
      </template>
    </BaseTable>

    <!-- 工资核算对话框 -->
    <BaseDialog v-model="calculateVisible" title="工资核算" width="1000px" @confirm="handleCalculateSubmit">
      <el-alert
        title="工资核算说明"
        type="info"
        description="系统将根据员工的基本信息、考勤记录、绩效考核等数据自动计算工资。请选择核算月份后点击开始核算。"
        :closable="false"
        show-icon
        class="mb-4"
      />

      <el-form ref="calcFormRef" :model="calcForm" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="核算月份" required>
              <el-date-picker
                v-model="calcForm.month"
                type="month"
                placeholder="选择月份"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="核算范围">
              <el-select v-model="calcForm.scope" placeholder="请选择范围" style="width: 100%">
                <el-option label="全部员工" value="all" />
                <el-option label="指定部门" value="dept" />
                <el-option label="指定员工" value="employee" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工资方案">
              <el-select v-model="calcForm.salaryPlan" placeholder="请选择方案" style="width: 100%">
                <el-option label="标准工资方案" value="standard" />
                <el-option label="试用期工资方案" value="probation" />
                <el-option label="计件工资方案" value="piecework" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否含社保">
              <el-switch v-model="calcForm.includeInsurance" active-text="包含" inactive-text="不包含" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">核算项目</el-divider>
        <el-checkbox-group v-model="calcForm.items">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-checkbox label="basic">基本工资</el-checkbox>
            </el-col>
            <el-col :span="8">
              <el-checkbox label="performance">绩效工资</el-checkbox>
            </el-col>
            <el-col :span="8">
              <el-checkbox label="overtime">加班费</el-checkbox>
            </el-col>
            <el-col :span="8">
              <el-checkbox label="allowance">各类补贴</el-checkbox>
            </el-col>
            <el-col :span="8">
              <el-checkbox label="bonus">奖金</el-checkbox>
            </el-col>
            <el-col :span="8">
              <el-checkbox label="deduction">扣款项目</el-checkbox>
            </el-col>
            <el-col :span="8">
              <el-checkbox label="social">社保公积金</el-checkbox>
            </el-col>
            <el-col :span="8">
              <el-checkbox label="tax">个人所得税</el-checkbox>
            </el-col>
          </el-row>
        </el-checkbox-group>
      </el-form>

      <div class="mt-4 text-center">
        <el-progress
          :percentage="calcProgress"
          :status="calcProgress === 100 ? 'success' : ''"
          :stroke-width="15"
          style="max-width: 500px; margin: 0 auto"
        >
          <span>{{ calcStatusText }}</span>
        </el-progress>
      </div>
    </BaseDialog>

    <!-- 工资详情对话框 -->
    <BaseDialog v-model="detailVisible" title="工资明细" width="1100px" :show-footer="false">
      <el-descriptions :column="3" border class="mb-4">
        <el-descriptions-item label="姓名">{{ detailData.employeeName }}</el-descriptions-item>
        <el-descriptions-item label="工号">{{ detailData.employeeNo }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ detailData.deptName }}</el-descriptions-item>
        <el-descriptions-item label="岗位">{{ detailData.position }}</el-descriptions-item>
        <el-descriptions-item label="工资月份">{{ detailData.salaryMonth }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detailData.status)">{{ detailData.status }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <h4 class="mt-4 mb-2">收入项目</h4>
      <el-table :data="detailData.incomeItems || []" border size="small" class="mb-4">
        <el-table-column prop="item" label="项目" min-width="150" />
        <el-table-column prop="amount" label="金额(元)" width="130" align="right">
          <template #default="{ row }">
            <span class="money success">+{{ row.amount.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" showOverflowTooltip />
      </el-table>

      <h4 class="mt-2 mb-2">扣除项目</h4>
      <el-table :data="detailData.deductionItems || []" border size="small" class="mb-4">
        <el-table-column prop="item" label="项目" min-width="150" />
        <el-table-column prop="amount" label="金额(元)" width="130" align="right">
          <template #default="{ row }">
            <span class="money danger">-{{ row.amount.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" showOverflowTooltip />
      </el-table>

      <el-row :gutter="20" class="summary-section">
        <el-col :span="8">
          <el-statistic title="应发合计" :value="detailData.grossSalary" precision="2">
            <template #prefix>￥</template>
          </el-statistic>
        </el-col>
        <el-col :span="8">
          <el-statistic title="代扣合计" :value="detailData.totalDeduction" precision="2">
            <template #prefix>-￥</template>
          </el-statistic>
        </el-col>
        <el-col :span="8">
          <el-statistic title="实发工资" :value="detailData.netSalary" precision="2">
            <template #prefix>￥</template>
            <template #suffix>
              <el-tag type="success" size="small">税后</el-tag>
            </template>
          </el-statistic>
        </el-col>
      </el-row>
    </BaseDialog>

    <!-- 工资条对话框 -->
    <BaseDialog v-model="slipVisible" title="电子工资条" width="600px" :show-footer="false">
      <div class="salary-slip">
        <div class="slip-header">
          <h2>{{ companyInfo.name }}</h2>
          <p>电子工资条</p>
        </div>
        <div class="slip-info">
          <p><strong>员工：</strong>{{ slipData.employeeName }} | <strong>部门：</strong>{{ slipData.deptName }}</p>
          <p><strong>月份：</strong>{{ slipData.salaryMonth }} | <strong>工号：</strong>{{ slipData.employeeNo }}</p>
        </div>
        <el-divider />
        <div class="slip-content">
          <div class="slip-row">
            <span class="label">基本工资</span>
            <span class="value">￥{{ (slipData.baseSalary || 0).toLocaleString() }}</span>
          </div>
          <div class="slip-row">
            <span class="label">绩效工资</span>
            <span class="value">+￥{{ (slipData.performanceSalary || 0).toLocaleString() }}</span>
          </div>
          <div class="slip-row">
            <span class="label">补贴奖金</span>
            <span class="value">+￥{{ (slipData.allowance || 0).toLocaleString() }}</span>
          </div>
          <div class="slip-row">
            <span class="label">加班费</span>
            <span class="value">+￥{{ (slipData.overtimePay || 0).toLocaleString() }}</span>
          </div>
          <el-divider />
          <div class="slip-row total">
            <span class="label">应发合计</span>
            <span class="value">￥{{ (slipData.grossSalary || 0).toLocaleString() }}</span>
          </div>
          <div class="slip-row deduct">
            <span class="label">社会保险</span>
            <span class="value">-￥{{ (slipData.socialInsurance || 0).toLocaleString() }}</span>
          </div>
          <div class="slip-row deduct">
            <span class="label">住房公积金</span>
            <span class="value">-￥{{ (slipData.housingFund || 0).toLocaleString() }}</span>
          </div>
          <div class="slip-row deduct">
            <span class="label">个人所得税</span>
            <span class="value">-￥{{ (slipData.tax || 0).toLocaleString() }}</span>
          </div>
          <div class="slip-row other-deduct">
            <span class="label">其他扣款</span>
            <span class="value">-￥{{ (slipData.otherDeduction || 0).toLocaleString() }}</span>
          </div>
          <el-divider />
          <div class="slip-row net-total">
            <span class="label">实发工资（税后）</span>
            <span class="value net">￥{{ (slipData.netSalary || 0).toLocaleString() }}</span>
          </div>
        </div>
        <div class="slip-footer mt-4">
          <p>本工资条仅供个人查阅，如有疑问请联系人力资源部。</p>
          <p>生成时间：{{ slipData.createTime }}</p>
        </div>
      </div>
    </BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Delete,
  Refresh,
  Check,
  Edit,
  Download,
  Printer,
  Money,
  UserFilled,
  Avatar,
  Wallet,
} from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import MoreActions from '@/components/MoreActions.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import { getSalaryList, calculateSalary, approveSalary, exportSalarySlip } from '@/api/hr'

// 每行操作按钮配置
function rowActions(row) {
  const editable = ['待确认', '已退回'].includes(row.status)
  return [
    { label: '详情', type: 'primary', important: true, onClick: () => handleView(row) },
    { label: '确认', type: 'success', important: true, hidden: row.status !== '待确认', onClick: () => handleConfirm(row) },
    { label: '修改', type: 'warning', important: true, hidden: !editable, onClick: () => handleEdit(row) },
    { label: '工资条', type: 'info', onClick: () => handleSlip(row) }
  ]
}

// 搜索项配置
const searchItems = [
  {
    prop: 'keyword',
    label: '关键词',
    type: 'input',
    placeholder: '搜索员工/工号',
  },
  {
    prop: 'deptName',
    label: '部门',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '技术部', value: '技术部' },
      { label: '销售部', value: '销售部' },
      { label: '财务部', value: '财务部' },
      { label: '行政部', value: '行政部' },
      { label: '人力资源部', value: '人力资源部' },
    ],
  },
  {
    prop: 'salaryMonth',
    label: '工资月份',
    type: 'month',
    placeholder: '选择月份',
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '待核算', value: '待核算' },
      { label: '待确认', value: '待确认' },
      { label: '待发放', value: '待发放' },
      { label: '已发放', value: '已发放' },
    ],
  },
]

// 表格列配置
const columns = [
  { type: 'selection', width: 50, fixed: 'left' },
  { prop: 'employeeNo', label: '工号', width: 120, fixed: 'left' },
  { prop: 'employeeName', label: '姓名', width: 90, fixed: 'left' },
  { prop: 'deptName', label: '部门', width: 100 },
  { prop: 'position', label: '岗位', width: 100 },
  { slot: 'baseSalary', label: '基本工资', width: 120, align: 'right' },
  { slot: 'performanceSalary', label: '绩效工资', width: 120, align: 'right' },
  { slot: 'grossSalary', label: '应发合计', width: 130, align: 'right' },
  { slot: 'tax', label: '代扣个税', width: 110, align: 'right' },
  { slot: 'netSalary', label: '实发工资', width: 130, align: 'right' },
  { slot: 'status', label: '状态', width: 90 },
  { prop: 'salaryMonth', label: '工资月份', width: 110 },
  { slot: 'action', label: '操作', width: 200, fixed: 'right' },
]

// 统计数据
const statistics = reactive({
  totalAmount: '¥1,258,600.00',
  avgSalary: '¥18,568.00',
  employeeCount: '168',
  taxTotal: '¥186,520.00',
})

// 公司信息
const companyInfo = reactive({
  name: '某某科技有限公司',
})

// 数据状态
const loading = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

// 核算相关
const calculateVisible = ref(false)
const calcFormRef = ref(null)
const calcForm = reactive({
  month: new Date(),
  scope: 'all',
  salaryPlan: 'standard',
  includeInsurance: true,
  items: ['basic', 'performance', 'overtime', 'allowance', 'bonus', 'deduction', 'social', 'tax'],
})
const calcProgress = ref(0)
const calcStatusText = ref('准备就绪')

// 详情
const detailVisible = ref(false)
const detailData = ref({})

// 工资条
const slipVisible = ref(false)
const slipData = ref({})

// 获取状态类型
function getStatusType(status) {
  const map = {
    '待核算': 'info',
    '待确认': 'warning',
    '待发放': 'primary',
    '已发放': 'success',
    '已退回': 'danger',
  }
  return map[status] || 'info'
}

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      ...searchParams.value,
    }
    const res = await getSalaryList(params)
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0

    // 更新统计
    if (res.data.statistics) {
      Object.assign(statistics, res.data.statistics)
    }
  } catch (error) {
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索参数
const searchParams = ref({})

function handleSearch(params) {
  searchParams.value = params
  pagination.current = 1
  loadData()
}

function handleReset() {
  searchParams.value = {}
  pagination.current = 1
  loadData()
}

// 分页处理
function handlePageChange(page) {
  pagination.current = page
  loadData()
}

function handleSizeChange(size) {
  pagination.pageSize = size
  pagination.current = 1
  loadData()
}

// 选择变化
function handleSelectionChange(rows) {
  selectedRows.value = rows
}

// 工资核算
function handleCalculate() {
  calcProgress.value = 0
  calcStatusText.value = '准备就绪'
  calculateVisible.value = true
}

// 执行核算
async function handleCalculateSubmit() {
  calcStatusText.value = '正在核算...'
  calcProgress.value = 10

  // 模拟核算进度
  const steps = [
    { progress: 30, text: '正在读取员工基本信息...' },
    { progress: 50, text: '正在计算考勤数据...' },
    { progress: 70, text: '正在汇总绩效分数...' },
    { progress: 85, text: '正在计算社保公积金...' },
    { progress: 95, text: '正在计算个人所得税...' },
    { progress: 100, text: '核算完成！' },
  ]

  for (const step of steps) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    calcProgress.value = step.progress
    calcStatusText.value = step.text
  }

  try {
    await calculateSalary(calcForm)
    ElMessage.success('工资核算完成')
    calculateVisible.value = false
    loadData()
  } catch (error) {
    console.error('核算失败:', error)
  }
}

// 审批发放
function handleApprove() {
  ElMessageBox.confirm(
    `确定要审批发放选中的 ${selectedRows.value.length} 条工资记录吗？`,
    '审批确认',
    { type: 'warning' }
  ).then(async () => {
    try {
      await approveSalary(selectedRows.value.map((row) => row.id))
      ElMessage.success('审批通过，等待发放')
      loadData()
    } catch (error) {
      console.error('审批失败:', error)
    }
  })
}

// 调薪管理
function handleAdjust() {
  ElMessage.info('跳转到调薪管理页面...')
}

// 导出
function handleExport() {
  ElMessage.success('正在导出工资表...')
}

// 打印工资条
function handlePrint() {
  window.print()
}

// 查看详情
function handleView(row) {
  detailData.value = {
    ...row,
    incomeItems: [
      { item: '基本工资', amount: row.baseSalary, remark: '标准基本工资' },
      { item: '绩效工资', amount: row.performanceSalary, remark: `${row.salaryMonth}月度绩效` },
      { item: '交通补贴', amount: 800, remark: '每月固定' },
      { item: '餐补', amount: 500, remark: '每月固定' },
      { item: '通讯补贴', amount: 200, remark: '每月固定' },
      { item: '加班费', amount: row.overtimePay || 0, remark: '工作日及周末加班' },
    ],
    deductionItems: [
      { item: '养老保险(个人)', amount: row.pension || 800, remark: '基数8%' },
      { item: '医疗保险(个人)', amount: row.medical || 200, remark: '基数2%' },
      { item: '失业保险(个人)', amount: row.unemployment || 50, remark: '基数0.5%' },
      { item: '住房公积金', amount: row.housingFund || 1600, remark: '基数12%' },
      { item: '个人所得税', amount: row.tax, remark: '累计预扣法' },
    ],
    totalDeduction: (row.pension || 800) + (row.medical || 200) + (row.unemployment || 50) + (row.housingFund || 1600) + row.tax,
  }
  detailVisible.value = true
}

// 确认
function handleConfirm(row) {
  ElMessageBox.confirm(`确定确认 ${row.employeeName} 的工资数据吗？`, '确认提示', {
    type: 'info',
  }).then(() => {
    ElMessage.success('已确认')
    loadData()
  })
}

// 编辑
function handleEdit(row) {
  ElMessage.info('打开编辑页面...')
}

// 工资条
function handleSlip(row) {
  slipData.value = {
    ...row,
    createTime: new Date().toLocaleString(),
  }
  slipVisible.value = true
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}
.mb-4 {
  margin-bottom: 16px;
}
.mt-2 {
  margin-top: 8px;
}
.mt-4 {
  margin-top: 16px;
}
.text-center {
  text-align: center;
}

.stat-card {
  border-left: 4px solid #409EFF;
}
.stat-card:nth-child(2) {
  border-left-color: #67C23A;
}
.stat-card:nth-child(3) {
  border-left-color: #E6A23C;
}
.stat-card:nth-child(4) {
  border-left-color: #F56C6C;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.money {
  font-family: 'Courier New', monospace;
  font-weight: 500;
}
.money.primary {
  color: #409eff;
}
.money.success {
  color: #67c23a;
}
.money.danger {
  color: #f56c6c;
}

.summary-section {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  margin-top: 16px;
}

/* 工资条样式 */
.salary-slip {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: linear-gradient(to bottom, #fafafa, #fff);
}

.slip-header {
  text-align: center;
  border-bottom: 2px solid #409eff;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.slip-header h2 {
  margin: 0;
  color: #303133;
  font-size: 20px;
}

.slip-header p {
  margin: 5px 0 0;
  color: #909399;
  font-size: 14px;
}

.slip-info p {
  margin: 5px 0;
  color: #606266;
  font-size: 13px;
}

.slip-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed #ebeef5;
}

.slip-row .label {
  color: #606266;
  font-size: 14px;
}

.slip-row .value {
  color: #303133;
  font-weight: 500;
  font-family: 'Courier New', monospace;
  font-size: 14px;
}

.slip-row.total .value {
  color: #409eff;
  font-weight: bold;
  font-size: 16px;
}

.slip-row.deduct .value {
  color: #f56c6c;
}

.slip-row.other-deduct .value {
  color: #e6a23c;
}

.slip-row.net-total {
  border-bottom: none;
  border-top: 2px solid #67c23a;
  padding-top: 12px;
  margin-top: 8px;
}

.slip-row.net-total .label {
  font-weight: bold;
  font-size: 16px;
}

.slip-row.net-total .net {
  color: #67c23a;
  font-weight: bold;
  font-size: 22px;
}

.slip-footer {
  text-align: center;
  color: #909399;
  font-size: 12px;
  line-height: 1.6;
  border-top: 1px solid #ebeef5;
  padding-top: 10px;
}
</style>
