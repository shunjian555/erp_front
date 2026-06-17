<template>
  <div class="profile-container">
    <el-card class="profile-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>个人信息</span>
        </div>
      </template>

      <div class="profile-content">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <el-avatar :size="80" :src="avatar" class="profile-avatar">
            {{ username?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <h2 class="profile-name">{{ userInfo.nickname || username }}</h2>
          <p class="profile-role">{{ roles.includes('admin') ? '系统管理员' : '普通用户' }}</p>
        </div>

        <!-- 信息列表 -->
        <el-form :model="profileForm" label-width="80px" class="profile-form">
          <el-form-item label="用户名">
            <el-input v-model="profileForm.username" disabled />
          </el-form-item>
          <el-form-item label="昵称">
            <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSave">保存修改</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 修改密码 -->
    <el-card class="profile-card" shadow="never" style="margin-top: 16px;">
      <template #header>
        <div class="card-header">
          <span>修改密码</span>
        </div>
      </template>

      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="80px">
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入旧密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleChangePassword">修改密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

const username = computed(() => userStore.username)
const avatar = computed(() => userStore.avatar)
const userInfo = computed(() => userStore.userInfo)
const roles = computed(() => userStore.roles)

const profileForm = reactive({
  username: '',
  nickname: '',
  email: '',
  phone: ''
})

const passwordFormRef = ref(null)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirm = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
}

// 初始化表单
onMounted(() => {
  const info = userStore.userInfo
  profileForm.username = info.username || ''
  profileForm.nickname = info.nickname || ''
  profileForm.email = info.email || ''
  profileForm.phone = info.phone || ''
})

// 保存个人信息
function handleSave() {
  ElMessage.success('个人信息保存成功（Mock）')
}

// 重置表单
function handleReset() {
  const info = userStore.userInfo
  profileForm.nickname = info.nickname || ''
  profileForm.email = info.email || ''
  profileForm.phone = info.phone || ''
}

// 修改密码
async function handleChangePassword() {
  const valid = await passwordFormRef.value?.validate().catch(() => false)
  if (!valid) return
  ElMessage.success('密码修改成功（Mock）')
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}
</script>

<style lang="scss" scoped>
.profile-container {
  padding: 20px;
  max-width: 800px;
}

.profile-card {
  .card-header {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.profile-content {
  .avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 24px;
    padding: 16px 0;

    .profile-avatar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-size: 28px;
      font-weight: 700;
      color: #fff;
    }

    .profile-name {
      font-size: 20px;
      font-weight: 600;
      color: #303133;
      margin: 12px 0 4px;
    }

    .profile-role {
      font-size: 13px;
      color: #909399;
    }
  }
}

.profile-form {
  max-width: 500px;
}
</style>