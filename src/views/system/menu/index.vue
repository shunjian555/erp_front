<template>
  <div class="page-container">
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd(null)">新增菜单</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <el-table :data="tableData" v-loading="loading" row-key="id" border default-expand-all :tree-props="{ children: 'children' }">
      <el-table-column prop="name" label="菜单名称" min-width="180" />
      <el-table-column prop="icon" label="图标" width="80" align="center">
        <template #default="{ row }"><el-icon v-if="row.icon" style="font-size: 16px"><component :is="row.icon" /></el-icon><span v-else>-</span></template>
      </el-table-column>
      <el-table-column prop="path" label="路由路径" width="180" />
      <el-table-column prop="component" label="组件路径" width="200" />
      <el-table-column prop="sort" label="排序" width="70" align="center" />
      <el-table-column prop="visible" label="可见" width="80" align="center">
        <template #default="{ row }"><el-tag :type="row.visible ? '' : 'info'" size="small">{{ row.visible ? '显示' : '隐藏' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleAdd(row)" v-if="row.type !== 2">新增</el-button>
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="550px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" /></BaseDialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'

const loading = ref(false), tableData = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const formData = ref({ id: undefined, parentId: 0, name: '', path: '', component: '', icon: '', sort: 0, visible: true })
const formItems = [
  { prop: 'name', label: '菜单名称', type: 'input' },
  { prop: 'path', label: '路由路径', type: 'input' },
  { prop: 'component', label: '组件路径', type: 'input' },
  { prop: 'icon', label: '图标', type: 'input' },
  { prop: 'sort', label: '排序', type: 'number' },
  { prop: 'visible', label: '显示', type: 'switch' }
]
const formRules = { name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }] }

async function loadData() {
  loading.value = true
  try {
    tableData.value = [
      { id: 1, parentId: 0, name: '系统管理', path: '/system', component: '', icon: 'Setting', sort: 1, visible: true, children: [
        { id: 11, parentId: 1, name: '用户管理', path: 'user', component: 'system/user/index', icon: 'User', sort: 1, visible: true, type: 1 },
        { id: 12, parentId: 1, name: '角色管理', path: 'role', component: 'system/role/index', icon: 'UserFilled', sort: 2, visible: true, type: 1 },
        { id: 13, parentId: 1, name: '菜单管理', path: 'menu', component: 'system/menu/index', icon: 'Menu', sort: 3, visible: true, type: 1 }
      ]},
      { id: 2, parentId: 0, name: '业务管理', path: '/business', component: '', icon: 'Briefcase', sort: 2, visible: true, children: [] }
    ]
  } finally { loading.value = false }
}
function handleAdd(parent) {
  dialogTitle.value = parent ? `在"${parent.name}"下新增` : '新增顶级菜单'
  formData.value = { id: undefined, parentId: parent?.id || 0, name: '', path: '', component: '', icon: '', sort: 0, visible: true }
  dialogVisible.value = true
}
function handleEdit(row) { dialogTitle.value = '编辑菜单'; formData.value = { ...row }; dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('保存成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('保存失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除"${row.name}"?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
