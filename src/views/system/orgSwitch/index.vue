<template>
  <div class="page-container">
    <el-alert title="多组织/多公司切换" type="info" :closable="false" show-icon style="margin-bottom: 16px">
      <template #default>支持多组织架构管理，可在同一系统中管理多个法人公司、利润中心、成本中心，灵活切换当前操作组织。</template>
    </el-alert>
    <div class="org-stats">
      <div class="stat-card"><div class="stat-label">组织总数</div><div class="stat-value">{{ orgs.length }}</div></div>
      <div class="stat-card"><div class="stat-label">当前组织</div><div class="stat-value" style="color: #409eff">{{ currentOrg.name }}</div></div>
      <div class="stat-card"><div class="stat-label">员工总数</div><div class="stat-value">286</div></div>
      <div class="stat-card"><div class="stat-label">利润中心</div><div class="stat-value">12</div></div>
    </div>
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增组织</el-button>
        <el-button :icon="Switch" @click="switchOrg">切换组织</el-button>
      </div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #type="{ row }"><el-tag :type="typeMap[row.type]?.type || ''" size="small">{{ typeMap[row.type]?.label || row.type }}</el-tag></template>
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</BaseStatusTag></template>
      <template #isCurrent="{ row }">{{ row.id === currentOrg.id ? '✓ 当前' : '-' }}</template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 3)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 3" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown><el-dropdown-menu><el-dropdown-item v-for="action in getActions(row).slice(3)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item></el-dropdown-menu></template>
        </el-dropdown>
      </template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Switch, ArrowDown } from '@element-plus/icons-vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
const typeMap = { company: { label: '公司', type: 'primary' }, dept: { label: '部门', type: 'success' }, center: { label: '利润中心', type: 'warning' } }
const orgs = [
  { id: 1, code: 'HQ', name: '集团总部', type: 'company', parentId: null, legalRep: '王总', taxNo: '91110000123456789X', phone: '010-12345678', status: 1, createTime: '2024-01-01' },
  { id: 2, code: 'SH01', name: '上海分公司', type: 'company', parentId: 1, legalRep: '李总', taxNo: '91310000987654321Y', phone: '021-87654321', status: 1, createTime: '2024-02-01' },
  { id: 3, code: 'SZ01', name: '深圳分公司', type: 'company', parentId: 1, legalRep: '陈总', taxNo: '91440300123456789Z', phone: '0755-12345678', status: 1, createTime: '2024-02-15' },
  { id: 4, code: 'PC01', name: '生产中心', type: 'center', parentId: 1, legalRep: '', taxNo: '', phone: '', status: 1, createTime: '2024-03-01' },
  { id: 5, code: 'SC01', name: '销售中心', type: 'center', parentId: 1, legalRep: '', taxNo: '', phone: '', status: 1, createTime: '2024-03-01' },
  { id: 6, code: 'OLD', name: '旧组织', type: 'company', parentId: null, legalRep: '赵总', taxNo: '91110000999999999A', phone: '010-99999999', status: 0, createTime: '2023-01-01' }
]
const currentOrg = ref(orgs[0])
const columns = [{ prop: 'code', label: '编码', width: 110 }, { prop: 'name', label: '组织名称', width: 160 }, { prop: 'type', label: '类型', width: 110, slot: 'type' }, { prop: 'legalRep', label: '法人代表', width: 110 }, { prop: 'taxNo', label: '税号', width: 200 }, { prop: 'phone', label: '电话', width: 130 }, { prop: 'status', label: '状态', width: 80, slot: 'status' }, { prop: 'isCurrent', label: '当前', width: 90, slot: 'isCurrent', align: 'center' }]
const formItems = [{ prop: 'code', label: '编码', type: 'input', span: 12 }, { prop: 'name', label: '组织名称', type: 'input', span: 12 }, { prop: 'type', label: '类型', type: 'select', options: Object.entries(typeMap).map(([k, v]) => ({ value: k, label: v.label })), span: 12 }, { prop: 'parentId', label: '上级组织', type: 'input', span: 12, placeholder: '上级组织编码' }, { prop: 'legalRep', label: '法人代表', type: 'input', span: 12 }, { prop: 'taxNo', label: '税号', type: 'input', span: 12 }, { prop: 'phone', label: '电话', type: 'input', span: 12 }, { prop: 'status', label: '状态', type: 'radio', options: [{ value: 1, label: '启用' }, { value: 0, label: '停用' }], span: 12 }]
const formRules = { code: [{ required: true, message: '请输入编码', trigger: 'blur' }], name: [{ required: true, message: '请输入名称', trigger: 'blur' }] }
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10 })
const formData = reactive({ id: undefined, code: '', name: '', type: 'company', parentId: '', legalRep: '', taxNo: '', phone: '', status: 1 })
function loadData() {
  loading.value = true
  try {
    const start = (queryParams.pageNum - 1) * queryParams.pageSize
    tableData.value = orgs.slice(start, start + queryParams.pageSize); total.value = orgs.length
  } finally { loading.value = false }
}
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增组织'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.type = 'company'; formData.status = 1; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑组织'; Object.assign(formData, r); dialogVisible.value = true }
function switchOrg() { ElMessageBox.prompt('请输入要切换的组织编码', '切换组织', { inputValue: currentOrg.value.code, inputPattern: /^\w+$/, inputErrorMessage: '请输入组织编码' }).then(({ value }) => { const o = orgs.find(x => x.code === value); if (!o) return ElMessage.error('组织编码不存在'); currentOrg.value = o; ElMessage.success(`已切换到「${o.name}」`) }).catch(() => {}) }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除「${row.name}」?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
function getActions(row) {
  return [
    { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit },
    { key: 'switch', label: '切换', type: 'success', handler: (r) => { currentOrg.value = r; ElMessage.success(`已切换到「${r.name}」`) } },
    { key: 'toggle', label: row.status === 1 ? '停用' : '启用', type: 'warning', handler: (r) => { r.status = r.status === 1 ? 0 : 1; ElMessage.success(r.status === 1 ? '已启用' : '已停用') } },
    { key: 'delete', label: '删除', type: 'danger', handler: handleDelete }
  ]
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
<style lang="scss" scoped>
.org-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 20px }
.stat-card { padding: 20px; background: linear-gradient(135deg, #fff, #f5f7fa); border: 1px solid #ebeef5; border-radius: 8px; text-align: center }
.stat-label { font-size: 13px; color: #909399; margin-bottom: 8px }
.stat-value { font-size: 22px; font-weight: 700; color: #303133 }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
