<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" v-permission="['purchase:supplier:add']" @click="handleAdd">{{ $t('purchase.addSupplier') }}</el-button>
        <el-button :icon="Delete" plain @click="handleBatchDelete">{{ $t('common.delete') }}</el-button>
        <el-button :icon="Download" plain>{{ $t('common.export') }}</el-button>
      </div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #level="{ row }"><el-tag :type="levelMap[row.level]?.type || 'info'" size="small">{{ levelMap[row.level]?.label || row.level }}</el-tag></template>
      <template #status="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? $t('purchase.supplierStatusNormal') : $t('purchase.supplierStatusDisabled') }}</el-tag></template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 3)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 3" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">{{ $t('common.moreActions') }}<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="action in getActions(row).slice(3)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="650px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>

    <el-dialog v-model="viewVisible" :title="$t('purchase.supplierDetail')" width="640px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="$t('purchase.supplierName')">{{ viewRow.supplierName }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.level')"><el-tag :type="levelMap[viewRow.level]?.type || 'info'" size="small">{{ levelMap[viewRow.level]?.label || viewRow.level }}</el-tag></el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.contactPerson')">{{ viewRow.contactPerson }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.phone')">{{ viewRow.phone }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.email')" :span="2">{{ viewRow.email || '—' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.address')" :span="2">{{ viewRow.address || '—' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.supplierStatus')"><el-tag :type="viewRow.status === 1 ? 'success' : 'danger'" size="small">{{ viewRow.status === 1 ? $t('purchase.supplierStatusNormal') : $t('purchase.supplierStatusDisabled') }}</el-tag></el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.supplierCreateTime')">{{ viewRow.createTime }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.supplierRemark')" :span="2">{{ viewRow.remark || '—' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Download, Refresh, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import request from '@/utils/request'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const levelMap = computed(() => ({ [t('purchase.levelStrategy')]: { label: t('purchase.levelStrategy'), type: 'danger' }, [t('purchase.levelCore')]: { label: t('purchase.levelCore'), type: 'warning' }, [t('purchase.levelNormal')]: { label: t('purchase.levelNormal'), type: 'info' } }))
const levelOptions = computed(() => [{ value: t('purchase.levelStrategy'), label: t('purchase.levelStrategy') }, { value: t('purchase.levelCore'), label: t('purchase.levelCore') }, { value: t('purchase.levelNormal'), label: t('purchase.levelNormal') }])
const searchItems = computed(() => [ { prop: 'supplierName', label: t('purchase.supplierName'), type: 'input' }, { prop: 'contactPerson', label: t('purchase.contactPerson'), type: 'input' }, { prop: 'phone', label: t('purchase.phone'), type: 'input' }, { prop: 'level', label: t('purchase.level'), type: 'select', options: levelOptions.value } ])
const columns = computed(() => [ { prop: 'supplierName', label: t('purchase.supplierName'), width: 160 }, { prop: 'contactPerson', label: t('purchase.contactPerson'), width: 110 }, { prop: 'phone', label: t('purchase.phone'), width: 130 }, { prop: 'address', label: t('purchase.address'), minWidth: 200, showOverflowTooltip: true }, { prop: 'level', label: t('purchase.level'), width: 80, slot: 'level' }, { prop: 'status', label: t('purchase.supplierStatus'), width: 80, slot: 'status' }, { prop: 'createTime', label: t('purchase.supplierCreateTime'), width: 170 } ])
const formItems = computed(() => [ { prop: 'supplierName', label: t('purchase.supplierName'), type: 'input', span: 12 }, { prop: 'contactPerson', label: t('purchase.contactPerson'), type: 'input', span: 12 }, { prop: 'phone', label: t('purchase.phone'), type: 'input', span: 12 }, { prop: 'email', label: t('purchase.email'), type: 'input', span: 12 }, { prop: 'address', label: t('purchase.address'), type: 'textarea', rows: 2, span: 24 }, { prop: 'level', label: t('purchase.level'), type: 'select', span: 12, options: levelOptions.value }, { prop: 'status', label: t('purchase.supplierStatus'), type: 'radio', span: 12, options: [{ value: 1, label: t('purchase.supplierStatusNormal') }, { value: 0, label: t('purchase.supplierStatusDisabled') }] }, { prop: 'remark', label: t('purchase.supplierRemark'), type: 'textarea', rows: 3, span: 24 } ])
const formRules = computed(() => ({ supplierName: [{ required: true, message: t('purchase.inputSupplierName'), trigger: 'blur' }], contactPerson: [{ required: true, message: t('purchase.inputContactPerson'), trigger: 'blur' }], phone: [{ required: true, message: t('purchase.inputPhone'), trigger: 'blur' }] }))

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, supplierName: '', contactPerson: '', phone: '', level: '' })
const formData = reactive({ id: undefined, supplierName: '', contactPerson: '', phone: '', email: '', address: '', level: '', status: 1, remark: '' })
const viewVisible = ref(false), viewRow = ref(null)

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/purchase/supplier/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }
function handleAdd() { dialogTitle.value = t('purchase.addSupplier'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.status = 1; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = t('purchase.editSupplier'); Object.assign(formData, r); dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('common.success')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('common.failed')) } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(t('purchase.deleteSupplierConfirm', { name: row.supplierName }), t('header.tips'), { type: 'warning' }); ElMessage.success(t('common.success')); loadData() }
async function handleBatchDelete() { if (!selectedRows.value.length) return ElMessage.warning(t('product.selectCategory')); await ElMessageBox.confirm(t('purchase.batchDeleteSupplierConfirm', { count: selectedRows.value.length }), t('header.tips'), { type: 'warning' }); ElMessage.success(t('common.success')); loadData() }
async function handleToggleStatus(row) { const next = row.status === 1 ? 0 : 1; const action = next === 1 ? t('purchase.supplierStatusNormal') : t('purchase.supplierStatusDisabled'); await ElMessageBox.confirm(t('purchase.toggleSupplierConfirm', { action, name: row.supplierName }), t('header.tips'), { type: 'warning' }); ElMessage.success(t('common.success')); loadData() }

function getActions(row) {
  return [
    { key: 'view', label: t('common.detail'), type: 'primary', handler: handleView },
    { key: 'edit', label: t('common.edit'), type: 'primary', handler: handleEdit },
    { key: 'toggle', label: row.status === 1 ? t('purchase.supplierStatusDisabled') : t('purchase.supplierStatusNormal'), type: row.status === 1 ? 'warning' : 'success', handler: handleToggleStatus },
    { key: 'delete', label: t('common.delete'), type: 'danger', handler: handleDelete }
  ]
}

function handleCommand(cmd, row) {
  const action = getActions(row).find(a => a.key === cmd)
  action?.handler(row)
}
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
