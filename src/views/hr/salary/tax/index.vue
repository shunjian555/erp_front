<template>
  <div class="page-container">
    <!-- 税率表卡片 -->
    <el-card shadow="never" class="mb-4">
      <template #header>
        <div class="card-header">
          <span>个人所得税税率表（综合所得适用）</span>
          <el-button type="primary" size="small" :icon="Edit" @click="handleEditTaxRate">编辑税率</el-button>
        </div>
      </template>
      <el-table :data="taxRates" border size="small">
        <el-table-column prop="level" label="级数" width="70" align="center" />
        <el-table-column prop="range" label="全年应纳税所得额" min-width="250" />
        <el-table-column prop="rate" label="税率(%)" width="90" align="center">
          <template #default="{ row }">
            <span class="tax-rate">{{ row.rate }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="deduction" label="速算扣除数(元)" width="140" align="right">
          <template #default="{ row }">
            {{ row.deduction.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="example" label="示例说明" min-width="200" showOverflowTooltip />
      </el-table>

      <el-alert
        title="计算公式：应纳税额 = (税前收入 - 5000元起征点 - 专项扣除 - 专项附加扣除) × 适用税率 - 速算扣除数"
        type="info"
        :closable="false"
        show-icon
        class="mt-4"
      />
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card tax-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalTax }}</div>
              <div class="stat-label">本月个税总额</div>
            </div>
            <el-icon :size="40" color="#F56C6C"><Wallet /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value" style="color: #409EFF">{{ statistics.avgTax }}</div>
              <div class="stat-label">人均个税</div>
            </div>
            <el-icon :size="40" color="#409EFF"><DataAnalysis /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value" style="color: #67C23A">{{ statistics.taxpayers }}</div>
              <div class="stat-label">纳税人数</div>
            </div>
            <el-icon :size="40" color="#67C23A"><UserFilled /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value" style="color: #E6A23C">{{ statistics.maxTaxRate }}%</div>
              <div class="stat-label">最高适用税率</div>
            </div>
            <el-icon :size="40" color="#E6A23C"><TrendCharts /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />

    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增申报</el-button>
        <el-button type="success" :icon="Check" plain @click="handleBatchDeclare">批量申报</el-button>
        <el-button type="warning" :icon="DocumentCopy" plain @click="handleExport">导出报表</el-button>
        <el-button type="info" :icon="Download" plain @click="handleDownloadTemplate">下载模板</el-button>
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
      <!-- 税前收入列 -->
      <template #grossIncome="{ row }">
        <span class="money">￥{{ row.grossIncome.toLocaleString() }}</span>
      </template>

      <!-- 累计收入列 -->
      <template #cumulativeIncome="{ row }">
        <span class="money primary">￥{{ row.cumulativeIncome.toLocaleString() }}</span>
      </template>

      <!-- 应纳税所得额列 -->
      <template #taxableIncome="{ row }">
        <span class="money warning">￥{{ row.taxableIncome.toLocaleString() }}</span>
      </template>

      <!-- 适用税率列 -->
      <template #taxRate="{ row }">
        <el-tag :type="getRateTagType(row.taxRate)">{{ row.taxRate }}%</el-tag>
      </template>

      <!-- 应纳税额列 -->
      <template #taxAmount="{ row }">
        <strong class="money danger">￥{{ row.taxAmount.toLocaleString() }}</strong>
      </template>

      <!-- 已缴税额列 -->
      <template #paidTax="{ row }">
        <span class="money success">￥{{ row.paidTax.toLocaleString() }}</span>
      </template>

      <!-- 本期应补/退税额列 -->
      <template #balance="{ row }">
        <span v-if="row.balance > 0" class="money danger">+￥{{ row.balance.toLocaleString() }}</span>
        <span v-else-if="row.balance < 0" class="money success">-￥{{ Math.abs(row.balance).toLocaleString() }}</span>
        <span v-else>￥0.00</span>
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

    <!-- 新增/编辑对话框 -->
    <BaseDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="900px"
      @confirm="handleSubmit"
      @cancel="handleCancel"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="140px">
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="员工姓名" prop="employeeId">
              <el-select v-model="formData.employeeId" filterable placeholder="请选择员工" style="width: 100%">
                <el-option
                  v-for="emp in employeeList"
                  :key="emp.id"
                  :label="`${emp.name} (${emp.deptName})`"
                  :value="emp.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申报月份" prop="month">
              <el-date-picker
                v-model="formData.month"
                type="month"
                placeholder="选择月份"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">收入信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="本期收入" prop="grossIncome">
              <el-input-number v-model="formData.grossIncome" :precision="2" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="累计收入">
              <el-input-number v-model="formData.cumulativeIncome" :precision="2" :min="0" style="width: 100%" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">扣除项目</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="基本减除费用(起征点)">
              <el-input-number v-model="formData.basicDeduction" :precision="2" :min="0" style="width: 100%" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专项扣除(社保公积金)">
              <el-input-number v-model="formData.specialDeduction" :precision="2" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">专项附加扣除</el-divider>
        <el-table :data="formData.additionalDeductions" border size="small" style="width: 100%">
          <el-table-column prop="name" label="扣除项目" min-width="150" />
          <el-table-column prop="amount" label="扣除金额(元)" width="180">
            <template #default="{ row }">
              <el-input-number v-model="row.amount" :precision="2" :min="0" size="small" controls-position="right" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注">
            <template #default="{ row }">
              <el-input v-model="row.remark" size="small" placeholder="备注信息" />
            </template>
          </el-table-column>
        </el-table>

        <el-divider content-position="left">计算结果（自动计算）</el-divider>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="累计应纳税所得额">
            <strong>{{ calculatedTaxableIncome }}</strong>
          </el-descriptions-item>
          <el-descriptions-item label="适用税率">
            <el-tag :type="getRateTagType(calculatedRate)">{{ calculatedRate }}%</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="速算扣除数">
            {{ calculatedQuickDeduction }}
          </el-descriptions-item>
          <el-descriptions-item label="累计应纳税额">
            <span class="money danger">￥{{ calculatedTotalTax }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="已缴税额">
            <span class="money success">￥{{ formData.paidTax || 0 }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="本期应补/退">
            <strong :class="calculatedBalance >= 0 ? 'text-danger' : 'text-success'">
              {{ calculatedBalance >= 0 ? '+' : '' }}￥{{ calculatedBalance }}
            </strong>
          </el-descriptions-item>
        </el-descriptions>
      </el-form>
    </BaseDialog>

    <!-- 详情对话框 -->
    <BaseDialog v-model="detailVisible" title="个税申报详情" width="950px" :show-footer="false">
      <el-descriptions :column="2" border class="mb-4">
        <el-descriptions-item label="员工姓名">{{ detailData.employeeName }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ detailData.deptName }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ detailData.idCard }}</el-descriptions-item>
        <el-descriptions-item label="申报月份">{{ detailData.month }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detailData.status)">{{ detailData.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申报时间">{{ detailData.declareTime }}</el-descriptions-item>
      </el-descriptions>

      <h4 class="mt-4 mb-2">收入明细</h4>
      <el-table :data="detailData.incomeDetails || []" border size="small" class="mb-4">
        <el-table-column prop="item" label="项目" min-width="150" />
        <el-table-column prop="amount" label="金额(元)" align="right">
          <template #default="{ row }">
            <span class="money">￥{{ row.amount.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="说明" showOverflowTooltip />
      </el-table>

      <h4 class="mt-2 mb-2">扣除明细</h4>
      <el-table :data="detailData.deductionDetails || []" border size="small" class="mb-4">
        <el-table-column prop="item" label="扣除项目" min-width="150" />
        <el-table-column prop="amount" label="金额(元)" align="right">
          <template #default="{ row }">
            <span class="money warning">-￥{{ row.amount.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="basis" label="扣除依据" showOverflowTooltip />
      </el-table>

      <h4 class="mt-2 mb-2">税额计算过程</h4>
      <el-steps :active="5" finish-status="process" simple class="mb-4">
        <el-step title="本期收入" :description="'￥' + detailData.grossIncome?.toLocaleString()" />
        <el-step title="累计收入" :description="'￥' + detailData.cumulativeIncome?.toLocaleString()" />
        <el-step title="应纳税所得额" :description="'￥' + detailData.taxableIncome?.toLocaleString()" />
        <el-step title="适用税率" :description="detailData.taxRate + '%'" />
        <el-step title="应纳税额" :description="'￥' + detailData.taxAmount?.toLocaleString()" />
      </el-steps>
    </BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Delete,
  Refresh,
  Check,
  Edit,
  DocumentCopy,
  Download,
  Wallet,
  DataAnalysis,
  UserFilled,
  TrendCharts,
} from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import MoreActions from '@/components/MoreActions.vue'

// 每行操作按钮配置
function rowActions(row) {
  return [
    { label: '详情', type: 'primary', important: true, onClick: () => handleView(row) },
    { label: '重算', type: 'warning', important: true, onClick: () => handleCalculate(row) },
    { label: '申报', type: 'success', important: true, hidden: row.status !== '待申报', onClick: () => handleDeclare(row) },
    { label: '删除', type: 'danger', onClick: () => handleDeleteWithConfirm(row) }
  ]
}
function handleDeleteWithConfirm(row) {
  ElMessageBox.confirm('确定删除该记录吗？', '提示', { type: 'warning' })
    .then(() => handleDelete(row.id))
    .catch(() => {})
}
import BaseDialog from '@/components/BaseDialog.vue'
import { getTaxRecordList, saveTaxRecord, deleteTaxRecord, declareTax } from '@/api/hr'

// 税率表数据
const taxRates = ref([
  { level: 1, range: '不超过36,000元的部分', rate: 3, deduction: 0, example: '月收入≤8000元左右免征或极低税负' },
  { level: 2, range: '超过36,000元至144,000元的部分', rate: 10, deduction: 2520, example: '月收入8000-17000元区间' },
  { level: 3, range: '超过144,000元至300,000元的部分', rate: 20, deduction: 16920, example: '月收入17000-30000元区间' },
  { level: 4, range: '超过300,000元至420,000元的部分', rate: 25, deduction: 31920, example: '月收入30000-40000元区间' },
  { level: 5, range: '超过420,000元至660,000元的部分', rate: 30, deduction: 52920, example: '月收入40000-60000元区间' },
  { level: 6, range: '超过660,000元至960,000元的部分', rate: 35, deduction: 85920, example: '月收入60000-85000元区间' },
  { level: 7, range: '超过960,000元的部分', rate: 45, deduction: 181920, example: '月收入85000元以上高收入群体' },
])

// 搜索项配置
const searchItems = [
  {
    prop: 'keyword',
    label: '关键词',
    type: 'input',
    placeholder: '搜索员工姓名/工号',
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
      { label: '管理岗', value: '管理岗' },
    ],
  },
  {
    prop: 'month',
    label: '申报月份',
    type: 'month',
    placeholder: '选择月份',
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '待申报', value: '待申报' },
      { label: '已申报', value: '已申报' },
      { label: '已完成', value: '已完成' },
    ],
  },
]

// 表格列配置
const columns = [
  { type: 'selection', width: 50, fixed: 'left' },
  { prop: 'employeeNo', label: '工号', width: 120, fixed: 'left' },
  { prop: 'employeeName', label: '员工姓名', width: 100, fixed: 'left' },
  { prop: 'deptName', label: '部门', width: 100 },
  { slot: 'grossIncome', label: '本期收入', width: 130, align: 'right' },
  { slot: 'cumulativeIncome', label: '累计收入', width: 140, align: 'right' },
  { slot: 'taxableIncome', label: '应纳税所得额', width: 150, align: 'right' },
  { slot: 'taxRate', label: '适用税率', width: 100, align: 'center' },
  { slot: 'taxAmount', label: '应纳税额', width: 120, align: 'right' },
  { slot: 'paidTax', label: '已缴税额', width: 120, align: 'right' },
  { slot: 'balance', label: '本期应补/退', width: 130, align: 'right' },
  { slot: 'status', label: '状态', width: 90 },
  { prop: 'declareTime', label: '申报时间', width: 170 },
  { slot: 'action', label: '操作', width: 220, fixed: 'right' },
]

// 统计数据
const statistics = reactive({
  totalTax: '¥186,520.00',
  avgTax: '¥1,110.24',
  taxpayers: '168',
  maxTaxRate: '25',
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

// 对话框状态
const dialogVisible = ref(false)
const dialogTitle = ref('新增个税申报')
const formRef = ref(null)
const formData = reactive({
  id: null,
  employeeId: '',
  month: new Date(),
  grossIncome: 0,
  cumulativeIncome: 0,
  basicDeduction: 5000,
  specialDeduction: 2650,
  paidTax: 0,
  additionalDeductions: [
    { name: '子女教育', amount: 0, remark: '每个子女1000元/月' },
    { name: '继续教育', amount: 0, remark: '学历教育400元/月，职业资格证书3600元/年' },
    { name: '大病医疗', amount: 0, remark: '超过15000元部分，最高80000元/年' },
    { name: '住房贷款利息', amount: 0, remark: '首套房贷款1000元/月' },
    { name: '住房租金', amount: 0, remark: '按城市等级800-1500元/月' },
    { name: '赡养老人', amount: 0, remark: '独生子女2000元/月，非独1000元/月' },
    { name: '婴幼儿照护', amount: 0, remark: '每孩1000元/月' },
  ],
})

// 详情
const detailVisible = ref(false)
const detailData = ref({})

// 员工列表（模拟）
const employeeList = ref([
  { id: 1, name: '张三', deptName: '技术部' },
  { id: 2, name: '李四', deptName: '销售部' },
  { id: 3, name: '王五', deptName: '财务部' },
])

// 计算属性：应纳税所得额
const calculatedTaxableIncome = computed(() => {
  const totalAdditional = formData.additionalDeductions.reduce((sum, item) => sum + (item.amount || 0), 0)
  return Math.max(0, (formData.cumulativeIncome || 0) - formData.basicDeduction * 12 - (formData.specialDeduction || 0) * 12 - totalAdditional * 12)
})

// 计算属性：适用税率
const calculatedRate = computed(() => {
  const income = calculatedTaxableIncome.value
  if (income <= 36000) return 3
  if (income <= 144000) return 10
  if (income <= 300000) return 20
  if (income <= 420000) return 25
  if (income <= 660000) return 30
  if (income <= 960000) return 35
  return 45
})

// 计算属性：速算扣除数
const calculatedQuickDeduction = computed(() => {
  const rate = calculatedRate.value
  const map = { 3: 0, 10: 2520, 20: 16920, 25: 31920, 30: 52920, 35: 85920, 45: 181920 }
  return map[rate] || 0
})

// 计算属性：累计应纳税额
const calculatedTotalTax = computed(() => {
  return Math.max(0, calculatedTaxableIncome.value * (calculatedRate.value / 100) - calculatedQuickDeduction.value)
})

// 计算属性：本期应补/退
const calculatedBalance = computed(() => {
  return Number((calculatedTotalTax.value - (formData.paidTax || 0)).toFixed(2))
})

// 表单验证规则
const formRules = {
  employeeId: [{ required: true, message: '请选择员工', trigger: 'change' }],
  month: [{ required: true, message: '请选择月份', trigger: 'change' }],
  grossIncome: [{ required: true, message: '请输入本期收入', trigger: 'blur' }],
}

// 获取税率标签类型
function getRateTagType(rate) {
  if (rate <= 3) return 'success'
  if (rate <= 10) return ''
  if (rate <= 20) return 'warning'
  if (rate <= 25) return 'warning'
  return 'danger'
}

// 获取状态类型
function getStatusType(status) {
  const map = {
    '待申报': 'warning',
    '已申报': 'primary',
    '已完成': 'success',
    '已作废': 'danger',
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
    const res = await getTaxRecordList(params)
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

// 编辑税率
function handleEditTaxRate() {
  ElMessage.info('税率由国家规定，不可随意修改')
}

// 新增
function handleAdd() {
  dialogTitle.value = '新增个税申报'
  resetForm()
  dialogVisible.value = true
}

// 查看详情
function handleView(row) {
  detailData.value = {
    ...row,
    incomeDetails: [
      { item: '基本工资', amount: row.baseSalary || 15000, remark: '标准基本工资' },
      { item: '绩效工资', amount: row.performanceSalary || 5000, remark: '月度绩效奖金' },
      { item: '各类补贴', amount: 2000, remark: '交通、餐补、通讯补贴' },
      { item: '加班费', amount: 1500, remark: '周末及节假日加班费' },
    ],
    deductionDetails: [
      { item: '基本减除费用', amount: 5000, basis: '每月固定5000元起征点' },
      { item: '养老保险(个人)', amount: 800, basis: '基数8%' },
      { item: '医疗保险(个人)', amount: 200, basis: '基数2%+3元' },
      { item: '失业保险(个人)', amount: 50, basis: '基数0.5%' },
      { item: '住房公积金', amount: 1600, basis: '基数12%' },
      { item: '子女教育', amount: 1000, basis: '1个子女，每月1000元' },
      { item: '住房贷款利息', amount: 1000, basis: '首套房贷款利息' },
    ],
  }
  detailVisible.value = true
}

// 重算
function handleCalculate(row) {
  ElMessage.success('正在重新计算...')
  setTimeout(() => {
    ElMessage.success('重新计算完成')
    loadData()
  }, 1000)
}

// 申报
function handleDeclare(row) {
  ElMessageBox.confirm(`确定要为 ${row.employeeName} 进行个税申报吗？`, '申报确认', {
    type: 'warning',
  }).then(async () => {
    try {
      await declareTax(row.id)
      ElMessage.success('申报成功')
      loadData()
    } catch (error) {
      console.error('申报失败:', error)
    }
  })
}

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await saveTaxRecord(formData)
        ElMessage.success('保存成功')
        dialogVisible.value = false
        loadData()
      } catch (error) {
        console.error('保存失败:', error)
      }
    }
  })
}

