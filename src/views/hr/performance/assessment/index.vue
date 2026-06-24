<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />

    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">发起考核</el-button>
        <el-button type="success" :icon="Check" plain @click="handleBatchApprove" :disabled="!selectedRows.length">
          批量审批 ({{ selectedRows.length }})
        </el-button>
        <el-button type="warning" :icon="Edit" plain @click="handleBatchScore" :disabled="!selectedRows.length">
          批量评分 ({{ selectedRows.length }})
        </el-button>
        <el-button type="info" :icon="Document" plain @click="handleExport">导出报告</el-button>
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
      <!-- 状态列 -->
      <template #status="{ row }">
        <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
      </template>

      <!-- 进度列 -->
      <template #progress="{ row }">
        <el-progress
          :percentage="row.progress"
          :status="row.progress === 100 ? 'success' : ''"
          :stroke-width="8"
          style="width: 100px"
        />
      </template>

      <!-- 总分列 -->
      <template #totalScore="{ row }">
        <span :class="getScoreClass(row.totalScore)">{{ row.totalScore }}</span>
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
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="考核名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入考核名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="考核类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择类型" style="width: 100%">
                <el-option label="月度考核" value="月度考核" />
                <el-option label="季度考核" value="季度考核" />
                <el-option label="半年度考核" value="半年度考核" />
                <el-option label="年度考核" value="年度考核" />
                <el-option label="试用期考核" value="试用期考核" />
                <el-option label="项目考核" value="项目考核" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
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
          <el-col :span="12">
            <el-form-item label="被考核人" prop="employeeIds">
              <el-select v-model="formData.employeeIds" multiple filterable placeholder="请选择被考核人" style="width: 100%">
                <!-- 动态加载员工列表 -->
                <el-option
                  v-for="emp in employeeList"
                  :key="emp.id"
                  :label="`${emp.name} (${emp.deptName})`"
                  :value="emp.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="考核模板" prop="templateId">
              <el-select v-model="formData.templateId" placeholder="请选择考核模板" style="width: 100%">
                <el-option
                  v-for="tpl in templateList"
                  :key="tpl.id"
                  :label="tpl.name"
                  :value="tpl.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="自评截止日期" prop="selfDeadline">
              <el-date-picker
                v-model="formData.selfDeadline"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">考核指标配置</el-divider>
        <el-table :data="formData.indicators" border size="small" style="width: 100%">
          <el-table-column prop="name" label="指标名称" min-width="150" />
          <el-table-column prop="category" label="类别" width="100" />
          <el-table-column prop="weight" label="权重(%)" width="80" align="center" />
          <el-table-column prop="targetValue" label="目标值" width="100" align="center" />
          <el-table-column label="操作" width="80">
            <template #default="{ $index }">
              <el-button type="danger" link size="small" @click="removeIndicator($index)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button type="primary" link size="small" :icon="Plus" class="mt-2" @click="showIndicatorDialog">
          添加指标
        </el-button>

        <el-divider content-position="left">审批流程</el-divider>
        <el-steps :active="formData.approvers.length - 1" finish-status="success" simple style="margin-bottom: 20px">
          <el-step v-for="(approver, index) in formData.approvers" :key="index" :title="approver.name || `审批人${index + 1}`" />
        </el-steps>
        <el-form-item label="审批流程">
          <el-select v-model="formData.processType" placeholder="请选择审批流程" style="width: 100%">
            <el-option label="直属上级审批" value="direct" />
            <el-option label="部门负责人审批" value="dept" />
            <el-option label="多级审批（主管-经理-HR）" value="multi" />
            <el-option label="自定义流程" value="custom" />
          </el-select>
        </el-form-item>

        <el-form-item label="备注说明">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
    </BaseDialog>

    <!-- 查看详情对话框 -->
    <BaseDialog v-model="viewVisible" title="考核详情" width="1000px" :show-footer="false">
      <el-descriptions :column="2" border class="mb-4">
        <el-descriptions-item label="考核名称">{{ viewData.name }}</el-descriptions-item>
        <el-descriptions-item label="考核类型">{{ viewData.type }}</el-descriptions-item>
        <el-descriptions-item label="考核周期">{{ viewData.period }}</el-descriptions-item>
        <el-descriptions-item label="被考核人数">{{ viewData.employeeCount }}人</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(viewData.status)">{{ viewData.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发起时间">{{ viewData.createTime }}</el-descriptions-item>
        <el-descriptions-item label="总分">{{ viewData.totalScore }}</el-descriptions-item>
        <el-descriptions-item label="等级">{{ viewData.grade }}</el-descriptions-item>
      </el-descriptions>

      <h4 class="mt-4 mb-2">考核指标得分</h4>
      <el-table :data="viewData.indicators || []" border size="small">
        <el-table-column prop="name" label="指标名称" min-width="150" />
        <el-table-column prop="weight" label="权重(%)" width="80" align="center" />
        <el-table-column prop="targetValue" label="目标值" width="100" align="center" />
        <el-table-column prop="actualValue" label="实际值" width="100" align="center" />
        <el-table-column prop="score" label="得分" width="80" align="center">
          <template #default="{ row }">
            <span :class="getScoreClass(row.score)">{{ row.score }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="comment" label="评语" showOverflowTooltip />
      </el-table>

      <h4 class="mt-4 mb-2">审批记录</h4>
      <el-timeline>
        <el-timeline-item
          v-for="(log, index) in viewData.approvalLogs || []"
          :key="index"
          :timestamp="log.time"
          :type="log.type"
          placement="top"
        >
          <el-card>
            <h4>{{ log.action }}</h4>
            <p>操作人：{{ log.operator }}</p>
            <p>{{ log.comment }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </BaseDialog>

    <!-- 评分对话框 -->
    <BaseDialog v-model="scoreVisible" title="绩效考核评分" width="900px" @confirm="handleSubmitScore">
      <div class="score-header mb-4">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="被考核人">{{ scoreData.employeeName }}</el-descriptions-item>
          <el-descriptions-item label="部门">{{ scoreData.deptName }}</el-descriptions-item>
          <el-descriptions-item label="岗位">{{ scoreData.position }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <el-table :data="scoreData.indicators" border size="small">
        <el-table-column prop="name" label="指标名称" min-width="180" fixed />
        <el-table-column prop="description" label="指标说明" min-width="200" showOverflowTooltip />
        <el-table-column prop="weight" label="权重(%)" width="80" align="center" />
        <el-table-column prop="targetValue" label="目标值" width="100" align="center" />
        <el-table-column label="实际达成" width="140">
          <template #default="{ row }">
            <el-input-number v-model="row.actualValue" :precision="2" size="small" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="得分(0-100)" width="130">
          <template #default="{ row }">
            <el-input-number v-model="row.score" :min="0" :max="100" :precision="1" size="small" style="width: 100%" />
          </template>
        </el-table-column>
      </el-table>

      <div class="score-footer mt-4">
        <el-row :gutter="20">
          <el-col :span="16">
            <el-input v-model="scoreData.comment" type="textarea" :rows="3" placeholder="请输入综合评价和改进建议" />
          </el-col>
          <el-col :span="8">
            <el-result icon="success" :title="`总分：${calculatedScore}`" sub-title="自动计算加权平均分">
              <template #extra>
                <el-rate v-model="starRating" disabled show-score text-color="#ff9900" />
              </template>
            </el-result>
          </el-col>
        </el-row>
      </div>
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
  Document,
} from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import MoreActions from '@/components/MoreActions.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import {
  getAssessmentList,
  saveAssessment,
  deleteAssessment,
  submitAssessmentScore,
} from '@/api/hr'

// 每行操作按钮配置
function rowActions(row) {
  const editable = ['草稿', '已退回'].includes(row.status)
  return [
    { label: '查看', type: 'primary', important: true, onClick: () => handleView(row) },
    { label: '评分', type: 'success', important: true, hidden: row.status !== '待评分', onClick: () => handleScore(row) },
    { label: '审批', type: 'warning', important: true, hidden: row.status !== '待审批', onClick: () => handleApprove(row) },
    { label: '编辑', type: 'primary', hidden: !editable, onClick: () => handleEdit(row) },
    { label: '删除', type: 'danger', hidden: !editable, onClick: () => handleDeleteWithConfirm(row) }
  ]
}
function handleDeleteWithConfirm(row) {
  ElMessageBox.confirm('确定删除该考核记录吗？', '提示', { type: 'warning' })
    .then(() => handleDelete(row.id))
    .catch(() => {})
}

// 搜索项配置
const searchItems = [
  {
    prop: 'keyword',
    label: '关键词',
    type: 'input',
    placeholder: '搜索考核名称/员工姓名',
  },
  {
    prop: 'type',
    label: '考核类型',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '月度考核', value: '月度考核' },
      { label: '季度考核', value: '季度考核' },
      { label: '年度考核', value: '年度考核' },
      { label: '试用期考核', value: '试用期考核' },
    ],
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '进行中', value: '进行中' },
      { label: '待评分', value: '待评分' },
      { label: '待审批', value: '待审批' },
      { label: '已完成', value: '已完成' },
      { label: '已退回', value: '已退回' },
    ],
  },
  {
    prop: 'dateRange',
    label: '考核周期',
    type: 'daterange',
    startPlaceholder: '开始日期',
    endPlaceholder: '结束日期',
  },
]

