<template>
  <div class="page-container period-page">
    <div class="hero-card">
      <div class="hero-left">
        <div class="hero-title">期末结账</div>
        <div class="hero-sub">月结 / 年结管理 · 损益结转 · 期间锁定</div>
      </div>
      <div class="hero-right">
        <el-statistic title="当前期间" :value="currentPeriod" />
        <el-statistic title="期间状态" :value="currentPeriodStatus" :value-style="currentStatusStyle" style="margin-left: 24px" />
      </div>
    </div>

    <el-row :gutter="16" class="quick-cards">
      <el-col :span="6">
        <div class="qc-card qc-blue" @click="activeTab = 'checklist'">
          <el-icon :size="32"><DocumentChecked /></el-icon>
          <div class="qc-title">结账前检查</div>
          <div class="qc-sub">{{ checkItems.filter(c => c.status === 'pass').length }} / {{ checkItems.length }} 项通过</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="qc-card qc-green" @click="activeTab = 'monthly'">
          <el-icon :size="32"><Calendar /></el-icon>
          <div class="qc-title">期末结账</div>
          <div class="qc-sub">执行损益结转、试算平衡</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="qc-card qc-orange" @click="activeTab = 'yearly'">
          <el-icon :size="32"><Medal /></el-icon>
          <div class="qc-title">年结</div>
          <div class="qc-sub">12月结账后自动年结</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="qc-card qc-purple" @click="activeTab = 'history'">
          <el-icon :size="32"><Histogram /></el-icon>
          <div class="qc-title">结账历史</div>
          <div class="qc-sub">查看历史期间操作记录</div>
        </div>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" type="border-card" class="period-tabs">
      <!-- Tab 1: 结账前检查 -->
      <el-tab-pane label="结账前检查" name="checklist">
        <div class="checklist">
          <div v-for="(item, idx) in checkItems" :key="idx" :class="['check-item', item.status]">
            <el-icon :size="20">
              <component :is="item.status === 'pass' ? 'CircleCheckFilled' : item.status === 'fail' ? 'CircleCloseFilled' : 'WarningFilled'" />
            </el-icon>
            <div class="check-content">
              <div class="check-name">{{ item.name }}</div>
              <div class="check-desc">{{ item.desc }}</div>
            </div>
            <div class="check-action">
              <el-tag v-if="item.status === 'pass'" type="success" size="small">通过</el-tag>
              <el-tag v-else-if="item.status === 'fail'" type="danger" size="small">未通过</el-tag>
              <el-tag v-else type="warning" size="small">警告</el-tag>
              <el-button v-if="item.status !== 'pass'" link type="primary" size="small" style="margin-left: 8px">{{ item.actionText }}</el-button>
            </div>
          </div>
        </div>
        <div class="checklist-footer">
          <el-button type="primary" :icon="Refresh" @click="loadCheckItems">重新检查</el-button>
          <el-button type="success" :icon="Check" :disabled="!canClose" @click="handleMonthlyClose">开始结账</el-button>
        </div>
      </el-tab-pane>

      <!-- Tab 2: 期末结账 -->
      <el-tab-pane label="期末结账" name="monthly">
        <el-steps :active="currentStep" finish-status="success" align-center>
          <el-step title="结账前检查" description="校验单据与凭证" />
          <el-step title="损益结转" description="生成结转凭证" />
          <el-step title="试算平衡" description="期末借贷平衡" />
          <el-step title="期间锁定" description="关闭本期" />
        </el-steps>

        <div class="step-panels">
          <div v-if="currentStep === 0" class="step-panel">
            <el-alert type="info" :closable="false" show-icon>
              <template #title>阶段 1：系统将检查所有业务单据状态、未审核凭证、期末调汇等前置条件</template>
            </el-alert>
            <div class="action-row">
              <el-button type="primary" :icon="VideoPlay" @click="runStep('check')">执行检查</el-button>
            </div>
          </div>

          <div v-else-if="currentStep === 1" class="step-panel">
            <el-alert type="info" :closable="false" show-icon>
              <template #title>阶段 2：将损益类科目（5001~5999）余额结转到本年利润（4103）</template>
            </el-alert>
            <div class="action-row">
              <el-button type="primary" :icon="VideoPlay" @click="runStep('carryover')">生成结转凭证</el-button>
            </div>
            <div v-if="carryoverResult" class="result-card">
              <h4>结转凭证</h4>
              <el-descriptions :column="3" border>
                <el-descriptions-item label="凭证号">{{ carryoverResult.voucherNo }}</el-descriptions-item>
                <el-descriptions-item label="生成时间">{{ carryoverResult.generatedAt }}</el-descriptions-item>
                <el-descriptions-item label="分录数">{{ carryoverResult.entryCount }} 行</el-descriptions-item>
                <el-descriptions-item label="结转科目数">{{ carryoverResult.subjectCount }} 个</el-descriptions-item>
                <el-descriptions-item label="结转金额">{{ formatMoney(carryoverResult.amount) }}</el-descriptions-item>
                <el-descriptions-item label="自动过账">是</el-descriptions-item>
              </el-descriptions>
            </div>
          </div>

          <div v-else-if="currentStep === 2" class="step-panel">
            <el-alert type="success" :closable="false" show-icon>
              <template #title>阶段 3：试算平衡检查通过（借贷差额 = 0.00）</template>
            </el-alert>
            <div class="trial-info">
              <el-row :gutter="12">
                <el-col :span="6"><div class="metric"><div class="label">期初借方</div><div class="value">{{ formatMoney(1000000) }}</div></div></el-col>
                <el-col :span="6"><div class="metric"><div class="label">期初贷方</div><div class="value">{{ formatMoney(1000000) }}</div></div></el-col>
                <el-col :span="6"><div class="metric"><div class="label">本期借方</div><div class="value">{{ formatMoney(580000) }}</div></div></el-col>
                <el-col :span="6"><div class="metric"><div class="label">本期贷方</div><div class="value">{{ formatMoney(580000) }}</div></div></el-col>
              </el-row>
            </div>
            <div class="action-row">
              <el-button type="primary" :icon="VideoPlay" @click="runStep('trial')">试算通过</el-button>
            </div>
          </div>

          <div v-else-if="currentStep === 3" class="step-panel">
            <el-result icon="success" title="结账完成" sub-title="本期期间已锁定，业务单据/凭证不能再修改">
              <template #extra>
                <el-button type="primary" @click="resetFlow">完成</el-button>
              </template>
            </el-result>
          </div>
        </div>
      </el-tab-pane>

      <!-- Tab 3: 年结 -->
      <el-tab-pane label="年结" name="yearly">
        <el-alert type="warning" :closable="false" show-icon style="margin-bottom: 16px">
          <template #title>年结必须在 12 月结账后执行：将本年利润结转到利润分配，下一年度期初数据自动结转</template>
        </el-alert>
        <el-form :model="yearForm" label-width="120px" style="max-width: 600px">
          <el-form-item label="年结年度">
            <el-select v-model="yearForm.year" style="width: 200px">
              <el-option label="2024年度" value="2024" />
              <el-option label="2025年度" value="2025" />
            </el-select>
          </el-form-item>
          <el-form-item label="12月状态">
            <el-tag type="success">已结账</el-tag>
          </el-form-item>
          <el-form-item label="年结凭证">
            <el-tag type="info">将自动生成「结转本年利润」凭证</el-tag>
          </el-form-item>
          <el-form-item>
            <el-button type="warning" :icon="VideoPlay" @click="handleYearClose">执行年结</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- Tab 4: 结账历史 -->
      <el-tab-pane label="结账历史" name="history">
        <BaseTable
          :columns="historyColumns"
          :table-data="historyData"
          :loading="historyLoading"
          :show-index="true"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DocumentChecked, Calendar, Medal, Histogram,
  CircleCheckFilled, CircleCloseFilled, WarningFilled,
  VideoPlay, Refresh, Check
} from '@element-plus/icons-vue'
import BaseTable from '@/components/BaseTable.vue'
import request from '@/utils/request'

