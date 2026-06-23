<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新建任务</el-button>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" />
      </div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }">
        <el-tag :type="statusMap[row.status]?.type || 'info'" size="small">{{ row.status }}</el-tag>
      </template>
      <template #priority="{ row }">
        <el-tag :type="row.priority === '高' ? 'danger' : row.priority === '中' ? 'warning' : 'info'" size="small">{{ row.priority }}</el-tag>
      </template>
      <template #progress="{ row }">
        <el-progress :percentage="row.progress" :status="row.status === '已完成' ? 'success' : ''" />
      </template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 3)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 3" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="action in getActions(row).slice(3)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </BaseTable>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false" @close="cancelDialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="任务标题" prop="title"><el-input v-model="formData.title" /></el-form-item>
        <el-form-item label="负责人" prop="owner"><el-input v-model="formData.owner" /></el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="formData.priority">
            <el-radio value="高">高</el-radio>
            <el-radio value="中">中</el-radio>
            <el-radio value="低">低</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate"><el-input v-model="formData.startDate" placeholder="例如 2025-06-23" /></el-form-item>
        <el-form-item label="截止日期" prop="endDate"><el-input v-model="formData.endDate" placeholder="例如 2025-06-30" /></el-form-item>
        <el-form-item label="进度(%)" prop="progress"><el-input-number v-model="formData.progress" :min="0" :max="100" style="width: 100%" /></el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option v-for="o in statusOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务描述" prop="description"><el-input v-model="formData.description" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情 -->
    <el-dialog v-model="viewVisible" title="任务详情" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="任务标题" :span="2">{{ viewRow.title }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ viewRow.owner }}</el-descriptions-item>
        <el-descriptions-item label="优先级">{{ viewRow.priority }}</el-descriptions-item>
        <el-descriptions-item label="开始日期">{{ viewRow.startDate }}</el-descriptions-item>
        <el-descriptions-item label="截止日期">{{ viewRow.endDate }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ viewRow.status }}</el-descriptions-item>
        <el-descriptions-item label="进度" :span="2">
          <el-progress :percentage="viewRow.progress" :status="viewRow.status === '已完成' ? 'success' : ''" />
        </el-descriptions-item>
        <el-descriptions-item label="任务描述" :span="2">{{ viewRow.description }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'

const statusMap = { '待处理': { type: 'info' }, '进行中': { type: 'warning' }, '已完成': { type: 'success' }, '已延期': { type: 'danger' } }
const statusOptions = ['待处理', '进行中', '已完成', '已延期']
const priorityOptions = ['高', '中', '低']

const searchItems = [
  { prop: 'title', label: '任务标题', type: 'input' },
  { prop: 'owner', label: '负责人', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions.map(v => ({ value: v, label: v })) }
]
const columns = [
  { prop: 'title', label: '任务标题', minWidth: 200, showOverflowTooltip: true },
  { prop: 'owner', label: '负责人', width: 100 },
  { prop: 'priority', label: '优先级', width: 100, slot: 'priority' },
  { prop: 'startDate', label: '开始日期', width: 120 },
  { prop: 'endDate', label: '截止日期', width: 120 },
  { prop: 'progress', label: '进度', width: 180, slot: 'progress' },
  { prop: 'status', label: '状态', width: 100, slot: 'status' }
]
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref('新建任务'), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, title: '', owner: '', status: '' })
const formData = reactive({ id: undefined, title: '', owner: '', priority: '中', startDate: '', endDate: '', progress: 0, status: '待处理', description: '' })
const formRules = { title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }] }
const titles = ['Q2 销售报告', '产品需求评审', '客户回访', '系统功能优化', '市场调研', '项目周报', '数据备份', '培训资料准备', '招标方案编制', '客户演示准备']
const owners = ['张伟', '李娜', '王强', '赵敏', '刘芳', '陈晨', '黄磊', '周杰']
const priorities = ['高', '中', '低']
const statuses = ['待处理', '进行中', '已完成', '已延期']

async function loadData() {
  loading.value = true
  try {
    const { title = '', owner = '', status = '', pageNum = 1, pageSize = 10 } = queryParams
    const all = Array.from({ length: 60 }, (_, i) => {
      const progress = i % 4 === 2 ? 100 : (i % 4 === 1 ? 50 : (i % 4 === 0 ? 0 : 30))
      return {
        id: i + 1,
        title: titles[i % titles.length] + (i > 9 ? ` #${Math.floor(i / 10) + 1}` : ''),
        owner: owners[i % owners.length],
        priority: priorities[i % priorities.length],
        startDate: `2025-${String((i % 6) + 1).padStart(2, '0')}-01`,
        endDate: `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        progress,
        status: statuses[i % statuses.length],
        description: '详细任务说明文档待补充'
      }
    })
    let filtered = all
    if (title) filtered = filtered.filter(x => x.title.includes(title))
    if (owner) filtered = filtered.filter(x => x.owner.includes(owner))
    if (status) filtered = filtered.filter(x => x.status === status)
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新建任务'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.priority = '中'; formData.progress = 0; formData.status = '待处理'; dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = '编辑任务'; Object.assign(formData, row); dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('保存成功'); dialogVisible.value = false; loadData() }
  catch { ElMessage.error('保存失败') }
  finally { submitLoading.value = false }
}
async function handleComplete(row) {
  await ElMessageBox.confirm(`确定将「${row.title}」标记为已完成?`, '提示', { type: 'warning' })
  ElMessage.success('已标记完成')
  loadData()
}
async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除「${row.title}」?`, '提示', { type: 'warning' })
  ElMessage.success('删除成功')
  loadData()
}
function getActions(row) {
  const actions = [
    { key: 'view', label: '查看', type: 'primary', handler: handleView },
    { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit }
  ]
  if (row.status !== '已完成') {
    actions.push({ key: 'complete', label: '标记完成', type: 'success', handler: handleComplete })
  }
  actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete })
  return actions
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
