<template>
  <div class="page-container cash-page">
    <div class="hero-summary">
      <el-row :gutter="16">
        <el-col :span="5">
          <div class="hero-card hero-blue">
            <div class="hero-label">资金总额</div>
            <div class="hero-value money">{{ formatMoney(summary.totalBalance) }}</div>
            <div class="hero-extra">所有账户余额</div>
          </div>
        </el-col>
        <el-col :span="5">
          <div class="hero-card hero-green">
            <div class="hero-label">本月流入</div>
            <div class="hero-value money">{{ formatMoney(summary.monthInflow) }}</div>
            <div class="hero-extra">收款 / 销售回款</div>
          </div>
        </el-col>
        <el-col :span="5">
          <div class="hero-card hero-orange">
            <div class="hero-label">本月流出</div>
            <div class="hero-value money">{{ formatMoney(summary.monthOutflow) }}</div>
            <div class="hero-extra">付款 / 报销 / 工资</div>
          </div>
        </el-col>
        <el-col :span="5">
          <div class="hero-card hero-purple">
            <div class="hero-label">应收 / 应付</div>
            <div class="hero-value">
              <span class="money warn">{{ formatMoney(summary.receivable) }}</span>
              <span style="margin: 0 8px; color: #fff; opacity: 0.6">/</span>
              <span class="money danger">{{ formatMoney(summary.payable) }}</span>
            </div>
            <div class="hero-extra">应收 - 应付 = {{ formatMoney(summary.receivable - summary.payable) }}</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="predict-cards">
      <h3 class="section-title">未来 90 天资金预测</h3>
      <el-row :gutter="12">
        <el-col :span="8">
          <div class="predict-card">
            <div class="predict-label">30 天后</div>
            <div class="predict-value money">{{ formatMoney(summary.predict30Days) }}</div>
            <div class="predict-bar">
              <div class="predict-bar-fill" :style="{ width: (summary.predict30Days / summary.totalBalance * 100) + '%', background: '#67c23a' }" />
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="predict-card">
            <div class="predict-label">60 天后</div>
            <div class="predict-value money">{{ formatMoney(summary.predict60Days) }}</div>
            <div class="predict-bar">
              <div class="predict-bar-fill" :style="{ width: (summary.predict60Days / summary.totalBalance * 100) + '%', background: '#e6a23c' }" />
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="predict-card">
            <div class="predict-label">90 天后</div>
            <div class="predict-value money">{{ formatMoney(summary.predict90Days) }}</div>
            <div class="predict-bar">
              <div class="predict-bar-fill" :style="{ width: (summary.predict90Days / summary.totalBalance * 100) + '%', background: '#f56c6c' }" />
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-tabs v-model="activeTab" type="border-card" class="cash-tabs">
      <el-tab-pane label="银行账户" name="accounts">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <el-button type="primary" :icon="Plus" @click="handleAdd">新增账户</el-button>
            <el-button :icon="Refresh" plain @click="loadData">刷新</el-button>
          </div>
        </div>
        <BaseTable
          :columns="accountColumns"
          :table-data="accountData"
          :show-summary="true"
          :summary-method="accountSummary"
        >
          <template #openingBalance="{ row }">{{ formatMoney(row.openingBalance) }}</template>
          <template #currentBalance="{ row }">
            <span class="money primary">{{ formatMoney(row.currentBalance) }}</span>
          </template>
          <template #isDefault="{ row }">
            <el-tag v-if="row.isDefault" type="success" size="small">默认</el-tag>
            <span v-else>—</span>
          </template>
          <template #status="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '正常' : '停用' }}
            </el-tag>
          </template>
          <template #operation="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link size="small" @click="handleReconcile(row)">对账</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </BaseTable>
      </el-tab-pane>

      <el-tab-pane label="账户分布" name="distribution">
        <div class="account-cards">
          <div v-for="acc in accountData" :key="acc.id" class="account-card">
            <div class="card-header">
              <div class="bank-logo">{{ acc.bankName.substring(0, 2) }}</div>
              <div class="card-info">
                <div class="card-name">{{ acc.accountName }}</div>
                <div class="card-no">{{ maskAccount(acc.accountNo) }}</div>
              </div>
              <el-tag v-if="acc.isDefault" type="success" size="small">默认</el-tag>
            </div>
            <div class="card-balance">
              <div class="balance-label">当前余额</div>
              <div class="balance-value money">{{ formatMoney(acc.currentBalance) }} <span class="balance-currency">{{ acc.currency }}</span></div>
            </div>
            <div class="card-meta">
              <div class="meta-item">
                <div class="meta-label">期初余额</div>
                <div class="meta-value">{{ formatMoney(acc.openingBalance) }}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">币种</div>
                <div class="meta-value">{{ acc.currency }}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">开通日期</div>
                <div class="meta-value">{{ acc.createdAt }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="540px" @confirm="handleSubmit">
      <BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" />
    </BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import request from '@/utils/request'

const activeTab = ref('accounts')
const summary = ref({ totalBalance: 0, monthInflow: 0, monthOutflow: 0, receivable: 0, payable: 0, predict30Days: 0, predict60Days: 0, predict90Days: 0 })
const accountData = ref([])

const accountColumns = [
  { prop: 'accountName', label: '账户名称', minWidth: 180 },
  { prop: 'bankName', label: '开户银行', width: 150 },
  { prop: 'accountNo', label: '账号', width: 200 },
  { prop: 'currency', label: '币种', width: 80, align: 'center' },
  { prop: 'openingBalance', label: '期初余额', width: 130, slot: 'openingBalance', align: 'right' },
  { prop: 'currentBalance', label: '当前余额', width: 150, slot: 'currentBalance', align: 'right' },
  { prop: 'isDefault', label: '默认', width: 80, slot: 'isDefault', align: 'center' },
  { prop: 'status', label: '状态', width: 80, slot: 'status', align: 'center' },
  { prop: 'operation', label: '操作', width: 180, slot: 'operation', fixed: 'right' }
]

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const formData = reactive({ id: undefined, accountNo: '', accountName: '', bankName: '', currency: 'CNY', openingBalance: 0, currentBalance: 0, isDefault: false })
const formItems = [
  { prop: 'accountName', label: '账户名称', type: 'input', span: 24 },
  { prop: 'bankName', label: '开户银行', type: 'input', span: 12 },
  { prop: 'accountNo', label: '账号', type: 'input', span: 12 },
  { prop: 'currency', label: '币种', type: 'select', span: 12, options: [{ value: 'CNY', label: 'CNY 人民币' }, { value: 'USD', label: 'USD 美元' }, { value: 'EUR', label: 'EUR 欧元' }] },
  { prop: 'openingBalance', label: '期初余额', type: 'number', span: 12 },
  { prop: 'isDefault', label: '设为默认', type: 'switch', span: 12 }
]
const formRules = {
  accountName: [{ required: true, message: '请输入账户名称' }],
  bankName: [{ required: true, message: '请输入开户银行' }],
  accountNo: [{ required: true, message: '请输入账号' }]
}

async function loadData() {
  const [accRes, sumRes] = await Promise.all([
    request({ url: '/api/finance/bankAccount/list', method: 'get' }),
    request({ url: '/api/finance/cashflow/summary', method: 'get' })
  ])
  accountData.value = accRes.data.list || []
  summary.value = sumRes.data || summary.value
}

function maskAccount(no) {
  if (!no || no.length < 8) return no
  return no.substring(0, 4) + ' **** **** ' + no.substring(no.length - 4)
}
function accountSummary({ columns, data }) {
  const opSum = data.reduce((s, r) => s + (Number(r.openingBalance) || 0), 0)
  const curSum = data.reduce((s, r) => s + (Number(r.currentBalance) || 0), 0)
  const map = { openingBalance: formatMoney(opSum), currentBalance: formatMoney(curSum) }
  return columns.map((col, i) => {
    if (i === 0) return '合计'
    if (col.property && map[col.property] !== undefined) return map[col.property]
    return ''
  })
}
function formatMoney(v) {
  if (v === null || v === undefined || v === '') return '0.00'
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function handleAdd() {
  dialogTitle.value = '新增银行账户'
  Object.keys(formData).forEach(k => {
    if (typeof formData[k] === 'number') formData[k] = 0
    else if (typeof formData[k] === 'boolean') formData[k] = false
    else formData[k] = ''
  })
  formData.currency = 'CNY'
  formData.id = undefined
  dialogVisible.value = true
}
function handleEdit(row) {
  dialogTitle.value = '编辑银行账户'
  Object.assign(formData, row)
  dialogVisible.value = true
}
async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除账户【${row.accountName}】?`, '提示', { type: 'warning' })
  ElMessage.success('删除成功')
  loadData()
}
function handleReconcile(row) {
  ElMessage.info(`跳转到【${row.accountName}】银行对账页面`)
}
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  await request({ url: '/api/finance/bankAccount/save', method: 'post', data: formData })
  ElMessage.success('保存成功')
  dialogVisible.value = false
  loadData()
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.cash-page {
  .hero-summary { margin-bottom: 16px; }
  .hero-card {
    padding: 20px;
    color: #fff;
    border-radius: var(--border-radius-base);
    text-align: center;
    &.hero-blue { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
    &.hero-green { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
    &.hero-orange { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
    &.hero-purple { background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%); }
    .hero-label { font-size: 13px; opacity: 0.9; }
    .hero-value { font-size: 22px; font-weight: 600; margin: 6px 0; font-family: monospace; }
    .hero-extra { font-size: 12px; opacity: 0.85; }
  }
  .predict-cards {
    background: #fff;
    padding: 16px;
    border-radius: var(--border-radius-base);
    margin-bottom: 16px;
    .section-title { font-size: 14px; font-weight: 600; color: #303133; margin: 0 0 12px; }
    .predict-card {
      padding: 16px;
      background: #fafbfc;
      border-radius: 4px;
      .predict-label { font-size: 13px; color: #909399; }
      .predict-value { font-size: 22px; font-weight: 600; margin: 6px 0; font-family: monospace; }
      .predict-bar { height: 6px; background: #ebeef5; border-radius: 3px; overflow: hidden; }
      .predict-bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
    }
  }
  .cash-tabs { background: #fff; border-radius: var(--border-radius-base); padding: 16px; }
  .table-toolbar { display: flex; gap: 10px; margin-bottom: 12px; }
  .account-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    .account-card {
      padding: 18px;
      background: linear-gradient(135deg, #fff 0%, #f8f9fc 100%);
      border-radius: 8px;
      border: 1px solid #ebeef5;
      transition: all 0.2s;
      &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
      .card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        .bank-logo {
          width: 48px; height: 48px;
          background: linear-gradient(135deg, #409eff, #67c23a);
          color: #fff;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }
        .card-info { flex: 1; }
        .card-name { font-weight: 600; color: #303133; }
        .card-no { font-size: 12px; color: #909399; font-family: monospace; }
      }
      .card-balance {
        margin: 16px 0;
        .balance-label { font-size: 12px; color: #909399; }
        .balance-value { font-size: 22px; font-weight: 600; font-family: monospace; color: #303133; }
        .balance-currency { font-size: 12px; color: #909399; margin-left: 6px; }
      }
      .card-meta {
        display: flex;
        justify-content: space-between;
        padding-top: 12px;
        border-top: 1px solid #ebeef5;
        .meta-item { text-align: center; flex: 1; }
        .meta-label { font-size: 11px; color: #909399; }
        .meta-value { font-size: 13px; font-weight: 500; color: #303133; margin-top: 2px; }
      }
    }
  }
  .money { font-family: monospace; font-weight: 500; }
  .money.primary { color: #409eff; }
  .money.warn { color: #e6a23c; }
  .money.danger { color: #f56c6c; }
}
</style>
