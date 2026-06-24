<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title-area">
        <h2 class="page-title">{{ t('crmContract.title') }}</h2>
        <p class="page-desc">{{ t('crmContract.desc') }}</p>
      </div>
      <div class="page-header-actions">
        <el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('crmContract.newContract') }}</el-button>
      </div>
    </div>

    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />

    <BaseTable ref="tableRef" :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page="queryParams.pageNum" :page-size="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #amount="{ row }"><span class="amount-text">{{ formatAmount(row.amount) }}</span></template>
      <template #status="{ row }">
        <el-tag :type="statusMap[row.status]?.type || 'info'" size="small" round effect="light">{{ statusMap[row.status]?.label || t('crmContract.unknown') }}</el-tag>
      </template>
      <template #operation="{ row }">
        <el-button type="primary" link size="small" @click="handleView(row)">{{ t('crmContract.view') }}</el-button>
        <el-button v-if="row.status === 0 || row.status === 1" type="primary" link size="small" @click="handleEdit(row)">{{ t('crmContract.edit') }}</el-button>
        <el-dropdown trigger="click" @command="(cmd) => handleExportCommand(cmd, row)">
          <el-button type="primary" link size="small">{{ t('crmContract.export') }}<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="pdf"><Document /> {{ t('crmContract.exportPdf') }}</el-dropdown-item>
              <el-dropdown-item command="word"><Notebook /> {{ t('crmContract.exportWord') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-popconfirm :title="t('crmContract.confirmDelete')" @confirm="handleDelete(row)" :confirm-button-text="t('common.confirm')" :cancel-button-text="t('common.cancel')">
          <template #reference>
            <el-button v-if="row.status === 0" type="danger" link size="small">{{ t('crmContract.delete') }}</el-button>
          </template>
        </el-popconfirm>
      </template>
    </BaseTable>

    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="760px" :confirm-loading="submitLoading" :confirm-text="t('crmContract.saveAndContinue')" :cancel-text="t('crmContract.cancel')" @confirm="handleSubmit" @cancel="cancelDialog">
      <div class="contract-form-wrapper">
        <el-steps :active="formStep" finish-status="success" align-center class="form-steps">
          <el-step :title="t('crmContract.stepBasic')" />
          <el-step :title="t('crmContract.stepClause')" />
          <el-step :title="t('crmContract.stepConfirm')" />
        </el-steps>

        <div v-show="formStep === 0" class="step-content">
          <BaseForm ref="basicFormRef" v-model="formData" :form-items="basicFormItems" :form-rules="basicFormRules" :col-count="2" />
        </div>

        <div v-show="formStep === 1" class="step-content">
          <BaseForm ref="clauseFormRef" v-model="formData" :form-items="clauseFormItems" :col-count="1" />
          <div class="sub-section">
            <div class="sub-header">
              <span class="sub-title">{{ t('crmContract.productDetail') }}</span>
              <el-button type="primary" plain size="small" :icon="Plus" @click="addProductRow">{{ t('crmContract.addProduct') }}</el-button>
            </div>
            <el-table :data="formData.products" border size="small" class="product-table">
              <el-table-column prop="name" :label="t('crmContract.productName')" min-width="140">
                <template #default="{ row }"><el-input v-model="row.name" :placeholder="t('crmContract.productPlaceholder')" size="small" /></template>
              </el-table-column>
              <el-table-column prop="spec" :label="t('crmContract.productSpec')" width="120">
                <template #default="{ row }"><el-input v-model="row.spec" :placeholder="t('crmContract.specPlaceholder')" size="small" /></template>
              </el-table-column>
              <el-table-column prop="quantity" :label="t('crmContract.productQuantity')" width="90">
                <template #default="{ row }"><el-input-number v-model="row.quantity" :min="1" :max="99999" controls-position="right" size="small" /></template>
              </el-table-column>
              <el-table-column prop="unitPrice" :label="t('crmContract.productUnitPrice')" width="110">
                <template #default="{ row }"><el-input-number v-model="row.unitPrice" :min="0" :precision="2" controls-position="right" size="small" /></template>
              </el-table-column>
              <el-table-column prop="amount" :label="t('crmContract.productSubtotal')" width="100" align="right">
                <template #default="{ row }"><span class="sub-total">{{ (row.quantity * row.unitPrice).toFixed(2) }}</span></template>
              </el-table-column>
              <el-table-column :label="t('crmContract.productOperation')" width="60" align="center">
                <template #default="{ $index }"><el-button type="danger" link size="small" @click="removeProductRow($index)"><Delete /></el-button></template>
              </el-table-column>
            </el-table>
            <div class="product-summary">{{ t('crmContract.productTotal') }}<span class="summary-amount">{{ productsTotal.toFixed(2) }} {{ t('crmContract.productTotalUnit') }}</span></div>
          </div>
        </div>

        <div v-show="formStep === 2" class="step-content step-confirm">
          <div class="confirm-card">
            <h4>{{ t('crmContract.contractInfoConfirm') }}</h4>
            <div class="confirm-grid">
              <div class="cf-item"><span class="cfl">{{ t('crmContract.contractNoConfirm') }}</span><span class="cfv highlight">{{ formData.contractNo }}</span></div>
              <div class="cf-item"><span class="cfl">{{ t('crmContract.customerNameConfirm') }}</span><span class="cfv">{{ formData.customerName }}</span></div>
              <div class="cf-item"><span class="cfl">{{ t('crmContract.totalAmount') }}</span><span class="cfv amount-big">{{ formatAmount(formData.amount || productsTotal) }}</span></div>
              <div class="cf-item"><span class="cfl">{{ t('crmContract.contractPeriod') }}</span><span class="cfv">{{ formData.startDate }} ~ {{ formData.endDate }}</span></div>
              <div class="cf-item full"><span class="cfl">{{ t('crmContract.paymentMethodConfirm') }}</span><span class="cfv">{{ paymentMethodMap[formData.paymentMethod] || formData.paymentMethod }}</span></div>
              <div class="cf-item full"><span class="cfl">{{ t('crmContract.deliveryMethodConfirm') }}</span><span class="cfv">{{ deliveryMethodMap[formData.deliveryMethod] || formData.deliveryMethod }}</span></div>
              <div class="cf-item full"><span class="cfl">{{ t('crmContract.productSummary') }}</span><span class="cfv">{{ formData.products.length }} {{ t('crmContract.productCount', { count: formData.products.length, total: productsTotal.toFixed(2) }) }}</span></div>
            </div>
          </div>
          <el-alert type="info" :closable="false" show-icon>
            <template #title>{{ t('crmContract.submitAlert') }}</template>
          </el-alert>
        </div>

        <div class="step-actions" v-if="formStep > 0 && formStep < 2">
          <el-button @click="formStep--">{{ t('crmContract.prevStep') }}</el-button>
        </div>
        <div class="step-actions" v-if="formStep < 2">
          <el-button type="primary" @click="nextStep">{{ t('crmContract.nextStep') }}</el-button>
        </div>
      </div>
    </BaseDialog>

    <el-drawer v-model="drawerVisible" direction="rtl" size="720px" :destroy-on-close="true">
      <template #header>
        <div class="drawer-header">
          <span class="header-title">{{ t('crmContract.contractPreview') }}</span>
          <el-tag :type="statusMap[previewData?.status]?.type || 'info'" size="small">{{ statusMap[previewData?.status]?.label || '' }}</el-tag>
        </div>
      </template>
      <div class="preview-container" v-if="previewData">
        <div class="preview-toolbar">
          <el-button-group>
            <el-button type="primary" @click="exportContract('pdf')"><el-icon style="margin-right:4px"><Document /></el-icon> {{ t('crmContract.exportPdf') }}</el-button>
            <el-button type="success" @click="exportContract('word')"><el-icon style="margin-right:4px"><Notebook /></el-icon> {{ t('crmContract.exportWord') }}</el-button>
          </el-button-group>
          <el-button :icon="Printer" @click="printContract">{{ t('crmContract.printContract') }}</el-button>
        </div>

        <div id="contract-print-area" class="contract-paper">
          <div class="paper-title-area">
            <h1 class="paper-main-title">{{ t('crmContract.salesContract') }}</h1>
            <p class="paper-sub-title">{{ t('crmContract.salesContractEn') }}</p>
          </div>
          <div class="paper-meta-row">
            <span>{{ t('crmContract.contractNoLabel2') }}{{ previewData.contractNo }}</span>
            <span>{{ t('crmContract.signDateLabel') }}{{ previewData.signDate || previewData.createTime?.substring(0, 10) }}</span>
          </div>
          <div class="party-info">
            <div class="party party-a">
              <h5>{{ t('crmContract.partyA') }}</h5>
              <div class="party-detail">
                <p>{{ t('crmContract.nameLabel') }}{{ previewData.sellerName || 'XX Tech Co., Ltd.' }}</p>
                <p>{{ t('crmContract.addressLabel') }}{{ previewData.sellerAddress || '88 Keji Road, Chaoyang, Beijing' }}</p>
                <p>{{ t('crmContract.contactLabel') }}{{ previewData.sellerContact || 'Manager Zhang' }}</p>
                <p>{{ t('crmContract.phoneLabel') }}{{ previewData.sellerPhone || '010-8888-8888' }}</p>
              </div>
            </div>
            <div class="party party-b">
              <h5>{{ t('crmContract.partyB') }}</h5>
              <div class="party-detail">
                <p>{{ t('crmContract.nameLabel') }}{{ previewData.customerName }}</p>
                <p>{{ t('crmContract.addressLabel') }}{{ previewData.buyerAddress || '-' }}</p>
                <p>{{ t('crmContract.contactLabel') }}{{ previewData.contactPerson || '-' }}</p>
                <p>{{ t('crmContract.phoneLabel') }}{{ previewData.contactPhone || '-' }}</p>
              </div>
            </div>
          </div>
          <div class="clauses-section">
            <h4 class="section-head">{{ t('crmContract.clause1') }}</h4>
            <table class="clause-table">
              <thead>
                <tr><th>{{ t('crmContract.productQuantity') }}</th><th>{{ t('crmContract.productName') }}</th><th>{{ t('crmContract.productSpec') }}</th><th>{{ t('crmContract.productQuantity') }}</th><th>{{ t('crmContract.productUnitPrice') }}</th><th>{{ t('crmContract.productSubtotal') }}</th></tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in previewData.products" :key="idx">
                  <td>{{ idx + 1 }}</td><td>{{ item.name }}</td><td>{{ item.spec || '-' }}</td><td>{{ item.quantity }}</td><td>{{ item.unitPrice.toFixed(2) }}</td><td>{{ (item.quantity * item.unitPrice).toFixed(2) }}</td>
                </tr>
                <tr v-if="!previewData.products?.length"><td colspan="6" style="text-align:center;color:#999;">{{ t('crmContract.noProductDetail') }}</td></tr>
                <tr class="total-row"><td colspan="5" style="text-align:right;font-weight:600;">{{ t('crmContract.totalAmountLabel') }}</td><td class="grand-total">{{ (previewData.amount || 0).toFixed(2) }}</td></tr>
              </tbody>
            </table>
            <h4 class="section-head">{{ t('crmContract.clause2') }}</h4>
            <p class="clause-text">{{ paymentDescMap[previewData.paymentMethod] || previewData.paymentMethod || t('crmContract.seeDetail') }}</p>
            <h4 class="section-head">{{ t('crmContract.clause3') }}</h4>
            <p class="clause-text">{{ deliveryDescMap[previewData.deliveryMethod] || previewData.deliveryMethod || t('crmContract.seeDetail') }}</p>
            <h4 class="section-head">{{ t('crmContract.clause4') }}</h4>
            <p class="clause-text">{{ previewData.qualityClause || t('crmContract.clause4Default') }}</p>
            <h4 class="section-head">{{ t('crmContract.clause5') }}</h4>
            <p class="clause-text">{{ previewData.penaltyClause || t('crmContract.clause5Default') }}</p>
            <h4 class="section-head">{{ t('crmContract.clause6') }}</h4>
            <p class="clause-text">{{ t('crmContract.clause6Text') }}</p>
            <h4 class="section-head">{{ t('crmContract.clause7') }}</h4>
            <p class="clause-text">{{ previewData.remark || t('crmContract.clause7Default') }}</p>
          </div>
          <div class="signature-area">
            <div class="sig-party sig-a"><p>{{ t('crmContract.partyASign') }}</p><p>{{ t('crmContract.authorizedRep') }}</p><p>{{ t('crmContract.dateLabel') }}</p></div>
            <div class="sig-party sig-b"><p>{{ t('crmContract.partyBSign') }}</p><p>{{ t('crmContract.authorizedRep') }}</p><p>{{ t('crmContract.dateLabel') }}</p></div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Refresh, ArrowDown, Document, Notebook, Printer } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { jsPDF } from 'jspdf'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'

const { t } = useI18n()

const searchItems = computed(() => [
  { prop: 'contractNo', label: t('crmContract.contractNo'), type: 'input', defaultValue: '' },
  { prop: 'customerName', label: t('crmContract.customerName'), type: 'input', defaultValue: '' },
  { prop: 'status', label: t('crmContract.status'), type: 'select', options: [
    { value: 0, label: t('crmContract.draft') }, { value: 1, label: t('crmContract.pendingReview') },
    { value: 2, label: t('crmContract.executing') }, { value: 3, label: t('crmContract.completed') },
    { value: 4, label: t('crmContract.terminated') }
  ], defaultValue: '' }
])

const columns = computed(() => [
  { prop: 'contractNo', label: t('crmContract.contractNo'), minWidth: 170, fixed: 'left' },
  { prop: 'customerName', label: t('crmContract.customerName'), minWidth: 130 },
  { prop: 'amount', label: t('crmContract.amount'), width: 120, slot: 'amount' },
  { prop: 'startDate', label: t('crmContract.startDate'), width: 110 },
  { prop: 'endDate', label: t('crmContract.endDate'), width: 110 },
  { prop: 'signDate', label: t('crmContract.signDate'), width: 110 },
  { prop: 'status', label: t('crmContract.status'), width: 90, slot: 'status' },
  { prop: 'createTime', label: t('crmContract.createTime'), width: 165 }
])

const statusMap = computed(() => ({
  0: { label: t('crmContract.draft'), type: 'info' },
  1: { label: t('crmContract.pendingReview'), type: 'warning' },
  2: { label: t('crmContract.executing'), type: 'primary' },
  3: { label: t('crmContract.completed'), type: 'success' },
  4: { label: t('crmContract.terminated'), type: 'danger' }
}))

const paymentMethodMap = computed(() => ({
  full: t('crmContract.fullPay'), installment: t('crmContract.installment'),
  deposit: t('crmContract.depositPay'), monthly: t('crmContract.monthlyPay'), delivery: t('crmContract.deliveryPay')
}))
const paymentDescMap = computed(() => ({
  full: t('crmContract.fullPayDesc'), installment: t('crmContract.installmentDesc'),
  deposit: t('crmContract.depositPayDesc'), monthly: t('crmContract.monthlyPayDesc'), delivery: t('crmContract.deliveryPayDesc')
}))
const deliveryMethodMap = computed(() => ({
  self_pickup: t('crmContract.selfPickup'), seller_delivery: t('crmContract.sellerDelivery'),
  logistics: t('crmContract.logistics'), express: t('crmContract.express')
}))
const deliveryDescMap = computed(() => ({
  self_pickup: t('crmContract.selfPickupDesc'), seller_delivery: t('crmContract.sellerDeliveryDesc'),
  logistics: t('crmContract.logisticsDesc'), express: t('crmContract.expressDesc')
}))

const basicFormItems = computed(() => [
  { prop: 'contractNo', label: t('crmContract.contractNoLabel'), type: 'input', span: 12, attrs: { placeholder: t('crmContract.contractNoPlaceholder'), maxlength: 30 } },
  { prop: 'customerName', label: t('crmContract.customerNameLabel'), type: 'input', span: 12, attrs: { placeholder: t('crmContract.customerNamePlaceholder') } },
  { prop: 'amount', label: t('crmContract.amountLabel'), type: 'number', span: 12, attrs: { precision: 2, min: 0, placeholder: t('crmContract.amountPlaceholder') } },
  { prop: 'contactPerson', label: t('crmContract.contactPerson'), type: 'input', span: 12, attrs: { placeholder: t('crmContract.contactPersonPlaceholder') } },
  { prop: 'contactPhone', label: t('crmContract.contactPhone'), type: 'input', span: 12, attrs: { maxlength: 20, placeholder: t('crmContract.contactPhonePlaceholder') } },
  { prop: 'buyerAddress', label: t('crmContract.buyerAddress'), type: 'textarea', rows: 2, span: 24, attrs: { maxlength: 200, placeholder: t('crmContract.buyerAddressPlaceholder') } },
  { prop: 'startDate', label: t('crmContract.startDateLabel'), type: 'date', span: 12, attrs: { placeholder: t('crmContract.startDatePlaceholder'), valueFormat: 'YYYY-MM-DD' } },
  { prop: 'endDate', label: t('crmContract.endDateLabel'), type: 'date', span: 12, attrs: { placeholder: t('crmContract.endDatePlaceholder'), valueFormat: 'YYYY-MM-DD' } }
])

const basicFormRules = computed(() => ({
  contractNo: [{ required: true, message: t('crmContract.validateContractNo'), trigger: 'blur' }],
  customerName: [{ required: true, message: t('crmContract.validateCustomerName'), trigger: 'blur' }],
  startDate: [{ required: true, message: t('crmContract.validateStartDate'), trigger: 'change' }],
  endDate: [{ required: true, message: t('crmContract.validateEndDate'), trigger: 'change' }]
}))

const clauseFormItems = computed(() => [
  { prop: 'paymentMethod', label: t('crmContract.paymentMethod'), type: 'select', options: [
    { value: 'full', label: t('crmContract.fullPay') }, { value: 'installment', label: t('crmContract.installment') },
    { value: 'deposit', label: t('crmContract.depositPay') }, { value: 'monthly', label: t('crmContract.monthlyPay') },
    { value: 'delivery', label: t('crmContract.deliveryPay') }
  ]},
  { prop: 'deliveryMethod', label: t('crmContract.deliveryMethod'), type: 'select', options: [
    { value: 'seller_delivery', label: t('crmContract.sellerDelivery') }, { value: 'logistics', label: t('crmContract.logistics') },
    { value: 'self_pickup', label: t('crmContract.selfPickup') }, { value: 'express', label: t('crmContract.express') }
  ]},
  { prop: 'qualityClause', label: t('crmContract.qualityClause'), type: 'textarea', rows: 3, attrs: { maxlength: 500, showWordLimit: true, placeholder: t('crmContract.qualityClausePlaceholder') } },
  { prop: 'penaltyClause', label: t('crmContract.penaltyClause'), type: 'textarea', rows: 3, attrs: { maxlength: 500, showWordLimit: true, placeholder: t('crmContract.penaltyClausePlaceholder') } },
  { prop: 'remark', label: t('crmContract.otherTerms'), type: 'textarea', rows: 3, attrs: { maxlength: 500, showWordLimit: true, placeholder: t('crmContract.otherTermsPlaceholder') } }
])

const tableRef = ref(null), loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formStep = ref(0)
const basicFormRef = ref(null), clauseFormRef = ref(null)
const drawerVisible = ref(false), previewData = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, contractNo: '', customerName: '', status: '' })
const formData = reactive({ id: undefined, contractNo: '', customerName: '', amount: undefined, contactPerson: '', contactPhone: '', buyerAddress: '', startDate: '', endDate: '', paymentMethod: 'full', deliveryMethod: 'seller_delivery', qualityClause: '', penaltyClause: '', remark: '', products: [] })
const productsTotal = computed(() => (formData.products || []).reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0))

