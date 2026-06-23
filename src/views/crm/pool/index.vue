<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">录入公海客户</el-button>
        <el-button type="warning" :icon="Refresh" plain @click="handleClaim">批量认领</el-button>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" />
      </div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="rows => selectedRows = rows" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #level="{ row }">
        <el-tag :type="row.level === 'A' ? 'danger' : row.level === 'B' ? 'warning' : 'info'" size="small">{{ row.level }}级</el-tag>
      </template>
      <template #status="{ row }">
        <el-tag :type="row.status === '未分配' ? 'danger' : 'success'" size="small">{{ row.status }}</el-tag>
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

    <!-- 录入公海客户弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false" @close="cancelDialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="客户名称" prop="name"><el-input v-model="formData.name" /></el-form-item>
        <el-form-item label="所属行业" prop="industry">
          <el-select v-model="formData.industry" style="width: 100%">
            <el-option v-for="o in industryOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户级别" prop="level">
          <el-select v-model="formData.level" style="width: 100%">
            <el-option v-for="o in levelOptions" :key="o" :value="o" :label="`${o}级`" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户来源" prop="source">
          <el-select v-model="formData.source" style="width: 100%">
            <el-option v-for="o in sourceOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系人" prop="contact"><el-input v-model="formData.contact" /></el-form-item>
        <el-form-item label="联系电话" prop="phone"><el-input v-model="formData.phone" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情 -->
    <el-dialog v-model="viewVisible" title="公海客户详情" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="客户名称">{{ viewRow.name }}</el-descriptions-item>
        <el-descriptions-item label="所属行业">{{ viewRow.industry }}</el-descriptions-item>
        <el-descriptions-item label="客户级别">{{ viewRow.level }}级</el-descriptions-item>
        <el-descriptions-item label="客户来源">{{ viewRow.source }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ viewRow.contact }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ viewRow.phone }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ viewRow.status }}</el-descriptions-item>
        <el-descriptions-item label="进入公海时间">{{ viewRow.createTime }}</el-descriptions-item>
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

const searchItems = [
  { prop: 'name', label: '客户名称', type: 'input' },
  { prop: 'level', label: '客户级别', type: 'select', options: [
    { value: 'A', label: 'A级' }, { value: 'B', label: 'B级' }, { value: 'C', label: 'C级' }, { value: 'D', label: 'D级' }
  ]}
]
const columns = [
  { prop: 'name', label: '客户名称', minWidth: 200 },
  { prop: 'industry', label: '行业', width: 120 },
  { prop: 'level', label: '客户级别', width: 100, slot: 'level' },
  { prop: 'source', label: '客户来源', width: 120 },
  { prop: 'contact', label: '联系人', width: 100 },
  { prop: 'phone', label: '联系电话', width: 140 },
  { prop: 'status', label: '状态', width: 100, slot: 'status' },
  { prop: 'createTime', label: '进入公海时间', width: 170 }
]
const industryOptions = ['制造业', '服务业', '建筑业', 'IT行业', '金融业', '物流业', '化工业', '零售业']
const sourceOptions = ['展会推广', '网络搜索', '客户介绍', '陌拜', '电话营销', '广告投放']
const levelOptions = ['A', 'B', 'C', 'D']

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref('录入公海客户'), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, name: '', level: '' })
const formData = reactive({ id: undefined, name: '', industry: '制造业', level: 'C', source: '网络搜索', contact: '', phone: '' })
const formRules = { name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }] }
const names = ['华阳机械', '正泰电气', '盛达物流', '永盛建材', '东升电子', '信达软件', '天源化工', '华鑫科技', '中创光电', '远东智能']
const industries = ['制造业', '服务业', '建筑业', 'IT行业', '金融业', '物流业', '化工业', '零售业']
const sources = ['展会推广', '网络搜索', '客户介绍', '陌拜', '电话营销', '广告投放']
const levels = ['A', 'B', 'C', 'D']

async function loadData() {
  loading.value = true
  try {
    const { name = '', level = '', pageNum = 1, pageSize = 10 } = queryParams
    const all = Array.from({ length: 45 }, (_, i) => ({
      id: i + 1,
      name: names[i % names.length] + '有限公司',
      industry: industries[i % industries.length],
      level: levels[i % levels.length],
      source: sources[i % sources.length],
      contact: ['张经理', '李总', '王主管', '赵助理', '陈先生', '刘女士'][i % 6],
      phone: `138${String(10000000 + i).slice(-8)}`,
      status: i % 3 === 0 ? '未分配' : '可领取',
      createTime: `2025-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 09:00:00`
    }))
    let filtered = all
    if (name) filtered = filtered.filter(x => x.name.includes(name))
    if (level) filtered = filtered.filter(x => x.level === level)
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '录入公海客户'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.industry = '制造业'; formData.level = 'C'; formData.source = '网络搜索'; dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = '编辑客户'; Object.assign(formData, row); dialogVisible.value = true }
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
async function handleClaimOne(row) {
  await ElMessageBox.confirm(`确定认领「${row.name}」到我的客户?`, '提示', { type: 'warning' })
  ElMessage.success('认领成功')
  loadData()
}
async function handleClaim() {
  if (!selectedRows.value.length) return ElMessage.warning('请选择要认领的客户')
  await ElMessageBox.confirm(`确定认领 ${selectedRows.value.length} 个客户?`, '提示', { type: 'warning' })
  ElMessage.success('认领成功')
  loadData()
}
function getActions(row) {
  return [
    { key: 'view', label: '查看', type: 'primary', handler: handleView },
    { key: 'claim', label: '认领', type: 'success', handler: handleClaimOne },
    { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit }
  ]
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
