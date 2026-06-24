<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />

    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增KPI</el-button>
        <el-button type="success" :icon="DocumentCopy" plain @click="handleCopy">复制模板</el-button>
        <el-button type="warning" :icon="Upload" plain @click="handleImport">批量导入</el-button>
        <el-button type="danger" :icon="Delete" plain :disabled="!selectedRows.length" @click="handleBatchDelete">
          批量删除 ({{ selectedRows.length }})
        </el-button>
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
        <el-tag :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag>
      </template>

      <!-- 权重列 -->
      <template #weight="{ row }">
        <el-progress
          :percentage="row.weight"
          :color="getWeightColor(row.weight)"
          :stroke-width="8"
          style="width: 100px"
        />
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
      width="700px"
      @confirm="handleSubmit"
      @cancel="handleCancel"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="指标名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入KPI指标名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="指标编码" prop="code">
              <el-input v-model="formData.code" placeholder="系统自动生成" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属类别" prop="category">
              <el-select v-model="formData.category" placeholder="请选择类别" style="width: 100%">
                <el-option label="业绩指标" value="业绩指标" />
                <el-option label="行为指标" value="行为指标" />
                <el-option label="能力指标" value="能力指标" />
                <el-option label="态度指标" value="态度指标" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="适用岗位" prop="positionType">
              <el-select v-model="formData.positionType" placeholder="请选择适用岗位" style="width: 100%">
                <el-option label="全部岗位" value="全部" />
                <el-option label="管理岗" value="管理岗" />
                <el-option label="技术岗" value="技术岗" />
                <el-option label="销售岗" value="销售岗" />
                <el-option label="职能岗" value="职能岗" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="权重(%)" prop="weight">
              <el-input-number v-model="formData.weight" :min="1" :max="100" :precision="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="考核周期" prop="cycle">
              <el-select v-model="formData.cycle" placeholder="请选择周期" style="width: 100%">
                <el-option label="月度" value="月度" />
                <el-option label="季度" value="季度" />
                <el-option label="半年度" value="半年度" />
                <el-option label="年度" value="年度" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="目标值类型" prop="targetType">
              <el-select v-model="formData.targetType" placeholder="请选择类型" style="width: 100%">
                <el-option label="数值型" value="数值型" />
                <el-option label="百分比" value="百分比" />
                <el-option label="等级制" value="等级制" />
                <el-option label="是/否" value="布尔值" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计算方式" prop="calcMethod">
              <el-select v-model="formData.calcMethod" placeholder="请选择方式" style="width: 100%">
                <el-option label="直接达成率" value="直接达成率" />
                <el-option label="加权计算" value="加权计算" />
                <el-option label="阶梯评分" value="阶梯评分" />
                <el-option label="主观评价" value="主观评价" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="指标说明" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入指标详细说明" />
        </el-form-item>

        <el-form-item label="评分标准" prop="scoringStandard">
          <el-table :data="formData.scoringStandards" border size="small" style="width: 100%">
            <el-table-column prop="level" label="等级" width="80">
              <template #default="{ row }">
                <el-input v-model="row.level" size="small" />
              </template>
            </el-table-column>
            <el-table-column prop="range" label="得分区间" width="150">
              <template #default="{ row }">
                <el-input v-model="row.range" size="small" placeholder="如: 90-100分" />
              </template>
            </el-table-column>
            <el-table-column prop="desc" label="标准描述">
              <template #default="{ row }">
                <el-input v-model="row.desc" size="small" placeholder="描述该等级的标准" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="60">
              <template #default="{ $index }">
                <el-button type="danger" link size="small" @click="removeStandard($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="primary" link size="small" :icon="Plus" class="mt-2" @click="addStandard">
            添加评分标准
          </el-button>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio value="启用">启用</el-radio>
            <el-radio value="禁用">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </BaseDialog>

    <!-- 查看详情对话框 -->
    <BaseDialog v-model="viewVisible" title="KPI详情" width="800px" :show-footer="false">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="指标名称">{{ viewData.name }}</el-descriptions-item>
        <el-descriptions-item label="指标编码">{{ viewData.code }}</el-descriptions-item>
        <el-descriptions-item label="所属类别">{{ viewData.category }}</el-descriptions-item>
        <el-descriptions-item label="适用岗位">{{ viewData.positionType }}</el-descriptions-item>
        <el-descriptions-item label="权重">
          <el-tag type="primary">{{ viewData.weight }}%</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="考核周期">{{ viewData.cycle }}</el-descriptions-item>
        <el-descriptions-item label="目标值类型">{{ viewData.targetType }}</el-descriptions-item>
        <el-descriptions-item label="计算方式">{{ viewData.calcMethod }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="viewData.status === '启用' ? 'success' : 'info'">{{ viewData.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ viewData.createTime }}</el-descriptions-item>
        <el-descriptions-item label="指标说明" :span="2">{{ viewData.description }}</el-descriptions-item>
      </el-descriptions>

      <h4 class="mt-4 mb-2">评分标准</h4>
      <el-table :data="viewData.scoringStandards || []" border size="small">
        <el-table-column prop="level" label="等级" width="80" />
        <el-table-column prop="range" label="得分区间" width="180" />
        <el-table-column prop="desc" label="标准描述" />
      </el-table>
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
  DocumentCopy,
  Upload,
} from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import MoreActions from '@/components/MoreActions.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import { getKpiList, saveKpi, deleteKpi, toggleKpiStatus } from '@/api/hr'

