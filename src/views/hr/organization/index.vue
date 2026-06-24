<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-header-left">
        <h3>组织架构管理</h3>
        <p class="desc">管理公司组织架构、部门层级与人员编制</p>
      </div>
      <div class="page-header-right">
        <el-button type="primary" :icon="Plus" @click="handleAddDept">新增部门</el-button>
        <el-button type="success" :icon="Refresh" plain @click="loadTree">刷新</el-button>
      </div>
    </div>

    <div class="org-content">
      <!-- 左侧：树形组织架构 -->
      <div class="org-tree-panel">
        <div class="panel-header">
          <span class="panel-title">组织架构图</span>
          <el-switch v-model="expandAll" active-text="展开全部" inactive-text="收起" @change="handleExpandAll" />
        </div>
        <el-scrollbar>
          <el-tree
            ref="treeRef"
            :data="orgTree"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            default-expand-all
            highlight-current
            :expand-on-click-node="false"
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data }">
              <div class="tree-node">
                <span class="node-info">
                  <el-icon><OfficeBuilding /></el-icon>
                  <span class="node-name">{{ data.name }}</span>
                  <el-tag size="small" type="info" round>{{ data.employeeCount || 0 }}人</el-tag>
                </span>
                <span class="node-leader" v-if="data.leader">负责人：{{ data.leader }}</span>
              </div>
            </template>
          </el-tree>
        </el-scrollbar>
      </div>

      <!-- 右侧：部门详情/人员列表 -->
      <div class="org-detail-panel">
        <template v-if="currentNode">
          <div class="detail-header">
            <div class="dept-info">
              <h4>{{ currentNode.name }}</h4>
              <p>负责人：{{ currentNode.leader || '未设置' }} | 编制人数：{{ currentNode.employeeCount || 0 }}人</p>
            </div>
            <div class="dept-actions">
              <el-button type="primary" size="small" :icon="EditPen" @click="handleEditDept(currentNode)">编辑</el-button>
              <el-button type="primary" size="small" :icon="Plus" @click="handleAddChildDept(currentNode)">新增子部门</el-button>
              <el-popconfirm title="确定删除该部门？" @confirm="handleDeleteDept(currentNode)" confirm-button-text="确定" cancel-button-text="取消">
                <template #reference><el-button type="danger" size="small" :icon="Delete">删除</el-button></template>
              </el-popconfirm>
            </div>
          </div>

          <el-divider content-position="left">部门人员</el-divider>

          <BaseSearch :search-items="empSearchItems" @search="handleEmpSearch" @reset="handleEmpReset" />

          <el-table :data="deptEmployees" border stripe size="small" v-loading="empLoading">
            <el-table-column type="index" label="#" width="50" align="center" />
            <el-table-column prop="empNo" label="工号" width="110" />
            <el-table-column prop="name" label="姓名" width="90" />
            <el-table-column prop="position" label="职位" width="110" />
            <el-table-column prop="phone" label="手机号" width="130" />
            <el-table-column prop="email" label="邮箱" minWidth="150" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === '在职' ? 'success' : row.status === '试用期' ? 'warning' : 'info'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleSetLeader(row)">设为负责人</el-button>
                <el-button type="warning" link size="small" @click="handleTransferEmp(row)">调动</el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>

        <el-empty v-else description="请从左侧选择一个部门查看详情" :image-size="120" />
      </div>
    </div>

    <!-- 新增/编辑部门弹窗 -->
    <BaseDialog v-model="deptDialogVisible" :title="deptDialogTitle" width="520px" :confirm-loading="submitLoading" @confirm="handleSubmitDept" @cancel="deptDialogVisible = false">
      <BaseForm ref="deptFormRef" v-model="deptFormData" :form-items="deptFormItems" :form-rules="deptFormRules" :col-count="1" />
    </BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Refresh, EditPen, OfficeBuilding } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import { getOrgTree, getEmployeeList } from '@/api/hr'

const treeRef = ref(null)
const orgTree = ref([])
const currentNode = ref(null)
const expandAll = ref(true)
const deptEmployees = ref([])
const empLoading = ref(false)
const deptDialogVisible = ref(false)
const deptDialogTitle = ref('新增部门')
const submitLoading = ref(false)
const deptFormRef = ref(null)

const empSearchItems = [
  { prop: 'name', label: '姓名', type: 'input' },
  { prop: 'position', label: '职位', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: [
    { value: '', label: '全部' }, { value: '在职', label: '在职' }, { value: '试用期', label: '试用期' }
  ]}
]

