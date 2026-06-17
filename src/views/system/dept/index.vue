<template>
  <div class="page-container">
    <div class="table-toolbar" style="margin-bottom: 16px">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd(null)">新增部门</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <el-table :data="tableData" v-loading="loading" row-key="id" border default-expand-all :tree-props="{ children: 'children' }">
      <el-table-column prop="name" label="部门名称" min-width="180" />
      <el-table-column prop="code" label="编码" width="120" />
      <el-table-column prop="leader" label="负责人" width="110" />
      <el-table-column prop="phone" label="电话" width="130" />
      <el-table-column prop="userCount" label: "人数" width="80" align="center" />
      <el-table-column prop="sort" label: "排序" width="70" align="center" />
      <el-table-column prop="status" label: "状态" width="80" align="center">
        <template #default="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '正常' : '停用' }}</BaseStatusTag></template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleAdd(row)">新增</el-button>
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="500px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" /></BaseDialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'

const loading = ref(false), tableData = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const formData = ref({ id: undefined, parentId: 0, name: '', code: '', leader: '', phone: '', sort: 0, status: 1 })
const formItems = [
  { prop: 'name', label: '名称', type: 'input' },
  { prop: 'code', label: '编码', type: 'input' },
  { prop: 'leader', label: '负责人', type: 'input' },
  { prop: 'phone', label: '电话', type: 'input' },
  { prop: 'sort', label: '排序', type: 'number' }
]
const formRules = { name: [{ required: true, message: '请输入名称', trigger: 'blur' }] }

async function loadData() {
  loading.value = true
  try {
    tableData.value = [
      { id: 1, parentId: 0, name: '总公司', code: 'HQ001', leader: '张总', phone: '010-88888888', userCount: 50, sort: 1, status: 1, children: [
        { id: 11, parentId: 1, name: '技术部', code: 'TECH001', leader: '李工', phone: '010-88888801', userCount: 15, sort: 1, status: 1, children: [] },
        { id: 12, parentId: 1, name: '销售部', code: 'SALES001', leader: '王经理', phone: '010-88888802', userCount: 20, sort: 2, status: 1, children: [] },
        { id: 13, parentId: 1, name: '财务部', code: 'FINANCE001', leader: '赵主管', phone: '010-88888803', userCount: 8, sort: 3, status: 1, children: [] },
        { id: 14, parentId: 1, name: '行政部', code: 'ADMIN001', leader: '孙主管', phone: '010-88888804', userCount: 7, sort: 4, status: 1, children: [] }
      ]}
    ]
  } finally { loading.value = false }
}
function handleAdd(parent) {
  dialogTitle.value = parent ? `在"${parent.name}"下新增` : '新增顶级部门'
  formData.value = { id: undefined, parentId: parent?.id || 0, name: '', code: '', leader: '', phone: '', sort: 0, status: 1 }
  dialogVisible.value = true
}
function handleEdit(row) { dialogTitle.value = '编辑部门'; formData.value = { ...row }; dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('保存成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('保存失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除"${row.name}"?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.table-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