// 每行操作按钮配置
function rowActions(row) {
  return [
    { label: '编辑', type: 'primary', important: true, onClick: () => handleEdit(row) },
    { label: '查看', type: 'success', important: true, onClick: () => handleView(row) },
    { label: row.status === '启用' ? '禁用' : '启用', type: row.status === '启用' ? 'warning' : 'success', important: true, onClick: () => handleToggleStatus(row) },
    { label: '删除', type: 'danger', onClick: () => handleDeleteWithConfirm(row) }
  ]
}
function handleDeleteWithConfirm(row) {
  ElMessageBox.confirm('确定删除该KPI指标吗？', '提示', { type: 'warning' })
    .then(() => handleDelete(row.id))
    .catch(() => {})
}

// 搜索项配置
const searchItems = [
  {
    prop: 'keyword',
    label: '关键词',
    type: 'input',
    placeholder: '搜索指标名称/编码',
  },
  {
    prop: 'category',
    label: '类别',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '业绩指标', value: '业绩指标' },
      { label: '行为指标', value: '行为指标' },
      { label: '能力指标', value: '能力指标' },
      { label: '态度指标', value: '态度指标' },
    ],
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '启用', value: '启用' },
      { label: '禁用', value: '禁用' },
    ],
  },
]

// 表格列配置
const columns = [
  { type: 'selection', width: 50, fixed: 'left' },
  { prop: 'code', label: '指标编码', width: 140, fixed: 'left' },
  { prop: 'name', label: '指标名称', minWidth: 160, showOverflowTooltip: true },
  { prop: 'category', label: '所属类别', width: 100 },
  { prop: 'positionType', label: '适用岗位', width: 100 },
  { slot: 'weight', label: '权重', width: 130 },
  { prop: 'cycle', label: '考核周期', width: 90 },
  { prop: 'targetType', label: '目标值类型', width: 110 },
  { prop: 'calcMethod', label: '计算方式', width: 110 },
  { slot: 'status', label: '状态', width: 80 },
  { prop: 'updateTime', label: '更新时间', width: 170 },
  { slot: 'action', label: '操作', width: 240, fixed: 'right' },
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
const dialogTitle = ref('新增KPI')
const formRef = ref(null)
const formData = reactive({
  id: null,
  name: '',
  code: '',
  category: '',
  positionType: '',
  weight: 10,
  cycle: '季度',
  targetType: '数值型',
  calcMethod: '直接达成率',
  description: '',
  status: '启用',
  scoringStandards: [
    { level: 'S', range: '95-100', desc: '远超预期，表现卓越' },
    { level: 'A', range: '85-94', desc: '超出预期，表现优秀' },
    { level: 'B', range: '70-84', desc: '符合预期，表现良好' },
    { level: 'C', range: '60-69', desc: '基本符合，需要改进' },
    { level: 'D', range: '0-59', desc: '未达预期，需要提升' },
  ],
})

// 查看详情
const viewVisible = ref(false)
const viewData = ref({})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入指标名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择类别', trigger: 'change' }],
  weight: [{ required: true, message: '请输入权重', trigger: 'blur' }],
}