const deptFormItems = [
  { prop: 'name', label: '部门名称 *', type: 'input' },
  { prop: 'leader', label: '负责人', type: 'input' },
  { prop: 'description', label: '部门描述', type: 'textarea', rows: 3 }
]
const deptFormRules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }]
}
const deptFormData = reactive({ id: undefined, name: '', leader: '', description: '' })

const empQueryParams = reactive({ name: '', position: '', status: '', deptName: '' })

async function loadTree() {
  const res = await getOrgTree()
  orgTree.value = res.data || []
  // 默认选中根节点
  if (orgTree.value.length && !currentNode.value) {
    currentNode.value = orgTree.value[0]
    loadDeptEmployees()
  }
}

function handleNodeClick(data) {
  currentNode.value = data
  empQueryParams.deptName = data.name
  loadDeptEmployees()
}

async function loadDeptEmployees() {
  if (!currentNode.value) return
  empLoading.value = true
  try {
    const res = await getEmployeeList({ ...empQueryParams, pageNum: 1, pageSize: 50 })
    deptEmployees.value = (res.data.list || []).filter(e => e.deptName === currentNode.value.name)
  } finally { empLoading.value = false }
}

function handleEmpSearch(p) { Object.assign(empQueryParams, p); loadDeptEmployees() }
function handleEmpReset() { Object.assign(empQueryParams, { name: '', position: '', status: '' }); loadDeptEmployees() }

function handleExpandAll(val) {
  const nodes = treeRef.value?.store?.nodesMap
  if (nodes) {
    Object.values(nodes).forEach(node => node.expanded = val)
  }
}

function handleAddDept() {
  deptDialogTitle.value = '新增部门（顶级）'
  Object.assign(deptFormData, { id: undefined, name: '', leader: '', description: '' })
  deptDialogVisible.value = true
}

function handleAddChildDept(node) {
  deptDialogTitle.value = `在「${node.name}」下新增子部门`
  Object.assign(deptFormData, { id: undefined, name: '', leader: '', description: '', parentId: node.id })
  deptDialogVisible.value = true
}

function handleEditDept(node) {
  deptDialogTitle.value = `编辑部门 - ${node.name}`
  Object.assign(deptFormData, { id: node.id, name: node.name, leader: node.leader || '', description: '' })
  deptDialogVisible.value = true
}

async function handleSubmitDept() {
  const valid = await deptFormRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    await new Promise(r => setTimeout(r, 400))
    ElMessage.success('操作成功'); deptDialogVisible.value = false; loadTree()
  } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false }
}

async function handleDeleteDept(node) {
  if (node.children && node.children.length) {
    return ElMessage.warning('该部门下存在子部门，无法删除')
  }
  ElMessage.success(`部门「${node.name}」已删除`); loadTree()
}

async function handleSetLeader(row) {
  await ElMessageBox.confirm(`确定将「${row.name}」设为「${currentNode.value.name}」的负责人？`, '设置负责人', { type: 'info' })
  ElMessage.success(`已将 ${row.name} 设为负责人`); loadTree()
}

async function handleTransferEmp(row) {
  ElMessage.info(`调动员工 ${row.name}...`)
}

onMounted(() => loadTree())
</script>

<style lang="scss" scoped>
.page-container {
  .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
    .page-header-left h3 { margin: 0 0 4px 0; font-size: 18px; font-weight: 700; }
    .desc { margin: 0; color: var(--text-secondary); font-size: 13px; }
  }
  .org-content { display: flex; gap: 16px; height: calc(100vh - 200px);
    .org-tree-panel { width: 320px; background: #fff; border-radius: var(--border-radius-base); box-shadow: var(--box-shadow-lighter); display: flex; flex-direction: column;
      .panel-header { padding: 14px 18px; border-bottom: 1px solid var(--border-color-lighter); display: flex; align-items: center; justify-content: space-between;
        .panel-title { font-weight: 600; font-size: 14px; }
      }
      .el-scrollbar { flex: 1; padding: 10px;
        .tree-node { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 4px 0;
          .node-info { display: flex; align-items: center; gap: 6px;
            .node-name { font-size: 13px; }
          }
          .node-leader { font-size: 11px; color: var(--text-secondary); }
        }
      }
    }
    .org-detail-panel { flex: 1; background: #fff; border-radius: var(--border-radius-base); box-shadow: var(--box-shadow-lighter); padding: 20px; overflow-y: auto;
      .detail-header { display: flex; align-items: flex-start; justify-content: space-between;
        .dept-info h4 { margin: 0 0 6px 0; }
        .dept-info p { margin: 0; color: var(--text-secondary); font-size: 13px; }
        .dept-actions { display: flex; gap: 8px; }
      }
    }
  }
}
</style>