// 表格列配置
const columns = [
  { type: 'selection', width: 50, fixed: 'left' },
  { prop: 'code', label: '考核编号', width: 160, fixed: 'left' },
  { prop: 'name', label: '考核名称', minWidth: 180, showOverflowTooltip: true },
  { prop: 'type', label: '考核类型', width: 110 },
  { slot: 'status', label: '状态', width: 100 },
  { prop: 'employeeName', label: '被考核人', width: 100 },
  { prop: 'deptName', label: '部门', width: 100 },
  { slot: 'progress', label: '进度', width: 130 },
  { slot: 'totalScore', label: '总分', width: 80, align: 'center' },
  { prop: 'grade', label: '等级', width: 70, align: 'center' },
  { prop: 'period', label: '考核周期', width: 140 },
  { prop: 'createTime', label: '发起时间', width: 170 },
  { slot: 'action', label: '操作', width: 200, fixed: 'right' },
]

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
const dialogTitle = ref('发起考核')
const formRef = ref(null)
const formData = reactive({
  id: null,
  name: '',
  type: '季度考核',
  period: [],
  employeeIds: [],
  templateId: '',
  selfDeadline: '',
  processType: 'multi',
  remark: '',
  indicators: [],
  approvers: [{ name: '直属主管' }, { name: '部门经理' }, { name: 'HR负责人' }],
})

