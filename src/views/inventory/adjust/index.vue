<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新增调整单</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #adjustType="{ row }"><el-tag :type="row.adjustType === 'increase' ? 'success' : 'danger'" size="small">{{ row.adjustType === 'increase' ? '增加' : '减少' }}</el-tag></template>
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'warning'">{{ row.status === 1 ? '已完成' : '待审核' }}</BaseStatusTag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleView(row)">查看</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" title="新增调整单" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>
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
import BaseStatusTag from '@/components/BaseStatusTag.vue'

const searchItems = [ { prop: 'adjustNo', label: '调整单号', type: 'input' }, { prop: 'goodsName', label: '商品名称', type: 'input' } ]
const columns = [ { prop: 'adjustNo', label: '调整单号', width: 190 }, { prop: 'goodsName', label: '商品', width: 130 }, { prop: 'adjustType', label: '类型', width: 80, slot: 'adjustType' }, { prop: 'adjustQty', label: '数量', width: 80, align: 'center' }, { prop: 'reason', label: '原因', minWidth: 150, showOverflowTooltip: true }, { prop: 'operator', label: '操作人', width: 90 }, { prop: 'status', label: '状态', width: 90, slot: 'status' }, { prop: 'createTime', label: '创建时间', width: 170 } ]
const formItems = [ { prop: 'adjustNo', label: '调整单号', type: 'input', span: 12 }, { prop: 'goodsName', label: '商品名称', type: 'input', span: 12 }, { prop: 'adjustType', label: '类型', type: 'radio', span: 12, options: [{ value: 'increase', label: '增加' }, { value: 'decrease', label: '减少' }] }, { prop: 'adjustQty', label: '数量', type: 'number', span: 12 }, { prop: 'reason', label: '原因', type: 'textarea', rows: 3, span: 24 } ]
const formRules = { adjustNo: [{ required: true, message: '请输入调整单号', trigger: 'blur' }], goodsName: [{ required: true, message: '请选择商品', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, adjustNo: '', goodsName: '' })
const formData = reactive({ id: undefined, adjustNo: '', goodsName: '', adjustType: 'increase', adjustQty: undefined, reason: '' })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/inventory/adjust/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleView(r) { ElMessage.info(`查看: ${r.adjustNo}`) }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('提交成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('提交失败') } finally { submitLoading.value = false } }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
