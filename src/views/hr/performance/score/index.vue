<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalCount }}</div>
              <div class="stat-label">总评分数</div>
            </div>
            <el-icon :size="40" color="#409EFF"><DataAnalysis /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value" style="color: #67C23A">{{ statistics.avgScore }}</div>
              <div class="stat-label">平均分</div>
            </div>
            <el-icon :size="40" color="#67C23A"><TrendCharts /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value" style="color: #E6A23C">{{ statistics.excellentRate }}%</div>
              <div class="stat-label">优秀率(≥90)</div>
            </div>
            <el-icon :size="40" color="#E6A23C"><Trophy /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value" style="color: #F56C6C">{{ statistics.failRate }}%</div>
              <div class="stat-label">不及格率(<60)</div>
            </div>
            <el-icon :size="40" color="#F56C6C"><Warning /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />

    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">录入评分</el-button>
        <el-button type="success" :icon="Download" plain @click="handleExport">导出数据</el-button>
        <el-button type="warning" :icon="PieChart" plain @click="handleChart">趋势分析</el-button>
        <el-button type="info" :icon="Printer" plain @click="handlePrint">打印报告</el-button>
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
      <!-- 等级列 -->
      <template #grade="{ row }">
        <el-tag
          :type="getGradeType(row.grade)"
          effect="dark"
          size="large"
        >
          {{ row.grade }}
        </el-tag>
      </template>

      <!-- 总分列 -->
      <template #totalScore="{ row }">
        <div class="score-display">
          <span :class="getScoreClass(row.totalScore)">{{ row.totalScore }}</span>
          <el-rate
            :model-value="Math.round(row.totalScore / 20)"
            disabled
            show-score
            text-color="#ff9900"
            score-template="{value}星"
            size="small"
          />
        </div>
      </template>

      <!-- 操作列 -->
      <template #action="{ row }">
        <MoreActions :items="rowActions(row)" :max="3" />
      </template>
    </BaseTable>

    <!-- 录入评分对话框 -->
    <BaseDialog v-model="dialogVisible" title="录入绩效评分" width="900px" @confirm="handleSubmit">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="员工姓名" prop="employeeId">
              <el-select v-model="formData.employeeId" filterable placeholder="请选择员工" style="width: 100%">
                <el-option
                  v-for="emp in employeeList"
                  :key="emp.id"
                  :label="`${emp.name} - ${emp.deptName}`"
                  :value="emp.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="考核周期" prop="period">
              <el-date-picker
                v-model="formData.period"
                type="monthrange"
                range-separator="至"
                start-placeholder="开始月份"
                end-placeholder="结束月份"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="考核类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择类型" style="width: 100%">
                <el-option label="月度考核" value="月度" />
                <el-option label="季度考核" value="季度" />
                <el-option label="年度考核" value="年度" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="评分人" prop="scorer">
              <el-input v-model="formData.scorer" placeholder="请输入评分人" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">评分明细</el-divider>

        <el-table :data="formData.scoreItems" border size="small">
          <el-table-column prop="category" label="维度" width="100" fixed />
          <el-table-column prop="name" label="指标名称" min-width="150" />
          <el-table-column prop="weight" label="权重(%)" width="80" align="center" />
          <el-table-column prop="fullScore" label="满分" width="70" align="center" />
          <el-table-column label="得分" width="130">
            <template #default="{ row }">
              <el-input-number
                v-model="row.score"
                :min="0"
                :max="row.fullScore"
                :precision="1"
                size="small"
                controls-position="right"
                style="width: 100%"
                @change="calculateTotal"
              />
            </template>
          </el-table-column>
          <el-table-column label="得分率" width="80" align="center">
            <template #default="{ row }">
              <span :class="getRateClass((row.score / row.fullScore) * 100)">
                {{ ((row.score / row.fullScore) * 100).toFixed(1) }}%
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="comment" label="评价说明" min-width="180">
            <template #default="{ row }">
              <el-input v-model="row.comment" size="small" placeholder="输入评价" />
            </template>
          </el-table-column>
        </el-table>

        <el-divider content-position="left">汇总信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="总分">{{ calculatedTotal.toFixed(1) }}</el-descriptions-item>
            </el-descriptions>
          </el-col>
          <el-col :span="8">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="等级">
                <el-tag :type="getGradeType(calculatedGrade)" effect="dark">
                  {{ calculatedGrade }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
          <el-col :span="8">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="星级评定">
                <el-rate
                  :model-value="calculatedStars"
                  disabled
                  show-score
                  text-color="#ff9900"
                  score-template="{value}星"
                />
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>

        <el-form-item label="综合评语" class="mt-4">
          <el-input v-model="formData.overallComment" type="textarea" :rows="3" placeholder="请输入综合评语和改进建议" />
        </el-form-item>

        <el-form-item label="改进计划">
          <el-input v-model="formData.improvementPlan" type="textarea" :rows="2" placeholder="请输入改进计划和目标" />
        </el-form-item>
      </el-form>
    </BaseDialog>

    <!-- 详情对话框 -->
    <BaseDialog v-model="detailVisible" title="评分详情" width="950px" :show-footer="false">
      <el-descriptions :column="2" border class="mb-4">
        <el-descriptions-item label="员工姓名">{{ detailData.employeeName }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ detailData.deptName }}</el-descriptions-item>
        <el-descriptions-item label="岗位">{{ detailData.position }}</el-descriptions-item>
        <el-descriptions-item label="入职日期">{{ detailData.entryDate }}</el-descriptions-item>
        <el-descriptions-item label="考核类型">{{ detailData.type }}</el-descriptions-item>
        <el-descriptions-item label="考核周期">{{ detailData.period }}</el-descriptions-item>
        <slot name="grade">{{
          detailData.grade }}</slot>
        <el-descriptions-item label="总分">
          <span :class="getScoreClass(detailData.totalScore)">{{ detailData.totalScore }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="排名">{{ detailData.rank }}</el-descriptions-item>
        <el-descriptions-item label="评分时间">{{ detailData.scoreTime }}</el-descriptions-item>
        <el-descriptions-item label="评分人">{{ detailData.scorer }}</el-descriptions-item>
      </el-descriptions>

      <h4 class="mt-4 mb-2">各维度得分详情</h4>
      <el-table :data="detailData.scoreItems || []" border size="small">
        <el-table-column prop="category" label="维度" width="100" />
        <el-table-column prop="name" label="指标名称" min-width="150" />
        <el-table-column prop="weight" label="权重(%)" width="80" align="center" />
        <el-table-column prop="fullScore" label="满分" width="70" align="center" />
        <el-table-column prop="score" label="得分" width="80" align="center">
          <template #default="{ row }">
            <span :class="getScoreClass(row.score)">{{ row.score }}</span>
          </template>
        </el-table-column>
        <el-table-column label="得分率" width="90" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.round((row.score / row.fullScore) * 100)"
              :stroke-width="10"
              :color="getProgressColor((row.score / row.fullScore) * 100)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="comment" label="评价说明" showOverflowTooltip />
      </el-table>

      <h4 class="mt-4 mb-2">综合评价</h4>
      <el-card shadow="never">
        <p><strong>综合评语：</strong>{{ detailData.overallComment }}</p>
        <p><strong>改进计划：</strong>{{ detailData.improvementPlan }}</p>
      </el-card>
    </BaseDialog>

    <!-- 历史记录对话框 -->
    <BaseDialog v-model="historyVisible" title="历史评分记录" width="1100px" :show-footer="false">
      <div class="history-header mb-4">
        <el-alert
          :title="`${historyEmployee.name} (${historyEmployee.deptName}) 的绩效评分历史`"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <p>当前平均分：<strong>{{ historyEmployee.avgScore }}</strong> | 最高分：<strong>{{ historyEmployee.maxScore }}</strong> | 最低分：<strong>{{ historyEmployee.minScore }}</strong></p>
          </template>
        </el-alert>
      </div>

      <el-table :data="historyList" border size="small">
        <el-table-column prop="period" label="考核周期" width="140" />
        <el-table-column prop="type" label="类型" width="100" />
        <slot name="grade">{{
          historyList.grade }}</slot>
        <el-table-column prop="totalScore" label="总分" width="80" align="center">
          <template #default="{ row }">
            <span :class="getScoreClass(row.totalScore)">{{ row.totalScore }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="rank" label="排名" width="70" align="center" />
        <el-table-column prop="trend" label="趋势" width="80" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.trend === 'up'" color="#67C23A"><Top /></el-icon>
            <el-icon v-else-if="row.trend === 'down'" color="#F56C6C"><Bottom /></el-icon>
            <el-icon v-else color="#909399"><Minus /></el-icon>
            <span class="ml-1">{{ row.changeValue }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="scorer" label="评分人" width="100" />
        <el-table-column prop="scoreTime" label="评分时间" width="170" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewHistoryDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
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
  Download,
  PieChart,
  Printer,
  DataAnalysis,
  TrendCharts,
  Trophy,
  Warning,
  Top,
  Bottom,
  Minus,
} from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import MoreActions from '@/components/MoreActions.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import { getScoreRecordList, saveScoreRecord, deleteScoreRecord } from '@/api/hr'

// 每行操作按钮配置
function rowActions(row) {
  return [
    { label: '详情', type: 'primary', important: true, onClick: () => handleViewDetail(row) },
    { label: '历史', type: 'warning', important: true, onClick: () => handleHistory(row) },
    { label: '修改', type: 'primary', important: true, onClick: () => handleEdit(row) },
    { label: '删除', type: 'danger', onClick: () => handleDeleteWithConfirm(row) }
  ]
}
function handleDeleteWithConfirm(row) {
  ElMessageBox.confirm('确定删除该评分记录吗？', '提示', { type: 'warning' })
    .then(() => handleDelete(row.id))
    .catch(() => {})
}

// 搜索项配置
const searchItems = [
  {
    prop: 'keyword',
    label: '关键词',
    type: 'input',
    placeholder: '搜索员工/部门',
  },
  {
    prop: 'type',
    label: '考核类型',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '月度', value: '月度' },
      { label: '季度', value: '季度' },
      { label: '年度', value: '年度' },
    ],
  },
  {
    prop: 'grade',
    label: '等级',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: 'S (卓越)', value: 'S' },
      { label: 'A (优秀)', value: 'A' },
      { label: 'B (良好)', value: 'B' },
      { label: 'C (合格)', value: 'C' },
      { label: 'D (需改进)', value: 'D' },
    ],
  },
  {
    prop: 'dateRange',
    label: '评分日期',
    type: 'daterange',
    startPlaceholder: '开始日期',
    endPlaceholder: '结束日期',
  },
]