// 查看详情
const viewVisible = ref(false)
const viewData = ref({})

// 评分相关
const scoreVisible = ref(false)
const scoreData = ref({})
const starRating = ref(0)

// 员工列表（模拟）
const employeeList = ref([
  { id: 1, name: '张三', deptName: '技术部' },
  { id: 2, name: '李四', deptName: '销售部' },
  { id: 3, name: '王五', deptName: '财务部' },
])

// 模板列表（模拟）
const templateList = ref([
  { id: 1, name: '技术岗位季度考核模板' },
  { id: 2, name: '销售岗位月度考核模板' },
  { id: 3, name: '管理岗位年度考核模板' },
  { id: 4, name: '通用试用期考核模板' },
])

// 计算总分
const calculatedScore = computed(() => {
  if (!scoreData.value.indicators) return 0
  const totalWeight = scoreData.value.indicators.reduce((sum, item) => sum + (item.weight || 0), 0)
  if (totalWeight === 0) return 0

  const weightedSum = scoreData.value.indicators.reduce((sum, item) => {
    return sum + ((item.score || 0) * (item.weight || 0)) / 100
  }, 0)

  const finalScore = Math.round((weightedSum / totalWeight) * 100)
  // 更新星级评分
  starRating.value = Math.round(finalScore / 20)

  return finalScore
})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入考核名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择考核类型', trigger: 'change' }],
}

// 获取状态类型
function getStatusType(status) {
  const map = {
    '草稿': 'info',
    '进行中': 'primary',
    '待评分': 'warning',
    '待审批': 'warning',
    '已完成': 'success',
    '已退回': 'danger',
  }
  return map[status] || 'info'
}

