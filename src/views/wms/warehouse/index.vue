<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新增仓库</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '停用' }}</BaseStatusTag></template>
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
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="550px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" /></BaseDialog>
    <el-dialog v-model="viewVisible" title="仓库详情" width="550px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="编码">{{ viewRow.code }}</el-descriptions-item>
        <el-descriptions-item label="名称">{{ viewRow.name }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ viewRow.manager }}</el-descriptions-item>
        <el-descriptions-item label="面积(m2)">{{ viewRow.area }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ viewRow.status === 1 ? '启用' : '停用' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ viewRow.createTime }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ viewRow.address }}</el-descriptions-item>
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

const searchItems = [ { prop: 'name', label: '仓库名称', type: 'input' }, { prop: 'code', label: '编码', type: 'input' } ]
const columns = [ { prop: 'code', label: '编码', width: 120 }, { prop: 'name', label: '名称', width: 150 }, { prop: 'address', label: '地址', minWidth: 200, showOverflowTooltip: true }, { prop: 'manager', label: '负责人', width: 100 }, { prop: 'area', label: '面积(m2)', width: 100, align: 'center' }, { prop: 'status', label: '状态', width: 80, slot: 'status' }, { prop: 'createTime', label: '创建时间', width: 170 } ]
const formItems = [ { prop: 'code', label: '编码', type: 'input' }, { prop: 'name', label: '名称', type: 'input' }, { prop: 'address', label: '地址', type: 'textarea', rows: 2 }, { prop: 'manager', label: '负责人', type: 'input' }, { prop: 'area', label: '面积', type: 'number' }, { prop: 'status', label: '状态', type: 'radio', options: [{ value: 1, label: '启用' }, { value: 0, label: '停用' }] } ]
const formRules = { code: [{ required: true, message: '请输入编码', trigger: 'blur' }], name: [{ required: true, message: '请输入名称', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, name: '', code: '' })
const formData = reactive({ id: undefined, code: '', name: '', address: '', manager: '', area: undefined, status: 1 })

async function loadData() {
  loading.value = true
  try {
    const all = [
      { id: 1, code: 'WH001', name: '主仓库', address: '北京市朝阳区xxx路88号', manager: '张三', area: 5000, status: 1, createTime: '2024-01-01 00:00:00' },
      { id: 2, code: 'WH002', name: '分仓库A', address: '上海市浦东新区xxx路66号', manager: '李四', area: 3000, status: 1, createTime: '2024-02-01 00:00:00' },
      { id: 3, code: 'WH003', name: '华南仓库', address: '深圳市南山区xxx路99号', manager: '王五', area: 4000, status: 1, createTime: '2024-03-01 00:00:00' },
      { id: 4, code: 'WH004', name: '旧仓库', address: '北京市海淀区xxx路10号', manager: '赵六', area: 1500, status: 0, createTime: '2024-04-01 00:00:00' }
    ]
    const { name = '', code = '', pageNum = 1, pageSize = 10 } = queryParams
    let filtered = all
    if (name) filtered = filtered.filter(x => x.name.includes(name))
    if (code) filtered = filtered.filter(x => x.code.includes(code))
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增仓库'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.status = 1; dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑仓库'; Object.assign(formData, r); dialogVisible.value = true }
function handleToggle(row) { row.status = row.status === 1 ? 0 : 1; ElMessage.success(`${row.status === 1 ? '启用' : '停用'}成功`) }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除「${row.name}」?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
function getActions(row) {
  const actions = [
    { key: 'view', label: '查看', type: 'primary', handler: handleView },
    { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit }
  ]
  actions.push({ key: 'toggle', label: row.status === 1 ? '停用' : '启用', type: 'warning', handler: handleToggle })
  actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete })
  return actions
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
