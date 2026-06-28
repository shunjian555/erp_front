<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">{{ $t('oa.publishNotice') }}</el-button><el-button :icon="Delete" plain @click="handleBatchDelete">{{ $t('common.delete') }}</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #top="{ row }"><el-tag v-if="row.isTop" type="danger" size="small">{{ $t('oa.isTop') }}</el-tag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">{{ $t('common.delete') }}</el-button></template>
    </BaseTable>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" :close-on-click-modal="false" @close="cancelDialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item :label="$t('oa.noticeTitle')" prop="title">
          <el-input v-model="formData.title" :placeholder="$t('oa.inputNoticeTitle')" />
        </el-form-item>
        <el-form-item :label="$t('oa.type')" prop="type">
          <el-select v-model="formData.type" :placeholder="$t('oa.selectType')" style="width: 100%">
            <el-option v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('oa.content')" prop="content">
          <RichEditor v-model="formData.content" :placeholder="$t('oa.inputNoticeContent')" />
        </el-form-item>
        <el-form-item :label="$t('oa.isTop')" prop="isTop">
          <el-switch v-model="formData.isTop" :active-text="$t('oa.yes')" :inactive-text="$t('oa.no')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import RichEditor from '@/components/RichEditor.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const typeOptions = computed(() => [{ value: 'notice', label: t('oa.typeNotice') }, { value: 'policy', label: t('oa.typePolicy') }, { value: 'activity', label: t('oa.typeActivity') }])
const searchItems = computed(() => [
  { prop: 'title', label: t('oa.noticeTitle'), type: 'input' },
  { prop: 'type', label: t('oa.type'), type: 'select', options: typeOptions.value }
])
const columns = computed(() => [
  { prop: 'title', label: t('oa.noticeTitle'), minWidth: 200 },
  { prop: 'type', label: t('oa.type'), width: 90 },
  { prop: 'publisher', label: t('oa.publisher'), width: 100 },
  { prop: 'isTop', label: t('oa.isTop'), width: 70, slot: 'top' },
  { prop: 'readCount', label: t('oa.readCount'), width: 80, align: 'center' },
  { prop: 'publishTime', label: t('oa.publishTime'), width: 170 }
])
const formRules = computed(() => ({
  title: [{ required: true, message: t('oa.inputTitle'), trigger: 'blur' }],
  content: [{ required: true, message: t('oa.inputContent'), trigger: 'blur' }]
}))

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, title: '', type: '' })
const formData = reactive({ id: undefined, title: '', type: '', content: '', isTop: false })

async function loadData() {
  loading.value = true
  try {
    const res = await (await import('@/utils/request')).default({ url: '/api/oa/notice/list', method: 'get', params: queryParams })
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
  } finally { loading.value = false }
}

function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }
function handleAdd() { dialogTitle.value = t('oa.publishNotice'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = t('oa.editNotice'); Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('oa.operationSuccess')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('oa.operationFailed')) } finally { submitLoading.value = false }
}
async function handleDelete(row) { await ElMessageBox.confirm(t('oa.confirmDelete'), t('header.tips'), { type: 'warning' }); ElMessage.success(t('oa.deleteSuccess')); loadData() }
async function handleBatchDelete() { if (!selectedRows.value.length) return ElMessage.warning(t('oa.selectData')); await ElMessageBox.confirm(t('oa.batchDeleteConfirm'), t('header.tips'), { type: 'warning' }); ElMessage.success(t('oa.deleteSuccess')); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container {
  .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
}
</style>
