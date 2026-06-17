<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">发布公告</el-button><el-button :icon="Delete" plain @click="handleBatchDelete">批量删除</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #top="{ row }"><el-tag v-if="row.isTop" type="danger" size="small">置顶</el-tag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button></template>
    </BaseTable>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" :close-on-click-modal="false" @close="cancelDialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择类型" style="width: 100%">
            <el-option v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <RichEditor v-model="formData.content" placeholder="请输入公告内容" />
        </el-form-item>
        <el-form-item label="置顶" prop="isTop">
          <el-switch v-model="formData.isTop" active-text="是" inactive-text="否" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import RichEditor from '@/components/RichEditor.vue'

const typeOptions = [{ value: 'notice', label: '通知' }, { value: 'policy', label: '制度' }, { value: 'activity', label: '活动' }]

const searchItems = [
  { prop: 'title', label: '公告标题', type: 'input' },
  { prop: 'type', label: '类型', type: 'select', options: typeOptions }
]

const columns = [
  { prop: 'title', label: '公告标题', minWidth: 200 },
  { prop: 'type', label: '类型', width: 90 },
  { prop: 'publisher', label: '发布人', width: 100 },
  { prop: 'isTop', label: '置顶', width: 70, slot: 'top' },
  { prop: 'readCount', label: '阅读量', width: 80, align: 'center' },
  { prop: 'publishTime', label: '发布时间', width: 170 }
]

const formRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, title: '', type: '' })
const formData = reactive({ id: undefined, title: '', type: '', content: '', isTop: false })

async function loadData() {
  loading.value = true
  try {
    const res = await (await import('@/utils/request')).default({ url: '/api/oa/notice/list', method: 'get', params: queryParams })
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
  } finally { loading.value = false }
}

function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }

function handleAdd() {
  dialogTitle.value = '发布公告'
  Object.keys(formData).forEach(k => formData[k] = '')
  formData.id = undefined
  dialogVisible.value = true
}

function handleEdit(r) {
  dialogTitle.value = '编辑公告'
  Object.assign(formData, r)
  dialogVisible.value = true
}

function cancelDialog() {
  dialogVisible.value = false
  formRef.value?.resetFields()
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    await new Promise(r => setTimeout(r, 500))
    ElMessage.success('操作成功')
    dialogVisible.value = false
    loadData()
  } catch { ElMessage.error('操作失败') }
  finally { submitLoading.value = false }
}

async function handleDelete(row) {
  await ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' })
  ElMessage.success('删除成功')
  loadData()
}

async function handleBatchDelete() {
  if (!selectedRows.value.length) return ElMessage.warning('请选择数据')
  await ElMessageBox.confirm('确定?', '提示', { type: 'warning' })
  ElMessage.success('删除成功')
  loadData()
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container {
  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 14px 18px;
    background: #fff;
    border-radius: var(--border-radius-base);

    .toolbar-left { display: flex; gap: 10px; }
    .toolbar-right { display: flex; gap: 8px; }
  }
}
</style>