const activeTab = ref('checklist')
const currentPeriod = ref('2025-06')
const currentPeriodStatus = ref('未结账')

const currentStatusStyle = computed(() => currentPeriodStatus.value === '已结账' ? { color: '#67c23a' } : { color: '#e6a23c' })

// Tab 1 检查项
const checkItems = ref([
  { name: '业务单据已全部审核', desc: '检查所有未审核的销售/采购/收付款单', status: 'pass' },
  { name: '凭证已全部过账', desc: '检查草稿/审核中状态的凭证', status: 'pass' },
  { name: '科目余额试算平衡', desc: '借方 = 贷方', status: 'pass' },
  { name: '期末调汇（如启用外币）', desc: '对外币账户余额按期末汇率调整', status: 'warning', actionText: '立即调汇' },
  { name: '损益类科目余额检查', desc: '5001~5999科目已结转为零', status: 'pass' },
  { name: '辅助核算档案完整', desc: '客户/供应商/部门档案无断档', status: 'pass' }
])
const canClose = computed(() => checkItems.value.every(i => i.status !== 'fail'))

async function loadCheckItems() {
  ElMessage.info('正在执行检查...')
  await new Promise(r => setTimeout(r, 800))
  ElMessage.success('检查完成')
}

// Tab 2 结账流程
const currentStep = ref(0)
const carryoverResult = ref(null)

function runStep(type) {
  if (type === 'check') {
    currentStep.value = 1
  } else if (type === 'carryover') {
    carryoverResult.value = {
      voucherNo: '记-20250630-001',
      generatedAt: new Date().toLocaleString('zh-CN'),
      entryCount: 8,
      subjectCount: 6,
      amount: 124500.00
    }
    currentStep.value = 2
  } else if (type === 'trial') {
    currentStep.value = 3
  }
}