// 获取权重颜色
function getWeightColor(weight) {
  if (weight >= 30) return '#F56C6C'
  if (weight >= 20) return '#E6A23C'
  return '#409EFF'
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
    const res = await getKpiList(params)
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch (error) {
    console.error('加载KPI数据失败:', error)
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

// 添加评分标准
function addStandard() {
  formData.scoringStandards.push({
    level: '',
    range: '',
    desc: '',
  })
}

// 删除评分标准
function removeStandard(index) {
  formData.scoringStandards.splice(index, 1)
}

// 新增
function handleAdd() {
  dialogTitle.value = '新增KPI'
  resetForm()
  dialogVisible.value = true
}

// 编辑
function handleEdit(row) {
  dialogTitle.value = '编辑KPI'
  Object.assign(formData, {
    ...row,
    scoringStandards: row.scoringStandards || [
      { level: 'S', range: '95-100', desc: '远超预期' },
      { level: 'A', range: '85-94', desc: '超出预期' },
      { level: 'B', range: '70-84', desc: '符合预期' },
      { level: 'C', range: '60-69', desc: '基本符合' },
      { level: 'D', range: '0-59', desc: '未达预期' },
    ],
  })
  dialogVisible.value = true
}

// 查看
function handleView(row) {
  viewData.value = { ...row }
  viewVisible.value = true
}

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await saveKpi(formData)
        ElMessage.success(formData.id ? '更新成功' : '创建成功')
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
    code: `KPI${Date.now().toString().slice(-6)}`,
    category: '',
    positionType: '',
    weight: 10,
    cycle: '季度',
    targetType: '数值型',
    calcMethod: '直接达成率',
    description: '',
    status: '启用',
    scoringStandards: [
      { level: 'S', range: '95-100', desc: '远超预期，表现卓越' },
      { level: 'A', range: '85-94', desc: '超出预期，表现优秀' },
      { level: 'B', range: '70-84', desc: '符合预期，表现良好' },
      { level: 'C', range: '60-69', desc: '基本符合，需要改进' },
      { level: 'D', range: '0-59', desc: '未达预期，需要提升' },
    ],
  })
}

// 删除
async function handleDelete(id) {
  try {
    await deleteKpi(id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    console.error('删除失败:', error)
  }
}

// 批量删除
function handleBatchDelete() {
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedRows.value.length} 条记录吗？`,
    '批量删除确认',
    { type: 'warning' }
  ).then(async () => {
    try {
      const ids = selectedRows.value.map((row) => row.id)
      for (const id of ids) {
        await deleteKpi(id)
      }
      ElMessage.success(`成功删除 ${ids.length} 条记录`)
      loadData()
    } catch (error) {
      console.error('批量删除失败:', error)
    }
  })
}

// 复制模板
function handleCopy() {
  ElMessage.info('请先选择要复制的KPI模板')
}

// 导入
function handleImport() {
  ElMessage.info('导入功能开发中...')
}

// 切换状态
async function handleToggleStatus(row) {
  const newStatus = row.status === '启用' ? '禁用' : '启用'
  try {
    await toggleKpiStatus(row.id, newStatus)
    ElMessage.success(`已${newStatus}`)
    loadData()
  } catch (error) {
    console.error('切换状态失败:', error)
  }
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
</style>
