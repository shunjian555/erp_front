<template>
  <div class="page-container">
    <el-alert title="工作流设计器" type="info" :closable="false" show-icon style="margin-bottom: 16px">
      <template #default>可视化设计审批流，支持顺序、会签、或签等多种审批模式，配置审批人、条件和通知规则。</template>
    </el-alert>
    <div class="designer-layout">
      <div class="left-panel">
        <div class="panel-title">流程列表</div>
        <div v-for="f in flows" :key="f.id" class="flow-item" :class="{ active: current?.id === f.id }" @click="current = f">
          <div class="flow-name">{{ f.name }}</div>
          <el-tag size="small" :type="f.status === 1 ? 'success' : 'info'">{{ f.status === 1 ? '已发布' : '草稿' }}</el-tag>
        </div>
        <el-button type="primary" :icon="Plus" size="small" style="width: 100%; margin-top: 12px" @click="handleAdd">新建流程</el-button>
      </div>
      <div class="center-panel">
        <div class="toolbar">
          <el-button :icon="Plus" @click="addNode('start')">开始</el-button>
          <el-button :icon="UserFilled" @click="addNode('approve')">审批</el-button>
          <el-button :icon="Setting" @click="addNode('condition')">条件</el-button>
          <el-button :icon="Notification" @click="addNode('notify')">通知</el-button>
          <el-button :icon="CircleClose" @click="addNode('end')">结束</el-button>
          <el-divider direction="vertical" />
          <el-button type="primary" :icon="Check" @click="handlePublish">发布</el-button>
          <el-button :icon="Document" @click="handleSaveDraft">保存草稿</el-button>
        </div>
        <div class="canvas">
          <div v-for="(n, i) in currentNodes" :key="n.id" class="node" :class="['node-' + n.type]" @click="selected = n">
            <div class="node-icon"><el-icon><component :is="nodeIcons[n.type]" /></el-icon></div>
            <div class="node-info">
              <div class="node-title">{{ n.title || nodeLabels[n.type] }}</div>
              <div class="node-desc">{{ nodeDesc(n) }}</div>
            </div>
            <div v-if="i < currentNodes.length - 1" class="node-arrow">↓</div>
            <el-button v-if="selectedNode === n" class="node-delete" :icon="Delete" link size="small" @click.stop="removeNode(i)" />
          </div>
        </div>
      </div>
      <div class="right-panel">
        <div class="panel-title">节点属性</div>
        <el-form v-if="selected" label-width="100px" size="small">
          <el-form-item label="节点名称"><el-input v-model="selected.title" /></el-form-item>
          <el-form-item v-if="selected.type === 'approve'" label="审批人">
            <el-select v-model="selected.approver" style="width: 100%">
              <el-option v-for="u in approverList" :key="u" :label="u" :value="u" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="selected.type === 'approve'" label="审批模式">
            <el-radio-group v-model="selected.mode">
              <el-radio value="single">单人</el-radio><el-radio value="all">会签</el-radio><el-radio value="any">或签</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="selected.type === 'condition'" label="条件表达式">
            <el-input v-model="selected.condition" type="textarea" :rows="3" placeholder="例: amount > 10000" />
          </el-form-item>
          <el-form-item v-if="selected.type === 'notify'" label="通知方式">
            <el-checkbox-group v-model="selected.notifyType">
              <el-checkbox value="email">邮件</el-checkbox><el-checkbox value="sms">短信</el-checkbox><el-checkbox value="site">站内</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item><el-button type="primary" size="small" @click="handleSaveNode">保存节点</el-button></el-form-item>
        </el-form>
        <el-empty v-else description="点击节点配置属性" :image-size="80" />
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, computed, markRaw } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, UserFilled, Setting, Notification, CircleClose, Check, Document, Delete, VideoPlay, Promotion } from '@element-plus/icons-vue'
const flows = ref([
  { id: 1, name: '请假审批流', status: 1, nodes: [] },
  { id: 2, name: '报销审批流', status: 1, nodes: [] },
  { id: 3, name: '采购审批流', status: 0, nodes: [] }
])
const current = ref(flows.value[0])
const selected = ref(null)
const approverList = ['直属上级', '部门经理', '财务总监', '总经理', 'HR']
const nodeIcons = { start: markRaw(VideoPlay), approve: markRaw(UserFilled), condition: markRaw(Setting), notify: markRaw(Notification), end: markRaw(CircleClose) }
const nodeLabels = { start: '开始', approve: '审批节点', condition: '条件分支', notify: '通知', end: '结束' }
const currentNodes = computed({
  get() {
    if (!current.value.nodes.length) {
      current.value.nodes = [
        { id: 1, type: 'start', title: '开始', approver: '', mode: '', condition: '', notifyType: [] },
        { id: 2, type: 'approve', title: '直属上级审批', approver: '直属上级', mode: 'single', condition: '', notifyType: [] },
        { id: 3, type: 'condition', title: '条件分支', approver: '', mode: '', condition: 'days > 3', notifyType: [] },
        { id: 4, type: 'approve', title: '部门经理审批', approver: '部门经理', mode: 'single', condition: '', notifyType: [] },
        { id: 5, type: 'notify', title: '通知 HR', approver: '', mode: '', condition: '', notifyType: ['email', 'site'] },
        { id: 6, type: 'end', title: '结束', approver: '', mode: '', condition: '', notifyType: [] }
      ]
    }
    return current.value.nodes
  },
  set(v) { current.value.nodes = v }
})
const selectedNode = computed(() => selected.value)
function addNode(type) {
  if (!current.value) return
  const id = Date.now()
  currentNodes.value.splice(currentNodes.value.length - 1, 0, { id, type, title: nodeLabels[type], approver: '', mode: 'single', condition: '', notifyType: [] })
}
function removeNode(i) { currentNodes.value.splice(i, 1) }
function handleSaveNode() { ElMessage.success('节点配置已保存') }
function nodeDesc(n) {
  if (n.type === 'approve') return `${n.approver || '未配置'} · ${n.mode === 'single' ? '单人审批' : n.mode === 'all' ? '会签' : '或签'}`
  if (n.type === 'condition') return n.condition || '无条件'
  if (n.type === 'notify') return (n.notifyType || []).join(', ') || '未配置'
  return ''
}
function handleAdd() {
  const id = Date.now()
  flows.value.push({ id, name: `新流程 ${flows.value.length + 1}`, status: 0, nodes: [] })
  current.value = flows.value[flows.value.length - 1]
}
function handlePublish() { if (current.value) { current.value.status = 1; ElMessage.success('流程已发布') } }
function handleSaveDraft() { ElMessage.success('草稿已保存') }
</script>
<style lang="scss" scoped>
.designer-layout { display: grid; grid-template-columns: 220px 1fr 280px; gap: 16px; min-height: calc(100vh - 240px) }
.left-panel, .right-panel { background: #fff; padding: 16px; border-radius: 8px; overflow-y: auto }
.center-panel { background: #f5f5f5; border-radius: 8px; padding: 16px; overflow-y: auto }
.panel-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #409eff }
.flow-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-radius: 4px; cursor: pointer; margin-bottom: 4px; &.active, &:hover { background: #ecf5ff; color: #409eff } }
.flow-name { font-size: 13px; font-weight: 600 }
.toolbar { background: #fff; padding: 10px; border-radius: 6px; margin-bottom: 16px }
.canvas { display: flex; flex-direction: column; align-items: center; padding: 20px 0 }
.node { position: relative; display: flex; align-items: center; gap: 12px; width: 360px; padding: 16px 20px; background: #fff; border: 2px solid #dcdfe6; border-radius: 8px; margin-bottom: 6px; cursor: pointer; transition: all .2s; &:hover { border-color: #409eff } }
.node-start { border-color: #67c23a; background: #f0f9eb }
.node-approve { border-color: #409eff; background: #ecf5ff }
.node-condition { border-color: #e6a23c; background: #fdf6ec }
.node-notify { border-color: #909399; background: #f4f4f5 }
.node-end { border-color: #f56c6c; background: #fef0f0 }
.node-icon { font-size: 24px }
.node-info { flex: 1 }
.node-title { font-size: 14px; font-weight: 600 }
.node-desc { font-size: 12px; color: #606266; margin-top: 2px }
.node-arrow { position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%); font-size: 18px; color: #909399; z-index: 1 }
.node-delete { position: absolute; top: 4px; right: 4px }
</style>
