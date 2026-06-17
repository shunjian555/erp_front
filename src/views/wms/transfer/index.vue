<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新建调拨单</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><el-tag :type="transferStatusMap[row.status]?.type || 'info'" size="small">{{ transferStatusMap[row.status]?.label || '未知' }}</el-tag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleView(row)">查看</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" title="新建调拨单" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'

const transferStatusMap = { 0: { label: '待审核', type: 'warning' }, 1: { label: '已审核', type: '' }, 2: { label: '已发出', type: 'success' }, 3: { label: '已接收', type: 'success' } }
const searchItems = [ { prop: 'transferNo', label: '调拨单号', type: 'input' }, { prop: 'goodsName', label: '商品名称', type: 'input' } ]
const columns = [ { prop: 'transferNo', label: '调拨单号', width: 190 }, { prop: 'fromWarehouse', label: '源仓库', width: 120 }, { prop: 'toWarehouse', label: '目标仓库', width: 120 }, { prop: 'goodsName', label: '商品', width: 130 }, { prop: 'quantity', label: '数量', width: 80, align: 'center' }, { prop: 'operator', label: '操作人', width: 90 }, { prop: 'status', label: '状态', width: 90, slot: 'status' }, { prop: 'createTime', label: '创建时间', width: 170 } ]
const formItems = [ { prop: 'transferNo', label: '调拨单号', type: 'input', span: 12 }, { prop: 'goodsName', label: '商品名称', type: 'input', span: 12 }, { prop: 'fromWarehouse', label: '源仓库', type: 'input', span: 12 }, { prop: 'toWarehouse', label: '目标仓库', type: 'input', span: 12 }, { prop: 'quantity', label: '数量', type: 'number', span: 12 }, { prop: 'reason', label: '原因', type: 'textarea', rows: 3, span: 24 } ]
const formRules = { transferNo: [{ required: true, message: '请输入调拨单号', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, transferNo: '', goodsName: '' })
const formData = reactive({ id: undefined, transferNo: '', goodsName: '', fromWarehouse: '', toWarehouse: '', quantity: undefined, reason: '' })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/wms/transfer/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleView(r) { ElMessage.info(`查看: ${r.transferNo}`) }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('提交成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('提交失败') } finally { submitLoading.value = false } }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
