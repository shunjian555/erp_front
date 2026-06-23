<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新增库区</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</BaseStatusTag></template>
      <template #type="{ row }"><el-tag :type="areaTypeMap[row.type]?.type || ''" size="small">{{ areaTypeMap[row.type]?.label || row.type }}</el-tag></template>
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
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="500px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" /></BaseDialog>
    <el-dialog v-model="viewVisible" title="库区详情" width="500px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="编码">{{ viewRow.code }}</el-descriptions-item>
        <el-descriptions-item label="名称">{{ viewRow.name }}</el-descriptions-item>
        <el-descriptions-item label="所属仓库">{{ viewRow.warehouseName }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ areaTypeMap[viewRow.type]?.label || viewRow.type }}</el-descriptions-item>
        <el-descriptions-item label="容量">{{ viewRow.capacity }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ viewRow.status }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ viewRow.createTime }}</el-descriptions-item>
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
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'

const areaTypeMap = { normal: { label: '普通区', type: '' }, cold: { label: '冷藏区', type: 'primary' }, hazardous: { label: '危险品区', type: 'danger' } }
const searchItems = [ { prop: 'name', label: '名称', type: 'input' }, { prop: 'warehouseName', label: '所属仓库', type: 'input' } ]
const columns = [ { prop: 'code', label: '编码', width: 120 }, { prop: 'name', label: '名称', width: 140 }, { prop: 'warehouseName', label: '所属仓库', width: 120 }, { prop: 'type', label: '类型', width: 100, slot: 'type' }, { prop: 'capacity', label: '容量', width: 80, align: 'center' }, { prop: 'status', label: '状态', width: 80, slot: 'status' }, { prop: 'createTime', label: '创建时间', width: 170 } ]
const formItems = [ { prop: 'name', label: '名称', type: 'input' }, { prop: 'code', label: '编码', type: 'input' }, { prop: 'type', label: '类型', type: 'select', options: [{ value: 'normal', label: '普通区' }, { value: 'cold', label: '冷藏区' }, { value: 'hazardous', label: '危险品区' }] }, { prop: 'capacity', label: '容量', type: 'number' } ]
const formRules = { name: [{ required: true, message: '请输入名称', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref('新增库区'), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, name: '', warehouseName: '' })
const formData = reactive({ id: undefined, name: '', code: '', type: 'normal', capacity: undefined })

async function loadData() {
  loading.value = true
  try {
    const all = [
      { id: 1, code: 'AR001', name: 'A区-常温区', warehouseName: '主仓库', type: 'normal', capacity: 1000, status: '启用', createTime: '2024-01-01 09:00:00' },
      { id: 2, code: 'AR002', name: 'B区-冷藏区', warehouseName: '主仓库', type: 'cold', capacity: 300, status: '启用', createTime: '2024-01-02 09:00:00' },
      { id: 3, code: 'AR003', name: 'C区-危险品区', warehouseName: '分仓库A', type: 'hazardous', capacity: 100, status: '启用', createTime: '2024-02-01 09:00:00' },
      { id: 4, code: 'AR004', name: 'D区-暂存区', warehouseName: '分仓库A', type: 'normal', capacity: 500, status: '停用', createTime: '2024-03-01 09:00:00' }
    ]
    const { name = '', warehouseName = '', pageNum = 1, pageSize = 10 } = queryParams
    let filtered = all
    if (name) filtered = filtered.filter(x => x.name.includes(name))
    if (warehouseName) filtered = filtered.filter(x => x.warehouseName.includes(warehouseName))
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增库区'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.type = 'normal'; dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑库区'; Object.assign(formData, r); dialogVisible.value = true }
function handleToggle(row) { row.status = row.status === '启用' ? '停用' : '启用'; ElMessage.success(`${row.status === '启用' ? '启用' : '停用'}成功`) }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除「${row.name}」?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
function getActions(row) {
  const actions = [
    { key: 'view', label: '查看', type: 'primary', handler: handleView },
    { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit }
  ]
  actions.push({ key: 'toggle', label: row.status === '启用' ? '停用' : '启用', type: 'warning', handler: handleToggle })
  actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete })
  return actions
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
