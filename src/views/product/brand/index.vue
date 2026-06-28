<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">{{ $t('product.addBrand') }}</el-button>
        <el-button :icon="Delete" plain @click="handleBatchDelete">{{ $t('common.delete') }}</el-button>
      </div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #logo="{ row }">
        <el-image v-if="row.logo" :src="row.logo" style="width: 32px; height: 32px" fit="contain" :preview-src-list="[row.logo]">
          <template #error><div class="logo-fallback">{{ row.name?.charAt(0) }}</div></template>
        </el-image>
        <div v-else class="logo-fallback">{{ row.name?.charAt(0) }}</div>
      </template>
      <template #status="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? $t('common.enable') : $t('common.disable') }}</el-tag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">{{ $t('common.delete') }}</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="550px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="1" /></BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const searchItems = computed(() => [ { prop: 'name', label: t('product.brandName'), type: 'input' } ])
const columns = computed(() => [ { prop: 'name', label: t('product.brandName'), width: 180 }, { prop: 'logo', label: t('product.brandLogo'), width: 100, slot: 'logo' }, { prop: 'description', label: t('product.brandDesc'), minWidth: 200, showOverflowTooltip: true }, { prop: 'sort', label: t('product.brandSort'), width: 80, align: 'center' }, { prop: 'status', label: t('product.brandStatus'), width: 90, slot: 'status' }, { prop: 'createTime', label: t('product.brandCreateTime'), width: 170 } ])
const formItems = computed(() => [ { prop: 'name', label: t('product.brandName'), type: 'input' }, { prop: 'description', label: t('product.brandDesc'), type: 'textarea', rows: 3 }, { prop: 'sort', label: t('product.brandSort'), type: 'number' }, { prop: 'status', label: t('product.brandStatus'), type: 'radio', options: [{ value: 1, label: t('common.enable') }, { value: 0, label: t('common.disable') }] } ])
const formRules = computed(() => ({ name: [{ required: true, message: t('product.inputBrandName'), trigger: 'blur' }] }))

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, name: '' })
const formData = reactive({ id: undefined, name: '', description: '', sort: 0, status: 1 })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/product/brand/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }
function handleAdd() { dialogTitle.value = t('product.addBrand'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = t('product.editBrand'); Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('common.success')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('common.failed')) } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(t('product.deleteBrandConfirm'), t('header.tips'), { type: 'warning' }); ElMessage.success(t('common.success')); loadData() }
async function handleBatchDelete() { if (!selectedRows.value.length) return ElMessage.warning(t('product.selectCategory')); await ElMessageBox.confirm(t('product.batchDeleteConfirm'), t('header.tips'), { type: 'warning' }); ElMessage.success(t('common.success')); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
.logo-fallback { width: 32px; height: 32px; border-radius: 4px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; }
</style>