// 获取分数样式类
function getScoreClass(score) {
  if (score >= 90) return 'score-excellent'
  if (score >= 80) return 'score-good'
  if (score >= 70) return 'score-average'
  if (score >= 60) return 'score-pass'
  return 'score-fail'
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
    const res = await getAssessmentList(params)
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0
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

// 移除指标
function removeIndicator(index) {
  formData.indicators.splice(index, 1)
}

// 显示指标选择对话框
function showIndicatorDialog() {
  // 可以打开一个弹窗从KPI库中选择指标
  formData.indicators.push({
    id: Date.now(),
    name: '新指标',
    category: '业绩指标',
    weight: 10,
    targetValue: 100,
  })
  ElMessage.info('已添加空白指标行，请编辑')
}

// 新增
function handleAdd() {
  dialogTitle.value = '发起考核'
  resetForm()
  dialogVisible.value = true
}

// 编辑
function handleEdit(row) {
  dialogTitle.value = '编辑考核'
  Object.assign(formData, {
    ...row,
    period: [row.startDate, row.endDate],
    employeeIds: [row.employeeId],
  })
  dialogVisible.value = true
}

// 查看
function handleView(row) {
  viewData.value = {
    ...row,
    indicators: [
      { name: '工作业绩', weight: 40, targetValue: 100, actualValue: 95, score: 95, comment: '超额完成目标' },
      { name: '工作能力', weight: 25, targetValue: 100, actualValue: 88, score: 88, comment: '能力优秀' },
      { name: '工作态度', weight: 20, targetValue: 100, actualValue: 92, score: 92, comment: '态度端正' },
      { name: '团队协作', weight: 15, targetValue: 100, actualValue: 90, score: 90, comment: '协作良好' },
    ],
    approvalLogs: [
      { time: '2026-01-15 10:30', action: '提交自评', operator: '张三', comment: '已完成自评', type: 'primary' },
      { time: '2026-01-18 14:20', action: '主管评分', operator: '赵六', comment: '表现优秀', type: 'success' },
      { time: '2026-01-20 09:00', action: '等待审批', operator: '系统', comment: '', type: 'warning' },
    ],
  }
  viewVisible.value = true
}

// 评分
function handleScore(row) {
  scoreData.value = {
    ...row,
    employeeName: row.employeeName,
    deptName: row.deptName,
    position: row.position,
    comment: '',
    indicators: [
      { name: '工作业绩', description: '完成工作任务的质量和效率', weight: 40, targetValue: 100, actualValue: 0, score: 0 },
      { name: '工作能力', description: '专业技能和解决问题的能力', weight: 25, targetValue: 100, actualValue: 0, score: 0 },
      { name: '工作态度', description: '责任心、积极性和主动性', weight: 20, targetValue: 100, actualValue: 0, score: 0 },
      { name: '团队协作', description: '与团队成员的配合程度', weight: 15, targetValue: 100, actualValue: 0, score: 0 },
    ],
  }
  scoreVisible.value = true
}

// 提交评分
async function handleSubmitScore() {
  try {
    await submitAssessmentScore({
      assessmentId: scoreData.value.id,
      indicators: scoreData.value.indicators,
      totalScore: calculatedScore.value,
      comment: scoreData.value.comment,
    })
    ElMessage.success('评分成功')
    scoreVisible.value = false
    loadData()
  } catch (error) {
    console.error('评分失败:', error)
  }
}

// 审批
function handleApprove(row) {
  ElMessageBox.confirm(
    `确定通过 ${row.employeeName} 的${row.name}吗？`,
    '审批确认',
    { type: 'warning' }
  ).then(async () => {
    try {
      ElMessage.success('审批通过')
      loadData()
    } catch (error) {
      console.error('审批失败:', error)
    }
  })
}

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await saveAssessment(formData)
        ElMessage.success(formData.id ? '更新成功' : '考核已发起')
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
    name: '',
    type: '季度考核',
    period: [],
    employeeIds: [],
    templateId: '',
    selfDeadline: '',
    processType: 'multi',
    remark: '',
    indicators: [],
    approvers: [{ name: '直属主管' }, { name: '部门经理' }, { name: 'HR负责人' }],
  })
}

// 删除
async function handleDelete(id) {
  try {
    await deleteAssessment(id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    console.error('删除失败:', error)
  }
}

// 批量审批
function handleBatchApprove() {
  ElMessageBox.confirm(
    `确定批量审批选中的 ${selectedRows.value.length} 条考核记录吗？`,
    '批量审批确认',
    { type: 'warning' }
  ).then(() => {
    ElMessage.success(`已批量审批 ${selectedRows.value.length} 条记录`)
    loadData()
  })
}

// 批量评分
function handleBatchScore() {
  ElMessage.info('请逐个进行评分操作')
}

// 导出
function handleExport() {
  ElMessage.success('正在导出考核报告...')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
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
.mb-4 {
  margin-bottom: 16px;
}
.score-excellent {
  color: #67c23a;
  font-weight: bold;
  font-size: 16px;
}
.score-good {
  color: #409eff;
  font-weight: bold;
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
  font-size: 16px;
}
</style>
