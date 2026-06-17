<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">生成条码</el-button><el-button :icon="Printer" plain>打印</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #barcode="{ row }"><div style="display: flex; align-items: center; gap: 8px"><span style="font-family: monospace; font-weight: 600">{{ row.barcode }}</span><el-tag size="small" :type="row.type === 'EAN13' ? '' : 'warning'">{{ row.type }}</el-tag></div></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handlePrint(row)">打印</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" title="生成条码" width="500px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" /></BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Printer, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'

const searchItems = [ { prop: 'barcode', label: '条码', type: 'input' }, { prop: 'goodsName', label: '商品名称', type: 'input' }, { prop: 'type', label: '类型', type: 'select', options: [{ value: '', label: '全部' }, { value: 'EAN13', label: 'EAN-13' }, { value: 'CODE128', label: 'Code128' }] } ]
const columns = [ { prop: 'barcode', label: '条码', width: 200, slot: 'barcode' }, { prop: 'goodsName', label: '商品名称', width: 150 }, { prop: 'batchNo', label: '批次号', width: 150 }, { prop: 'type', label: '类型', width: 90 }, { prop: 'quantity', label: '数量', width: 80, align: 'center' }, { prop: 'createTime', label: '创建时间', width: 170 } ]
const formItems = [ { prop: 'goodsName', label: '商品名称', type: 'input' }, { prop: 'batchNo', label: '批次号', type: 'input' }, { prop: 'quantity', label: '数量', type: 'number' }, { prop: 'type', label: '类型', type: 'select', options: [{ value: 'EAN13', label: 'EAN-13' }, { value: 'CODE128', label: 'Code128' }] } ]
const formRules = { goodsName: [{ required: true, message: '请输入商品名称', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, barcode: '', goodsName: '', type: '' })
const formData = reactive({ id: undefined, goodsName: '', batchNo: '', quantity: 1, type: 'EAN13' })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/wms/barcode/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }
function handleAdd() { Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handlePrint(row) { ElMessage.success(`打印条码: ${row.barcode}`) }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('条码生成成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('生成失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