// 表格列配置
const columns = [
  { type: 'selection', width: 50, fixed: 'left' },
  { prop: 'employeeNo', label: '工号', width: 120, fixed: 'left' },
  { prop: 'employeeName', label: '员工姓名', width: 100, fixed: 'left' },
  { prop: 'deptName', label: '部门', width: 100 },
  { prop: 'position', label: '岗位', width: 100 },
  { slot: 'grade', label: '等级', width: 80, align: 'center' },
  { slot: 'totalScore', label: '总分', width: 160, align: 'center' },
  { prop: 'type', label: '考核类型', width: 90 },
  { prop: 'period', label: '考核周期', width: 140 },
  { prop: 'rank', label: '排名', width: 70, align: 'center' },
  { prop: 'scorer', label: '评分人', width: 100 },
  { prop: 'scoreTime', label: '评分时间', width: 170 },
  { slot: 'action', label: '操作', width: 200, fixed: 'right' },
]

// 统计数据
const statistics = reactive({
  totalCount: 1286,
  avgScore: 82.5,
  excellentRate: 35.2,
  failRate: 5.8,
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
const formRef = ref(null)
const formData = reactive({
  id: null,
  employeeId: '',
  period: [],
  type: '季度',
  scorer: '',
  overallComment: '',
  improvementPlan: '',
  scoreItems: [
    { category: '业绩', name: '工作目标达成', weight: 30, fullScore: 30, score: 0, comment: '' },
    { category: '业绩', name: '工作质量', weight: 15, fullScore: 15, score: 0, comment: '' },
    { category: '能力', name: '专业技能', weight: 15, fullScore: 15, score: 0, comment: '' },
    { category: '能力', name: '问题解决能力', weight: 10, fullScore: 10, score: 0, comment: '' },
    { category: '态度', name: '责任心', weight: 10, fullScore: 10, score: 0, comment: '' },
    { category: '态度', name: '团队合作', weight: 10, fullScore: 10, score: 0, comment: '' },
    { category: '态度', name: '积极主动性', weight: 10, fullScore: 10, score: 0, comment: '' },
  ],
})

// 详情
const detailVisible = ref(false)
const detailData = ref({})

// 历史记录
const historyVisible = ref(false)
const historyEmployee = ref({})
const historyList = ref([])

// 员工列表（模拟）
const employeeList = ref([
  { id: 1, name: '张三', deptName: '技术部' },
  { id: 2, name: '李四', deptName: '销售部' },
  { id: 3, name: '王五', deptName: '财务部' },
])

// 计算总分
const calculatedTotal = computed(() => {
  return formData.scoreItems.reduce((sum, item) => sum + (item.score || 0), 0)
})

// 计算等级
const calculatedGrade = computed(() => {
  const total = calculatedTotal.value
  if (total >= 95) return 'S'
  if (total >= 85) return 'A'
  if (total >= 75) return 'B'
  if (total >= 60) return 'C'
  return 'D'
})

// 计算星级
const calculatedStars = computed(() => {
  const total = calculatedTotal.value
  if (total >= 95) return 5
  if (total >= 85) return 4
  if (total >= 75) return 3
  if (total >= 60) return 2
  return 1
})

// 表单验证规则
const formRules = {
  employeeId: [{ required: true, message: '请选择员工', trigger: 'change' }],
  type: [{ required: true, message: '请选择考核类型', trigger: 'change' }],
}

// 获取等级样式
function getGradeType(grade) {
  const map = {
    'S': 'danger',
    'A': 'success',
    'B': 'primary',
    'C': 'warning',
    'D': 'info',
  }
  return map[grade] || 'info'
}

// 获取分数样式类
function getScoreClass(score) {
  if (score >= 90) return 'score-excellent'
  if (score >= 80) return 'score-good'
  if (score >= 70) return 'score-average'
  if (score >= 60) return 'score-pass'
  return 'score-fail'
}

// 获取得分率样式
function getRateClass(rate) {
  if (rate >= 90) return 'rate-excellent'
  if (rate >= 80) return 'rate-good'
  if (rate >= 70) return 'rate-average'
  if (rate >= 60) return 'rate-pass'
  return 'rate-fail'
}

// 获取进度条颜色
function getProgressColor(percentage) {
  if (percentage >= 90) return '#67c23a'
  if (percentage >= 80) return '#409eff'
  if (percentage >= 70) return '#e6a23c'
  if (percentage >= 60) return '#f56c6c'
  return '#f56c6c'
}

// 计算总分
function calculateTotal() {
  // 触发计算属性更新
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
    const res = await getScoreRecordList(params)
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0

    // 更新统计数据
    Object.assign(statistics, res.data.statistics || {})
  } catch (error) {
    console.error('加载数据失败:', error)
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

// 新增
function handleAdd() {
  resetForm()
  dialogVisible.value = true
}

// 编辑
function handleEdit(row) {
  Object.assign(formData, {
    ...row,
    scoreItems: row.scoreItems || formData.scoreItems,
  })
  dialogVisible.value = true
}

// 查看详情
function handleViewDetail(row) {
  detailData.value = {
    ...row,
    scoreItems: [
      { category: '业绩', name: '工作目标达成', weight: 30, fullScore: 30, score: 28, comment: '超额完成' },
      { category: '业绩', name: '工作质量', weight: 15, fullScore: 15, score: 14, comment: '质量优异' },
      { category: '能力', name: '专业技能', weight: 15, fullScore: 15, score: 13.5, comment: '技能扎实' },
      { category: '能力', name: '问题解决能力', weight: 10, fullScore: 10, score: 9, comment: '能力强' },
      { category: '态度', name: '责任心', weight: 10, fullScore: 10, score: 9.5, comment: '责任心强' },
      { category: '态度', name: '团队合作', weight: 10, fullScore: 10, score: 9, comment: '团队协作好' },
      { category: '态度', name: '积极主动性', weight: 10, fullScore: 10, score: 8.5, comment: '较积极' },
    ],
    overallComment: '该员工本季度表现优秀，工作目标达成率高，专业技能突出。建议继续保持并加强跨部门沟通。',
    improvementPlan: '1. 提升项目管理能力\n2. 加强技术分享和指导新人\n3. 深入业务理解',
  }
  detailVisible.value = true
}

// 历史记录
function handleHistory(row) {
  historyEmployee.value = {
    name: row.employeeName,
    deptName: row.deptName,
    avgScore: '82.3',
    maxScore: '92',
    minScore: '71',
  }

  historyList.value = [
    { period: '2026 Q1', type: '季度', grade: 'A', totalScore: 88, rank: 5, trend: 'up', changeValue: '+3', scorer: '赵六', scoreTime: '2026-04-05 14:30' },
    { period: '2025 Q4', type: '季度', grade: 'A', totalScore: 85, rank: 8, trend: 'up', changeValue: '+2', scorer: '赵六', scoreTime: '2026-01-08 11:20' },
    { period: '2025 Q3', type: '季度', grade: 'B', totalScore: 83, rank: 12, trend: 'down', changeValue: '-1', scorer: '赵六', scoreTime: '2025-10-06 09:45' },
    { period: '2025 Q2', type: '季度', grade: 'B', totalScore: 84, rank: 10, trend: 'up', changeValue: '+5', scorer: '赵六', scoreTime: '2025-07-03 16:00' },
    { period: '2025 Q1', type: '季度', grade: 'C', totalScore: 79, rank: 18, trend: '', changeValue: '-', scorer: '赵六', scoreTime: '2025-04-02 10:15' },
  ]

  historyVisible.value = true
}

// 查看历史详情
function viewHistoryDetail(row) {
  handleViewDetail({ ...row, employeeName: historyEmployee.value.name })
}

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await saveScoreRecord({
          ...formData,
          totalScore: calculatedTotal.value,
          grade: calculatedGrade.value,
        })
        ElMessage.success('评分保存成功')
        dialogVisible.value = false
        loadData()
      } catch (error) {
        console.error('保存失败:', error)
      }
    }
  })
}

