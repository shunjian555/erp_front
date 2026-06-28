<template>
  <div class="page-container">
    <el-row :gutter="16">
      <el-col :span="16">
        <BaseCard :title="$t('oa.messageList')" shadow="hover">
          <div class="message-list">
            <div v-for="msg in messageList" :key="msg.id" class="message-item" :class="{ unread: !msg.isRead }" @click="handleRead(msg)">
              <div class="msg-avatar">
                <el-avatar :size="42" :style="{ backgroundColor: msg.color }">{{ msg.sender.charAt(0) }}</el-avatar>
              </div>
              <div class="msg-content">
                <div class="msg-header">
                  <span class="msg-title">{{ msg.title }}</span>
                  <span class="msg-time">{{ msg.time }}</span>
                </div>
                <p class="msg-summary">{{ msg.summary }}</p>
              </div>
              <div v-if="!msg.isRead" class="msg-unread-dot"></div>
            </div>
            <el-empty v-if="!messageList.length" :description="$t('oa.noMessages')" :image-size="80" />
          </div>
          <div class="pagination-wrapper">
            <el-pagination small layout="prev, pager, next" :total="50" :page-size="10" />
          </div>
        </BaseCard>
      </el-col>
      <el-col :span="8">
        <BaseCard :title="$t('oa.quickActions')" shadow="hover">
          <div class="quick-actions">
            <div class="action-btn" @click="markAllRead">
              <el-icon :size="20" color="#409eff"><Finished /></el-icon>
              <span>{{ $t('oa.markAllRead') }}</span>
            </div>
            <div class="action-btn" @click="clearAll">
              <el-icon :size="20" color="#f56c6c"><Delete /></el-icon>
              <span>{{ $t('oa.clearAll') }}</span>
            </div>
          </div>
        </BaseCard>
        <BaseCard :title="$t('oa.systemNotices')" shadow="hover" style="margin-top: 16px;">
          <div class="system-notices">
            <div v-for="(item, index) in systemNotices" :key="index" class="notice-item">
              <el-icon :color="item.color"><component :is="item.icon" /></el-icon>
              <span>{{ item.text }}</span>
            </div>
          </div>
        </BaseCard>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Finished, Delete } from '@element-plus/icons-vue'
import BaseCard from '@/components/BaseCard.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const messageList = ref([
  { id: 1, sender: '系统', title: '系统升级通知', summary: '系统将于今晚22:00进行维护升级，届时将暂停服务约30分钟。', time: '10分钟前', isRead: false, color: '#409eff' },
  { id: 2, sender: '张三', title: '采购订单审批提醒', summary: '您有一条采购订单等待审批，请及时处理。', time: '1小时前', isRead: false, color: '#e6a23c' },
  { id: 3, sender: '李四', title: '销售合同签署完成', summary: '客户A的销售合同已完成签署，请确认。', time: '2小时前', isRead: true, color: '#67c23a' },
  { id: 4, sender: '王五', title: '库存预警通知', summary: '商品XYZ库存低于安全库存，请及时补货。', time: '昨天', isRead: true, color: '#f56c6c' },
  { id: 5, sender: '系统', title: '周报提交提醒', summary: '本周工作周报尚未提交，请在周五下班前完成。', time: '昨天', isRead: true, color: '#909399' }
])

const systemNotices = ref([
  { icon: 'Bell', text: '您有3条待办事项', color: '#e6a23c' },
  { icon: 'Warning', text: '库存预警商品8件', color: '#f56c6c' },
  { icon: 'Document', text: '本月合同即将到期5份', color: '#409eff' }
])

function handleRead(msg) { msg.isRead = true; ElMessage.info(`${t('common.detail')}: ${msg.title}`) }
function markAllRead() { messageList.value.forEach((m) => (m.isRead = true)); ElMessage.success(t('oa.markAllReadSuccess')) }
function clearAll() { messageList.value = []; ElMessage.success(t('oa.messagesCleared')) }
</script>

<style lang="scss" scoped>
.message-list {
  max-height: 520px; overflow-y: auto;
  .message-item { display: flex; padding: 14px 12px; cursor: pointer; border-bottom: 1px solid var(--border-color-lighter); transition: background-color 0.2s; position: relative;
    &:hover { background-color: #f5f7fa; }
    &.unread { background-color: #ecf5ff; }
    .msg-avatar { margin-right: 12px; flex-shrink: 0; }
    .msg-content { flex: 1; min-width: 0;
      .msg-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;
        .msg-title { font-size: 14px; font-weight: 500; color: var(--text-primary); }
        .msg-time { font-size: 12px; color: var(--text-secondary); }
      }
      .msg-summary { font-size: 13px; color: var(--text-secondary); line-height: 1.5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    }
    .msg-unread-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--primary-color); position: absolute; right: 12px; top: 20px; }
  }
}
.pagination-wrapper { text-align: center; padding-top: 12px; }
.quick-actions { .action-btn { display: flex; align-items: center; gap: 10px; padding: 12px 16px; cursor: pointer; border-radius: 8px; transition: all 0.2s; &:hover { background-color: #f5f7fa; } span { font-size: 14px; } } }
.system-notices { .notice-item { display: flex; align-items: center; gap: 8px; padding: 10px 0; font-size: 13px; color: var(--text-regular); &:not(:last-child) { border-bottom: 1px solid var(--border-color-lighter); } } }
</style>