function formatAmount(val) { if (!val && val !== 0) return '-'; return `¥${Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }

async function loadData() {
  loading.value = true
  try {
    const res = await (await import('@/utils/request')).default({ url: '/api/crm/contract/list', method: 'get', params: queryParams })
    tableData.value = (res.data.list || []).map(item => ({ ...item, signDate: item.signDate || item.createTime?.substring(0, 10), contactPerson: item.contactPerson || item.customerName, contactPhone: item.contactPhone || '138****' + Math.floor(1000 + Math.random() * 9000), paymentMethod: item.paymentMethod || 'full', deliveryMethod: item.deliveryMethod || 'seller_delivery', products: item.products || generateMockProducts() }))
    total.value = res.data.total || 0
  } catch (e) { console.error(e) } finally { loading.value = false }
}

function generateMockProducts() {
  const names = ['ERP Enterprise Software Standard', 'Warehouse Management (WMS)', 'Financial Accounting Module', 'Technical Implementation Service', 'Annual Maintenance Service']
  const specs = ['Enterprise-50 Users', 'V3.0 Standard', 'With Report Module', 'Man-day Billing', '1-Year Service']
  return Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => ({ name: names[i] || 'Service Item', spec: specs[i] || 'Standard', quantity: Math.floor(Math.random() * 10) + 1, unitPrice: Math.floor(Math.random() * 90000 + 10000) / 100 }))
}

function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.assign(queryParams, { pageNum: 1, contractNo: '', customerName: '', status: '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }

function resetFormData() {
  Object.keys(formData).forEach(key => { if (key === 'products') formData[key] = []; else if (key === 'paymentMethod') formData[key] = 'full'; else if (key === 'deliveryMethod') formData[key] = 'seller_delivery'; else formData[key] = '' })
  formData.id = undefined; formData.amount = undefined; addProductRow()
}
function handleAdd() { dialogTitle.value = t('crmContract.newContract'); resetFormData(); formStep.value = 0; dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = t('crmContract.editContract'); Object.assign(formData, { ...row, products: row.products?.length ? [...row.products] : [createEmptyProduct()] }); formStep.value = 0; dialogVisible.value = true }
function createEmptyProduct() { return { name: '', spec: '', quantity: 1, unitPrice: 0 } }
function addProductRow() { if (!formData.products) formData.products = []; formData.products.push(createEmptyProduct()) }
function removeProductRow(index) { if (formData.products.length <= 1) { ElMessage.warning(t('crmContract.keepAtLeastOne')); return } formData.products.splice(index, 1) }

function nextStep() {
  if (formStep.value === 0) { basicFormRef.value?.validate().then(valid => { if (valid) formStep.value++ }).catch(() => {}) }
  else if (formStep.value === 1) { if (!formData.amount) formData.amount = productsTotal.value; formStep.value++ }
}
function cancelDialog() { dialogVisible.value = false; formStep.value = 0 }

async function handleSubmit() {
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 600)); ElMessage.success(formData.id ? t('crmContract.updateSuccess') : t('crmContract.createSuccess')); dialogVisible.value = false; formStep.value = 0; loadData() }
  catch { ElMessage.error(t('crmContract.operationFailed')) }
  finally { submitLoading.value = false }
}
async function handleDelete(row) { ElMessage.success(t('crmContract.deleteSuccess')); loadData() }
function handleView(row) { previewData.value = { ...row }; drawerVisible.value = true }
function handleExportCommand(cmd, row) { exportContract(cmd, row) }

let exporting = false

function printContract() {
  const printArea = document.getElementById('contract-print-area')
  if (!printArea) { ElMessage.error(t('crmContract.printNotFound')); return }
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) { ElMessage.error(t('crmContract.printBlocked')); window.print(); return }
  const clonedContent = printArea.cloneNode(true)
  const styles = `<style>*{box-sizing:border-box}body{margin:0;padding:20px;background:#fff;font-family:"Microsoft YaHei","SimSun","PingFang SC",sans-serif;color:#333}.contract-paper{width:210mm;min-height:297mm;padding:20mm 18mm;margin:0 auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.1)}h1,h2,h3,h4,h5{color:#222}table{border-collapse:collapse;width:100%}th,td{border:1px solid #dcdfe6;padding:8px}th{background:#f5f7fa;font-weight:bold}@page{size:A4;margin:10mm}@media print{body{padding:0}.contract-paper{width:100%;min-height:auto;box-shadow:none;padding:0;margin:0}.no-print{display:none!important}}</style>`
  printWindow.document.open()
  printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${t('crmContract.contractPreview')} - ${previewData.value?.contractNo || ''}</title>${styles}</head><body>${clonedContent.outerHTML}</body></html>`)
  printWindow.document.close()
  printWindow.onload = function() { setTimeout(function() { printWindow.focus(); printWindow.print(); printWindow.onafterprint = function() { printWindow.close() } }, 300) }
  ElMessage.success(t('crmContract.printSuccess'))
}

function exportContract(format, row) {
  const data = row || previewData.value
  if (!data || exporting) return
  if (format === 'pdf') { ElMessage.info(t('crmContract.generatingPdf')); generatePDF(data) }
  else if (format === 'word') { ElMessage.info(t('crmContract.generatingWord')); generateWord(data) }
}

function generatePDF(contractData) {
  exporting = true
  try {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = 210, pageHeight = 297, margin = 15, contentWidth = pageWidth - margin * 2
    let y = margin
    function checkPage(needed) { if (y + needed > pageHeight - margin) { pdf.addPage(); y = margin } }
    function drawText(text, options) {
      const opts = options || {}, fontSize = opts.size || 10, align = opts.align || 'left', indent = opts.indent || 0, bold = opts.bold, lineHeight = opts.lineHeight || fontSize * 0.55
      pdf.setFontSize(fontSize); bold ? pdf.setFont('helvetica', 'bold') : pdf.setFont('helvetica', 'normal')
      const charW = fontSize * 0.5, lines = pdf.splitTextToSize(text, contentWidth - indent)
      lines.forEach(function(line) { checkPage(lineHeight + 1); let lineX = margin + indent; if (align === 'center') lineX = (pageWidth - line.length * charW) / 2; else if (align === 'right') lineX = pageWidth - margin - line.length * charW; pdf.text(line, lineX, y); y += lineHeight })
    }
    function drawHRule() { checkPage(3); pdf.setDrawColor(220, 220, 220); pdf.setLineWidth(0.2); pdf.line(margin, y, pageWidth - margin, y); y += 4 }
    function drawSectionTitle(text) { checkPage(14); y += 6; pdf.setFillColor(64, 158, 255); pdf.rect(margin, y - 8, 1.5, 9, 'F'); pdf.setFontSize(13); pdf.setTextColor(34, 34, 34); pdf.text(text, margin + 4, y); y += 8 }

    pdf.setTextColor(0, 0, 0)
    drawText(t('crmContract.salesContract'), { size: 22, align: 'center', bold: true, lineHeight: 12 })
    drawText(t('crmContract.salesContractEn'), { size: 10, align: 'center', lineHeight: 8 })
    drawHRule()
    y += 2
    drawText(t('crmContract.contractNoLabel2') + (contractData.contractNo || '-'), { size: 10, lineHeight: 6 })
    drawText(t('crmContract.signDateLabel') + (contractData.signDate || (contractData.createTime || '').substring(0, 10) || '-'), { size: 10, align: 'right', lineHeight: 6 })
    y += 2; drawHRule()
    checkPage(50); y += 4
    const halfW = (contentWidth - 4) / 2, col1X = margin, col2X = margin + halfW + 4
    pdf.setFillColor(253, 253, 253); pdf.setDrawColor(220, 220, 220); pdf.setLineWidth(0.3)
    pdf.roundedRect(col1X, y, halfW, 44, 2, 2, 'FD')
    pdf.setFillColor(64, 158, 255); pdf.rect(col1X, y, halfW, 8, 'F')
    pdf.setFontSize(11); pdf.setTextColor(255, 255, 255); pdf.text(t('crmContract.partyA'), col1X + halfW / 2, y + 5.5, { align: 'center' })
    pdf.setTextColor(60, 60, 60); pdf.setFontSize(9)
    ;[t('crmContract.nameLabel') + (contractData.sellerName || 'XX Tech'), t('crmContract.addressLabel') + (contractData.sellerAddress || 'Beijing'), t('crmContract.contactLabel') + (contractData.sellerContact || 'Manager Zhang'), t('crmContract.phoneLabel') + (contractData.sellerPhone || '010-8888-8888')].forEach(function(line, i) { pdf.text(line, col1X + 3, y + 14 + i * 6.5) })
    pdf.roundedRect(col2X, y, halfW, 44, 2, 2, 'FD')
    pdf.setFillColor(245, 154, 35); pdf.rect(col2X, y, halfW, 8, 'F')
    pdf.setFontSize(11); pdf.setTextColor(255, 255, 255); pdf.text(t('crmContract.partyB'), col2X + halfW / 2, y + 5.5, { align: 'center' })
    pdf.setTextColor(60, 60, 60); pdf.setFontSize(9)
    ;[t('crmContract.nameLabel') + (contractData.customerName || '-'), t('crmContract.addressLabel') + (contractData.buyerAddress || '-'), t('crmContract.contactLabel') + (contractData.contactPerson || '-'), t('crmContract.phoneLabel') + (contractData.contactPhone || '-')].forEach(function(line, i) { pdf.text(line, col2X + 3, y + 14 + i * 6.5) })
    y += 50
    drawSectionTitle(t('crmContract.clause1'))
    drawText(t('crmContract.clause1Desc'), { size: 10, indent: 8, lineHeight: 6 })
    checkPage(30); y += 2
    const products = contractData.products || [], colWidths = [12, contentWidth * 0.30, contentWidth * 0.20, 14, 22, 26], rowH = 7
    pdf.setFillColor(245, 247, 250); pdf.rect(margin, y, contentWidth, rowH, 'F')
    pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.2); pdf.rect(margin, y, contentWidth, rowH)
    pdf.setFontSize(9); pdf.setTextColor(60, 60, 60); pdf.setFont('helvetica', 'bold')
    const headers = [t('crmContract.productQuantity'), t('crmContract.productName'), t('crmContract.productSpec'), t('crmContract.productQuantity'), t('crmContract.productUnitPrice'), t('crmContract.productSubtotal')]
    let cx = margin; headers.forEach(function(h, i) { pdf.text(h, cx + colWidths[i] / 2, y + 5, { align: 'center' }); cx += colWidths[i] }); y += rowH
    pdf.setFont('helvetica', 'normal'); pdf.setTextColor(50, 50, 50)
    if (products.length === 0) { checkPage(rowH); pdf.rect(margin, y, contentWidth, rowH); pdf.setTextColor(150, 150, 150); pdf.text(t('crmContract.noProductDetail'), pageWidth / 2, y + 5, { align: 'center' }); y += rowH }
    else { products.forEach(function(item, idx) { checkPage(rowH + 2); pdf.setDrawColor(230, 230, 230); pdf.rect(margin, y, contentWidth, rowH); cx = margin; [String(idx + 1), item.name || '-', item.spec || '-', String(item.quantity || 0), Number(item.unitPrice || 0).toFixed(2), (item.quantity * item.unitPrice).toFixed(2)].forEach(function(cell, i) { const align = i === 0 || i === 3 ? 'center' : (i >= 4 ? 'right' : 'left'); let tx = cx + 2; if (align === 'center') tx = cx + colWidths[i] / 2; else if (align === 'right') tx = cx + colWidths[i] - 2; pdf.text(String(cell), tx, y + 5, { align: align === 'left' ? 'left' : align }); cx += colWidths[i] }); y += rowH }) }
    checkPage(rowH); pdf.setFillColor(250, 250, 250); pdf.rect(margin, y, contentWidth, rowH, 'F'); pdf.setDrawColor(200, 200, 200); pdf.rect(margin, y, contentWidth, rowH)
    pdf.setFont('helvetica', 'bold'); const totalAmount = contractData.amount || products.reduce(function(s, item) { return s + item.quantity * item.unitPrice }, 0)
    pdf.setTextColor(50, 50, 50); pdf.text(t('crmContract.totalAmountLabel'), margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, y + 5, { align: 'left' })
    pdf.setTextColor(245, 154, 35); pdf.text('￥' + Number(totalAmount).toFixed(2), margin + contentWidth - 2, y + 5, { align: 'right' }); y += rowH + 4
    drawSectionTitle(t('crmContract.clause2')); drawText(paymentDescMap.value[contractData.paymentMethod] || contractData.paymentMethod || t('crmContract.seeDetail'), { size: 10, indent: 8, lineHeight: 6 })
    drawSectionTitle(t('crmContract.clause3')); drawText(deliveryDescMap.value[contractData.deliveryMethod] || contractData.deliveryMethod || t('crmContract.seeDetail'), { size: 10, indent: 8, lineHeight: 6 })
    drawSectionTitle(t('crmContract.clause4')); drawText(contractData.qualityClause || t('crmContract.clause4Default'), { size: 10, indent: 8, lineHeight: 6 })
    drawSectionTitle(t('crmContract.clause5')); drawText(contractData.penaltyClause || t('crmContract.clause5Default'), { size: 10, indent: 8, lineHeight: 6 })
    drawSectionTitle(t('crmContract.clause6')); drawText(t('crmContract.clause6Text'), { size: 10, indent: 8, lineHeight: 6 })
    drawSectionTitle(t('crmContract.clause7')); drawText(contractData.remark || t('crmContract.clause7Default'), { size: 10, indent: 8, lineHeight: 6 })
    checkPage(40); y += 8; drawHRule(); y += 4
    pdf.setFontSize(10); pdf.setTextColor(50, 50, 50); pdf.setFont('helvetica', 'normal')
    pdf.text(t('crmContract.partyASign') + '____________________', margin, y)
    pdf.text(t('crmContract.authorizedRep') + '____________________', margin, y + 10)
    pdf.text(t('crmContract.dateLabel'), margin, y + 20)
    pdf.text(t('crmContract.partyBSign') + '____________________', pageWidth - margin - 90, y)
    pdf.text(t('crmContract.authorizedRep') + '____________________', pageWidth - margin - 90, y + 10)
    pdf.text(t('crmContract.dateLabel'), pageWidth - margin - 90, y + 20)
    const totalPages = pdf.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) { pdf.setPage(i); pdf.setFontSize(8); pdf.setTextColor(160, 160, 160); pdf.text(t('crmContract.page', { current: i, total: totalPages }), pageWidth / 2, pageHeight - 6, { align: 'center' }) }
    pdf.save(contractData.contractNo + '.pdf')
    ElMessage.success(t('crmContract.exportSuccess') + ': ' + contractData.contractNo + '.pdf')
  } catch (err) { console.error(err); ElMessage.error(t('crmContract.pdfFailed') + ': ' + (err.message || t('crmContract.retry'))) }
  finally { exporting = false }
}

async function generateWord(contractData) {
  exporting = true
  try {
    const documentXml = buildContractDocumentXml(contractData)
    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`
    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`
    const blob = createDocxZip({ '[Content_Types].xml': contentTypesXml, '_rels/.rels': relsXml, 'word/document.xml': documentXml })
    downloadBlob(blob, `${contractData.contractNo}.docx`)
    ElMessage.success(t('crmContract.exportSuccess') + ': ' + contractData.contractNo + '.docx')
  } catch (err) { console.error(err); ElMessage.error(t('crmContract.wordFailed') + ': ' + (err.message || t('crmContract.retry'))) }
  finally { exporting = false }
}

function xmlEscape(str) { if (str === null || str === undefined) return ''; return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;') }
function buildParagraph(text, options) { const opts = options || {}, indent = opts.indent ? '<w:ind w:firstLine="480"/>' : '', align = opts.align ? '<w:jc w:val="' + opts.align + '"/>' : '', bold = opts.bold ? '<w:b/><w:bCs/>' : '', size = opts.size || 22, spacing = opts.spacing || '<w:spacing w:line="360" w:lineRule="auto"/>', font = '<w:rFonts w:ascii="SimSun" w:eastAsia="SimSun" w:hAnsi="SimSun" w:hint="eastAsia"/>'; return '<w:p><w:pPr>' + indent + align + spacing + '<w:rPr>' + font + bold + '<w:sz w:val="' + size + '"/><w:szCs w:val="' + size + '"/></w:rPr></w:pPr><w:r><w:rPr>' + font + bold + '<w:sz w:val="' + size + '"/><w:szCs w:val="' + size + '"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(text) + '</w:t></w:r></w:p>' }
function buildSectionTitle(text) { return '<w:p><w:pPr><w:spacing w:before="240" w:after="120"/><w:rPr><w:rFonts w:ascii="SimHei" w:eastAsia="SimHei" w:hAnsi="SimHei" w:hint="eastAsia"/><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/><w:color w:val="222222"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="SimHei" w:eastAsia="SimHei" w:hAnsi="SimHei" w:hint="eastAsia"/><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/><w:color w:val="222222"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(text) + '</w:t></w:r></w:p>' }
function buildEmptyParagraph() { return '<w:p><w:pPr><w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:pPr></w:p>' }
function buildHorizontalLine() { return '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="CCCCCC"/></w:pBdr><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr></w:p>' }

function buildContractDocumentXml(data) {
  const fontCommon = '<w:rFonts w:ascii="SimSun" w:eastAsia="SimSun" w:hAnsi="SimSun" w:hint="eastAsia"/>'
  const products = data.products || []
  const titleXml = '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="120"/><w:rPr><w:rFonts w:ascii="SimHei" w:eastAsia="SimHei" w:hAnsi="SimHei" w:hint="eastAsia"/><w:b/><w:sz w:val="44"/><w:szCs w:val="44"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="SimHei" w:eastAsia="SimHei" w:hAnsi="SimHei" w:hint="eastAsia"/><w:b/><w:sz w:val="44"/><w:szCs w:val="44"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(t('crmContract.salesContract')) + '</w:t></w:r></w:p>'
  const subTitleXml = '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="240"/><w:rPr><w:rFonts w:ascii="SimSun" w:eastAsia="SimSun" w:hAnsi="SimSun" w:hint="eastAsia"/><w:color w:val="888888"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="SimSun" w:eastAsia="SimSun" w:hAnsi="SimSun" w:hint="eastAsia"/><w:color w:val="888888"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(t('crmContract.salesContractEn')) + '</w:t></w:r></w:p>'
  const metaTableXml = '<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblLook w:val="04A0"/></w:tblPr><w:tblGrid><w:gridCol w:w="4500"/><w:gridCol w:w="4500"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="4500" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr><w:p><w:pPr><w:spacing w:line="320" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:color w:val="666666"/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:color w:val="666666"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(t('crmContract.contractNoLabel2') + data.contractNo) + '</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="4500" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr><w:p><w:pPr><w:jc w:val="right"/><w:spacing w:line="320" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:color w:val="666666"/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:color w:val="666666"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(t('crmContract.signDateLabel') + (data.signDate || (data.createTime || '').substring(0, 10))) + '</w:t></w:r></w:p></w:tc></w:tr></w:tbl>'
  function buildPartyCell(title, info) { return '<w:tc><w:tcPr><w:tcW w:w="4450" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:color="DDDDDD"/><w:left w:val="single" w:sz="4" w:color="DDDDDD"/><w:bottom w:val="single" w:sz="4" w:color="DDDDDD"/><w:right w:val="single" w:sz="4" w:color="DDDDDD"/></w:tcBorders><w:shd w:val="clear" w:color="auto" w:fill="FDFDFD"/><w:tcMar><w:top w:w="160" w:type="dxa"/><w:left w:w="180" w:type="dxa"/><w:bottom w:w="160" w:type="dxa"/><w:right w:w="180" w:type="dxa"/></w:tcMar></w:tcPr><w:p><w:pPr><w:spacing w:before="0" w:after="80" w:line="320" w:lineRule="auto"/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="4" w:color="BBBBBB"/></w:pBdr><w:rPr><w:rFonts w:ascii="SimHei" w:eastAsia="SimHei" w:hAnsi="SimHei" w:hint="eastAsia"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="SimHei" w:eastAsia="SimHei" w:hAnsi="SimHei" w:hint="eastAsia"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(title) + '</w:t></w:r></w:p>' + info.map(function(line) { return '<w:p><w:pPr><w:spacing w:before="0" w:after="40" w:line="320" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(line) + '</w:t></w:r></w:p>' }).join('') + '</w:tc>' }
  const sellerInfo = [t('crmContract.nameLabel') + (data.sellerName || 'XX Tech'), t('crmContract.addressLabel') + (data.sellerAddress || 'Beijing'), t('crmContract.contactLabel') + (data.sellerContact || 'Manager Zhang'), t('crmContract.phoneLabel') + (data.sellerPhone || '010-8888-8888')]
  const buyerInfo = [t('crmContract.nameLabel') + (data.customerName || '-'), t('crmContract.addressLabel') + (data.buyerAddress || '-'), t('crmContract.contactLabel') + (data.contactPerson || '-'), t('crmContract.phoneLabel') + (data.contactPhone || '-')]
  const partyTableXml = '<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar><w:tblLook w:val="04A0"/></w:tblPr><w:tblGrid><w:gridCol w:w="4450"/><w:gridCol w:w="100"/><w:gridCol w:w="4450"/></w:tblGrid><w:tr>' + buildPartyCell(t('crmContract.partyA'), sellerInfo) + '<w:tc><w:tcPr><w:tcW w:w="100" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr><w:p><w:pPr><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr></w:p></w:tc>' + buildPartyCell(t('crmContract.partyB'), buyerInfo) + '</w:tr></w:tbl>'
  const productTableXml = buildProductTable(products, data.amount)
  const sectionsXml = buildSectionTitle(t('crmContract.clause1')) + buildParagraph(t('crmContract.clause1Desc'), { indent: true }) + buildEmptyParagraph() + buildSectionTitle(t('crmContract.clause2')) + buildParagraph(paymentDescMap.value[data.paymentMethod] || data.paymentMethod || t('crmContract.seeDetail'), { indent: true }) + buildEmptyParagraph() + buildSectionTitle(t('crmContract.clause3')) + buildParagraph(deliveryDescMap.value[data.deliveryMethod] || data.deliveryMethod || t('crmContract.seeDetail'), { indent: true }) + buildEmptyParagraph() + buildSectionTitle(t('crmContract.clause4')) + buildParagraph(data.qualityClause || t('crmContract.clause4Default'), { indent: true }) + buildEmptyParagraph() + buildSectionTitle(t('crmContract.clause5')) + buildParagraph(data.penaltyClause || t('crmContract.clause5Default'), { indent: true }) + buildEmptyParagraph() + buildSectionTitle(t('crmContract.clause6')) + buildParagraph(t('crmContract.clause6Text'), { indent: true }) + buildEmptyParagraph() + buildSectionTitle(t('crmContract.clause7')) + buildParagraph(data.remark || t('crmContract.clause7Default'), { indent: true })
  const signTableXml = '<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="200" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar><w:tblLook w:val="04A0"/></w:tblPr><w:tblGrid><w:gridCol w:w="4500"/><w:gridCol w:w="4500"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="4500" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr><w:p><w:pPr><w:spacing w:before="0" w:after="120" w:line="360" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(t('crmContract.partyASign') + '____________________') + '</w:t></w:r></w:p><w:p><w:pPr><w:spacing w:before="0" w:after="120" w:line="360" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(t('crmContract.authorizedRep') + '____________________') + '</w:t></w:r></w:p><w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="360" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(t('crmContract.dateLabel')) + '</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="4500" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr><w:p><w:pPr><w:spacing w:before="0" w:after="120" w:line="360" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(t('crmContract.partyBSign') + '____________________') + '</w:t></w:r></w:p><w:p><w:pPr><w:spacing w:before="0" w:after="120" w:line="360" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(t('crmContract.authorizedRep') + '____________________') + '</w:t></w:r></w:p><w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="360" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(t('crmContract.dateLabel')) + '</w:t></w:r></w:p></w:tc></w:tr></w:tbl>'
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml"><w:body>' + titleXml + subTitleXml + metaTableXml + '<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr></w:p>' + partyTableXml + '<w:p><w:pPr><w:spacing w:before="120" w:after="0"/></w:pPr></w:p>' + productTableXml + '<w:p><w:pPr><w:spacing w:before="120" w:after="0"/></w:pPr></w:p>' + sectionsXml + '<w:p><w:pPr><w:spacing w:before="240" w:after="0"/></w:pPr></w:p>' + signTableXml + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1080" w:bottom="1440" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/><w:cols w:space="720"/><w:docGrid w:linePitch="312"/></w:sectPr></w:body></w:document>'
}

function buildProductTable(products, totalAmount) {
  const fontCommon = '<w:rFonts w:ascii="SimSun" w:eastAsia="SimSun" w:hAnsi="SimSun" w:hint="eastAsia"/>'
  function buildThCell(text, width) { return '<w:tc><w:tcPr><w:tcW w:w="' + width + '" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:color="999999"/><w:left w:val="single" w:sz="4" w:color="999999"/><w:bottom w:val="single" w:sz="4" w:color="999999"/><w:right w:val="single" w:sz="4" w:color="999999"/></w:tcBorders><w:shd w:val="clear" w:color="auto" w:fill="F5F7FA"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="40" w:after="40" w:line="320" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="SimHei" w:eastAsia="SimHei" w:hAnsi="SimHei" w:hint="eastAsia"/><w:b/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="SimHei" w:eastAsia="SimHei" w:hAnsi="SimHei" w:hint="eastAsia"/><w:b/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(text) + '</w:t></w:r></w:p></w:tc>' }
  function buildTdCell(text, width, align) { align = align || 'left'; return '<w:tc><w:tcPr><w:tcW w:w="' + width + '" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:color="DDDDDD"/><w:left w:val="single" w:sz="4" w:color="DDDDDD"/><w:bottom w:val="single" w:sz="4" w:color="DDDDDD"/><w:right w:val="single" w:sz="4" w:color="DDDDDD"/></w:tcBorders><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:jc w:val="' + align + '"/><w:spacing w:before="40" w:after="40" w:line="320" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(text) + '</w:t></w:r></w:p></w:tc>' }
  function buildTotalCell(text, width, align, isAmount) { align = align || 'right'; const color = isAmount ? 'E6A23C' : '333333'; return '<w:tc><w:tcPr><w:tcW w:w="' + width + '" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:color="DDDDDD"/><w:left w:val="single" w:sz="4" w:color="DDDDDD"/><w:bottom w:val="single" w:sz="4" w:color="DDDDDD"/><w:right w:val="single" w:sz="4" w:color="DDDDDD"/></w:tcBorders><w:shd w:val="clear" w:color="auto" w:fill="FAFAFA"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:jc w:val="' + align + '"/><w:spacing w:before="40" w:after="40" w:line="320" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:b/><w:color w:val="' + color + '"/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:b/><w:color w:val="' + color + '"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(text) + '</w:t></w:r></w:p></w:tc>' }
  const colWidths = [800, 2200, 1800, 900, 1500, 1800]
  let rowsXml = ''
  if (products.length > 0) { products.forEach(function(item, idx) { rowsXml += '<w:tr>' + buildTdCell(String(idx + 1), colWidths[0], 'center') + buildTdCell(item.name || '-', colWidths[1], 'left') + buildTdCell(item.spec || '-', colWidths[2], 'left') + buildTdCell(String(item.quantity), colWidths[3], 'center') + buildTdCell(Number(item.unitPrice).toFixed(2), colWidths[4], 'right') + buildTdCell((item.quantity * item.unitPrice).toFixed(2), colWidths[5], 'right') + '</w:tr>' }) }
  else { rowsXml = '<w:tr><w:tc><w:tcPr><w:tcW w:w="9000" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:color="DDDDDD"/><w:left w:val="single" w:sz="4" w:color="DDDDDD"/><w:bottom w:val="single" w:sz="4" w:color="DDDDDD"/><w:right w:val="single" w:sz="4" w:color="DDDDDD"/></w:tcBorders></w:tcPr><w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="80" w:after="80"/><w:rPr>' + fontCommon + '<w:color w:val="999999"/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:color w:val="999999"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">' + t('crmContract.noProductDetail') + '</w:t></w:r></w:p></w:tc></w:tr>' }
  const totalSum = products.reduce(function(s, item) { return s + item.quantity * item.unitPrice }, 0)
  const totalRowXml = '<w:tr>' + buildTotalCell('', colWidths[0], 'right') + buildTotalCell('', colWidths[1], 'right') + buildTotalCell('', colWidths[2], 'right') + buildTotalCell('', colWidths[3], 'right') + buildTotalCell(t('crmContract.totalAmountLabel'), colWidths[4], 'right', false) + buildTotalCell(Number(totalAmount || totalSum).toFixed(2) + ' ' + t('crmContract.productTotalUnit'), colWidths[5], 'right', true) + '</w:tr>'
  return '<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="999999"/><w:left w:val="single" w:sz="4" w:color="999999"/><w:bottom w:val="single" w:sz="4" w:color="999999"/><w:right w:val="single" w:sz="4" w:color="999999"/><w:insideH w:val="single" w:sz="4" w:color="DDDDDD"/><w:insideV w:val="single" w:sz="4" w:color="DDDDDD"/></w:tblBorders><w:tblLayout w:type="fixed"/><w:tblLook w:val="04A0"/></w:tblPr><w:tblGrid><w:gridCol w:w="800"/><w:gridCol w:w="2200"/><w:gridCol w:w="1800"/><w:gridCol w:w="900"/><w:gridCol w:w="1500"/><w:gridCol w:w="1800"/></w:tblGrid><w:tr><w:trPr><w:tblHeader/></w:trPr>' + buildThCell(t('crmContract.productQuantity'), colWidths[0]) + buildThCell(t('crmContract.productName'), colWidths[1]) + buildThCell(t('crmContract.productSpec'), colWidths[2]) + buildThCell(t('crmContract.productQuantity'), colWidths[3]) + buildThCell(t('crmContract.productUnitPrice'), colWidths[4]) + buildThCell(t('crmContract.productSubtotal'), colWidths[5]) + '</w:tr>' + rowsXml + totalRowXml + '</w:tbl>'
}

function crc32(bytes) { if (!crc32.table) { crc32.table = new Uint32Array(256); for (let i = 0; i < 256; i++) { let c = i; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); crc32.table[i] = c } } let crc = 0xFFFFFFFF; for (let i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ crc32.table[(crc ^ bytes[i]) & 0xFF]; return (crc ^ 0xFFFFFFFF) >>> 0 }

function createDocxZip(files) {
  const encoder = new TextEncoder(), localHeaders = [], centralEntries = []
  let offset = 0
  for (const [filename, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(filename), dataBytes = encoder.encode(content), crcVal = crc32(dataBytes)
    const localHeader = new Uint8Array(30 + nameBytes.length), lv = new DataView(localHeader.buffer)
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0, true); lv.setUint16(8, 0, true); lv.setUint16(10, 0, true); lv.setUint16(12, 0x21, true); lv.setUint32(14, crcVal, true); lv.setUint32(18, dataBytes.length, true); lv.setUint32(22, dataBytes.length, true); lv.setUint16(26, nameBytes.length, true); lv.setUint16(28, 0, true)
    localHeader.set(nameBytes, 30); localHeaders.push({ header: localHeader, data: dataBytes, offset })
    const central = new Uint8Array(46 + nameBytes.length), cv = new DataView(central.buffer)
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0, true); cv.setUint16(10, 0, true); cv.setUint16(12, 0, true); cv.setUint16(14, 0x21, true); cv.setUint32(16, crcVal, true); cv.setUint32(20, dataBytes.length, true); cv.setUint32(24, dataBytes.length, true); cv.setUint16(28, nameBytes.length, true); cv.setUint16(30, 0, true); cv.setUint16(32, 0, true); cv.setUint16(34, 0, true); cv.setUint16(36, 0, true); cv.setUint32(38, 0, true); cv.setUint32(42, offset, true)
    central.set(nameBytes, 46); centralEntries.push(central); offset += localHeader.length + dataBytes.length
  }
  let centralDirOffset = offset, centralDirSize = 0; centralEntries.forEach(e => { centralDirSize += e.length })
  const eocd = new Uint8Array(22), ev = new DataView(eocd.buffer)
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(4, 0, true); ev.setUint16(6, 0, true); ev.setUint16(8, centralEntries.length, true); ev.setUint16(10, centralEntries.length, true); ev.setUint32(12, centralDirSize, true); ev.setUint32(16, centralDirOffset, true); ev.setUint16(20, 0, true)
  const totalSize = offset + centralDirSize + 22, result = new Uint8Array(totalSize)
  let pos = 0; localHeaders.forEach(({ header, data }) => { result.set(header, pos); pos += header.length; result.set(data, pos); pos += data.length })
  centralEntries.forEach(e => { result.set(e, pos); pos += e.length }); result.set(eocd, pos)
  return new Blob([result], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
}

function downloadBlob(blob, filename) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url) }

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; .page-title-area { .page-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0 } .page-desc { font-size: 13px; color: var(--text-secondary); margin: 0 } } .page-header-actions { display: flex; gap: 10px } }
.amount-text { font-family: 'DIN Alternate', 'Roboto Mono', monospace; font-weight: 600; color: #e6a23c }
.contract-form-wrapper { .form-steps { margin-bottom: 28px; padding: 0 20px } .step-content { min-height: 300px } .step-actions { display: flex; justify-content: center; padding-top: 16px; border-top: 1px solid #f0f0f0; margin-top: 20px; .el-button { min-width: 100px } } }
.sub-section { margin-top: 20px; padding-top: 16px; border-top: 1px dashed #e4e7ed; .sub-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; .sub-title { font-size: 14px; font-weight: 600; color: var(--text-primary) } } .product-table { :deep(.el-input__inner) { padding: 0 6px } } .sub-total { font-weight: 600; color: #409eff } .product-summary { display: flex; justify-content: flex-end; margin-top: 10px; padding: 8px 14px; background: #f0f7ff; border-radius: 6px; font-size: 14px; .summary-amount { font-weight: 700; font-size: 16px; color: #e6a23c; margin-left: 8px } } }
.step-confirm { .confirm-card { background: #fafbfc; border-radius: 10px; padding: 20px 24px; margin-bottom: 16px; h4 { margin: 0 0 16px 0; font-size: 15px; color: var(--text-primary) } .confirm-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px 24px; .cf-item { display: flex; flex-direction: column; gap: 2px; &.full { grid-column: 1 / -1 } .cfl { font-size: 12px; color: #909399 } .cfv { font-size: 14px; color: #303133; &.highlight { font-weight: 600; font-family: monospace } &.amount-big { font-weight: 700; font-size: 18px; color: #e6a23c } } } } } }
.drawer-header { display: flex; align-items: center; gap: 10px; .header-title { font-size: 16px; font-weight: 600; color: var(--text-primary) } }
.preview-container { .preview-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; padding: 12px 16px; background: #fafbfc; border-radius: 8px } }
.contract-paper { background: #fff; padding: 48px 52px; border: 1px solid #e0e0e0; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06); font-family: "SimSun", "Songti SC", "STSong", serif; .paper-title-area { text-align: center; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 2px double #333; .paper-main-title { font-size: 26px; font-weight: bold; letter-spacing: 12px; margin: 0 0 6px 0; color: #1a1a1a } .paper-sub-title { font-size: 13px; color: #777; letter-spacing: 4px; margin: 0 } } .paper-meta-row { display: flex; justify-content: space-between; margin-bottom: 22px; font-size: 13px; color: #555; padding: 8px 12px; background: #f9f9f9; border-radius: 4px } .party-info { display: flex; gap: 36px; margin-bottom: 24px; .party { flex: 1; padding: 14px 16px; background: #fdfdfd; border: 1px solid #eee; border-radius: 6px; h5 { margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #333; padding-bottom: 6px; border-bottom: 1px solid #e8e8e8 } .party-detail p { margin: 5px 0; font-size: 13px; color: #555; line-height: 1.6 } } } .clauses-section { .section-head { font-size: 14px; font-weight: 600; color: #222; margin: 20px 0 10px 0; padding-left: 10px; border-left: 3px solid #409eff } .clause-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 8px; th, td { border: 1px solid #d0d0d0; padding: 8px 10px; text-align: center } th { background: #f5f7fa; font-weight: 600; color: #333 } .total-row { background: #fafafa; td { font-weight: 600 } } .grand-total { color: #e6a23c; font-weight: 700 } } .clause-text { font-size: 13px; line-height: 1.8; color: #444; text-indent: 2em; margin: 6px 0 } } .signature-area { display: flex; justify-content: space-around; margin-top: 44px; padding-top: 24px; border-top: 1px solid #ccc; .sig-party { p { margin: 10px 0; font-size: 14px; color: #333 } } } }
</style>