// 重置表单
function resetForm() {
  Object.assign(formData, {
    id: null,
    employeeId: '',
    period: [],
    type: '季度',
    scorer: '',
    overallComment: '',
    improvementPlan: '',
    scoreItems: [
      { category: '业绩', name: '工作目标达成', weight: 30, fullScore: 30, score: 0, comment: '' },
      { category: '业绩', name: '工作质量', weight: 15, fullScore: 15, score: 0, comment: '' },
      { category: '能力', name: '专业技能', weight: 15, fullScore: 15, score: 0, comment: '' },
      { category: '能力', name: '问题解决能力', weight: 10, fullScore: 10, score: 0, comment: '' },
      { category: '态度', name: '责任心', weight: 10, fullScore: 10, score: 0, comment: '' },
      { category: '态度', name: '团队合作', weight: 10, fullScore: 10, score: 0, comment: '' },
      { category: '态度', name: '积极主动性', weight: 10, fullScore: 10, score: 0, comment: '' },
    ],
  })
}

// 删除
async function handleDelete(id) {
  try {
    await deleteScoreRecord(id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    console.error('删除失败:', error)
  }
}

// 导出
function handleExport() {
  ElMessage.success('正在导出数据...')
}

// 趋势分析
function handleChart() {
  ElMessage.info('趋势图表功能开发中...')
}

// 打印
function handlePrint() {
  window.print()
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
.mb-2 {
  margin-bottom: 8px;
}
.mt-4 {
  margin-top: 16px;
}
.ml-1 {
  margin-left: 4px;
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
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.score-excellent {
  color: #67c23a;
  font-weight: bold;
  font-size: 18px;
}
.score-good {
  color: #409eff;
  font-weight: bold;
  font-size: 16px;
}
.score-average {
  color: #e6a23c;
  font-weight: bold;
}
.score-pass {
  color: #f56c6c;
  font-weight: bold;
}
.score-fail {
  color: #f56c6c;
  font-weight: bold;
  font-size: 18px;
}

.rate-excellent {
  color: #67c23a;
  font-weight: bold;
}
.rate-good {
  color: #409eff;
  font-weight: bold;
}
.rate-average {
  color: #e6a23c;
  font-weight: bold;
}
.rate-pass {
  color: #f56c6c;
  font-weight: bold;
}
.rate-fail {
  color: #f56c6c;
  font-weight: bold;
}
</style>
