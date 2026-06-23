<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增跟进</el-button>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" />
      </div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #method="{ row }">
        <el-tag :type="row.method === '电话' ? 'success' : row.method === '拜访' ? 'warning' : 'info'" size="small">{{ row.method }}</el-tag>
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
        <el-form-item label="客户名称" prop="customer"><el-input v-model="formData.customer" /></el-form-item>
        <el-form-item label="联系人" prop="contact"><el-input v-model="formData.contact" /></el-form-item>
        <el-form-item label="跟进方式" prop="method">
          <el-select v-model="formData.method" style="width: 100%">
            <el-option v-for="o in methodOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="跟进内容" prop="content"><el-input v-model="formData.content" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="跟进结果" prop="result">
          <el-select v-model="formData.result" style="width: 100%">
            <el-option v-for="o in resultOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="跟进时间" prop="followTime"><el-input v-model="formData.followTime" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情 -->
    <el-dialog v-model="viewVisible" title="跟进记录详情" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="客户名称">{{ viewRow.customer }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ viewRow.contact }}</el-descriptions-item>
        <el-descriptions-item label="跟进方式">{{ viewRow.method }}</el-descriptions-item>
        <el-descriptions-item label="跟进结果">{{ viewRow.result }}</el-descriptions-item>
        <el-descriptions-item label="跟进人">{{ viewRow.follower }}</el-descriptions-item>
        <el-descriptions-item label="跟进时间">{{ viewRow.followTime }}</el-descriptions-item>
        <el-descriptions-item label="跟进内容" :span="2">{{ viewRow.content }}</el-descriptions-item>
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
  { prop: 'customer', label: '客户名称', type: 'input' },
  { prop: 'method', label: '跟进方式', type: 'select', options: [
    { value: '电话', label: '电话' }, { value: '拜访', label: '拜访' },
    { value: '微信', label: '微信' }, { value: '邮件', label: '邮件' }
  ]}
]
const columns = [
  { prop: 'customer', label: '客户名称', width: 180 },
  { prop: 'contact', label: '联系人', width: 100 },
  { prop: 'method', label: '跟进方式', width: 100, slot: 'method' },
  { prop: 'content', label: '跟进内容', minWidth: 240, showOverflowTooltip: true },
  { prop: 'result', label: '跟进结果', width: 120 },
  { prop: 'follower', label: '跟进人', width: 100 },
  { prop: 'followTime', label: '跟进时间', width: 170 }
]
const methodOptions = ['电话', '拜访', '微信', '邮件']
const resultOptions = ['有意向', '已报价', '需跟进', '已成交', '暂不合作']

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref('新增跟进'), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, customer: '', method: '' })
const formData = reactive({ id: undefined, customer: '', contact: '', method: '电话', content: '', result: '需跟进', follower: '', followTime: '' })
const customers = ['华为技术有限公司', '小米科技', '比亚迪汽车', '宁德时代新能源', '海康威视', '京东方科技', '三一重工']
const contacts = ['张经理', '李总', '王主管', '赵助理', '陈先生', '刘女士']
const methods = ['电话', '拜访', '微信', '邮件']
const results = ['有意向', '已报价', '需跟进', '已成交', '暂不合作']
const followers = ['张伟', '李娜', '王强', '赵敏']

async function loadData() {
  loading.value = true
  try {
    const { customer = '', method = '', pageNum = 1, pageSize = 10 } = queryParams
    const all = Array.from({ length: 56 }, (_, i) => ({
      id: i + 1,
      customer: customers[i % customers.length],
      contact: contacts[i % contacts.length],
      method: methods[i % methods.length],
      content: ['已发送产品资料', '客户已报价', '需提供技术方案', '产品样件已签收', '客户要求现场演示', '合同细节沟通中'][i % 6],
      result: results[i % results.length],
      follower: followers[i % followers.length],
      followTime: `2025-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} ${String(i % 24).padStart(2, '0')}:00:00`
    }))
    let filtered = all
    if (customer) filtered = filtered.filter(x => x.customer.includes(customer))
    if (method) filtered = filtered.filter(x => x.method === method)
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增跟进'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.method = '电话'; formData.result = '需跟进'; dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = '编辑跟进'; Object.assign(formData, row); dialogVisible.value = true }
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
async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除「${row.customer}」的跟进记录?`, '提示', { type: 'warning' })
  ElMessage.success('删除成功')
  loadData()
}
function getActions(row) {
  return [
    { key: 'view', label: '查看', type: 'primary', handler: handleView },
    { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit },
    { key: 'delete', label: '删除', type: 'danger', handler: handleDelete }
  ]
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