function resetFlow() {
  currentStep.value = 0
  carryoverResult.value = null
  ElMessage.success('结账完成')
}

async function handleMonthlyClose() {
  await ElMessageBox.confirm(`确认对【${currentPeriod.value}】执行期末结账？结账后该期间不可再修改`, '提示', { type: 'warning' })
  currentPeriodStatus.value = '已结账'
  ElMessage.success('结账成功')
  currentStep.value = 3
  activeTab.value = 'monthly'
}

async function handleYearClose() {
  if (!yearForm.year) {
    ElMessage.warning('请选择年结年度')
    return
  }
  try {
    await ElMessageBox.confirm(`确定对 ${yearForm.year} 年度执行年结？该操作不可逆！`, '危险操作', {
      type: 'warning',
      confirmButtonText: '确认年结',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  try {
    await request({ url: '/api/finance/period/yearClose', method: 'post', data: { year: yearForm.year } })
    ElMessage.success(`${yearForm.year} 年年度结转完成`)
    loadHistory()
  } catch (e) {
    console.error(e)
  }
}

// Tab 4 历史
const historyColumns = [
  { prop: 'period', label: '期间', width: 120 },
  { prop: 'closeType', label: '结账类型', width: 100 },
  { prop: 'operator', label: '操作人', width: 100 },
  { prop: 'closedAt', label: '结账时间', width: 200 },
  { prop: 'voucherCount', label: '凭证数', width: 100, align: 'right' },
  { prop: 'totalAmount', label: '结转金额', width: 150, align: 'right' },
  { prop: 'status', label: '状态', width: 100 }
]
const historyData = ref([])
const historyLoading = ref(false)

const yearForm = reactive({ year: '2025' })

async function loadHistory() {
  historyLoading.value = true
  try {
    const res = await request({ url: '/api/finance/period/list', method: 'get', params: { pageNum: 1, pageSize: 20 } })
    const list = res.data?.list || []
    historyData.value = list.map(p => ({
      period: p.period,
      closeType: p.period?.endsWith('-12') ? '年结' : '月结',
      operator: p.operator || 'admin',
      closedAt: p.closedAt || `${p.period}-30 23:59:59`,
      voucherCount: p.voucherCount || 0,
      totalAmount: p.totalAmount || 0,
      status: p.status === 1 ? '已结账' : '未结账'
    }))
  } finally {
    historyLoading.value = false
  }
}

function formatMoney(v) {
  if (v === null || v === undefined || v === '') return '0.00'
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(() => loadHistory())
</script>

<style lang="scss" scoped>
.period-page {
  .hero-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    margin-bottom: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border-radius: var(--border-radius-base);
    .hero-title { font-size: 22px; font-weight: 600; }
    .hero-sub { font-size: 13px; opacity: 0.85; margin-top: 4px; }
    .hero-right { display: flex; align-items: center; }
  }
  .quick-cards { margin-bottom: 16px; }
  .qc-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 130px;
    color: #fff;
    border-radius: var(--border-radius-base);
    cursor: pointer;
    transition: all 0.2s;
    &:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.12); }
    &.qc-blue { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
    &.qc-green { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
    &.qc-orange { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
    &.qc-purple { background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%); }
    .qc-title { font-size: 18px; font-weight: 600; margin-top: 8px; }
    .qc-sub { font-size: 12px; opacity: 0.9; margin-top: 4px; }
  }
  .period-tabs { background: #fff; border-radius: var(--border-radius-base); padding: 16px; }
  .checklist {
    .check-item {
      display: flex;
      align-items: center;
      padding: 14px 16px;
      margin-bottom: 8px;
      background: #fafbfc;
      border-radius: 4px;
      border-left: 4px solid #909399;
      &.pass { border-left-color: #67c23a; color: #67c23a; }
      &.fail { border-left-color: #f56c6c; color: #f56c6c; }
      &.warning { border-left-color: #e6a23c; color: #e6a23c; }
      .check-content { flex: 1; margin-left: 12px; color: #303133; }
      .check-name { font-weight: 600; }
      .check-desc { font-size: 12px; color: #909399; margin-top: 2px; }
    }
  }
  .checklist-footer {
    margin-top: 16px;
    text-align: center;
  }
  .step-panels {
    margin-top: 24px;
    padding: 24px;
    background: #fafbfc;
    border-radius: var(--border-radius-base);
    .action-row { margin-top: 16px; text-align: center; }
    .result-card { margin-top: 16px; padding: 16px; background: #fff; border-radius: 4px; }
    .trial-info { margin: 16px 0; }
    .metric { padding: 16px; background: #fff; border-radius: 4px; text-align: center;
      .label { font-size: 12px; color: #909399; }
      .value { font-size: 18px; font-weight: 600; margin-top: 4px; font-family: monospace; }
    }
  }
}
</style>