// 取消
function handleCancel() {
  dialogVisible.value = false
  resetForm()
}

// 重置表单
function resetForm() {
  Object.assign(formData, {
    id: null,
    employeeId: '',
    month: new Date(),
    grossIncome: 0,
    cumulativeIncome: 0,
    basicDeduction: 5000,
    specialDeduction: 2650,
    paidTax: 0,
    additionalDeductions: [
      { name: '子女教育', amount: 0, remark: '每个子女1000元/月' },
      { name: '继续教育', amount: 0, remark: '学历教育400元/月' },
      { name: '大病医疗', amount: 0, remark: '超过15000元部分' },
      { name: '住房贷款利息', amount: 0, remark: '首套房贷款1000元/月' },
      { name: '住房租金', amount: 0, remark: '按城市等级800-1500元/月' },
      { name: '赡养老人', amount: 0, remark: '独生子女2000元/月' },
      { name: '婴幼儿照护', amount: 0, remark: '每孩1000元/月' },
    ],
  })
}

// 删除
async function handleDelete(id) {
  try {
    await deleteTaxRecord(id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    console.error('删除失败:', error)
  }
}

// 批量申报
function handleBatchDeclare() {
  ElMessageBox.confirm(
    `确定批量申报选中的 ${selectedRows.value.length} 条记录吗？`,
    '批量申报确认',
    { type: 'warning' }
  ).then(() => {
    ElMessage.success(`已提交 ${selectedRows.value.length} 条申报记录`)
    loadData()
  })
}

// 导出
function handleExport() {
  ElMessage.success('正在导出个税报表...')
}

// 下载模板
function handleDownloadTemplate() {
  ElMessage.success('正在下载导入模板...')
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
.mb-2 {
  margin-bottom: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tax-rate {
  font-weight: bold;
  color: #f56c6c;
  font-size: 16px;
}

.stat-card {
  border-left: 4px solid #F56C6C;
}
.stat-card:nth-child(2) {
  border-left-color: #409EFF;
}
.stat-card:nth-child(3) {
  border-left-color: #67C23A;
}
.stat-card:nth-child(4) {
  border-left-color: #E6A23C;
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
.money.warning {
  color: #e6a23c;
}
.money.danger {
  color: #f56c6c;
}

.text-danger {
  color: #f56c6c;
  font-weight: bold;
}
.text-success {
  color: #67c23a;
  font-weight: bold;
}
</style>
