<template>
  <div class="login-container">
    <div class="login-bg">
      <div class="login-bg-shape"></div>
    </div>

    <div class="login-card">
      <div class="login-header">
        <img src="@/assets/logo.svg" alt="logo" class="login-logo" />
        <h1 class="login-title">Smart ERP</h1>
        <p class="login-subtitle">智能企业资源管理系统</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        size="large"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item prop="captcha">
          <div class="captcha-row">
            <el-input
              v-model="loginForm.captcha"
              placeholder="请输入验证码"
              prefix-icon="Key"
              clearable
              class="captcha-input"
            />
            <canvas
              ref="captchaCanvas"
              class="captcha-canvas"
              width="120"
              height="40"
              @click="refreshCaptcha"
              title="点击刷新验证码"
            />
          </div>
        </el-form-item>

        <div class="login-options">
          <el-checkbox v-model="rememberPassword">记住密码</el-checkbox>
          <el-link type="primary" :underline="false">忘记密码？</el-link>
        </div>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            class="login-btn"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p>默认账号: admin / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref(null)
const loading = ref(false)
const rememberPassword = ref(false)
const captchaCanvas = ref(null)
const captchaCode = ref('')

const loginForm = reactive({
  username: '',
  password: '',
  captcha: ''
})

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不少于6位', trigger: 'blur' }
  ],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

// 生成随机验证码文本
function generateCaptchaText() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// 绘制验证码到 Canvas
function drawCaptcha() {
  const canvas = captchaCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height

  // 清空画布
  ctx.clearRect(0, 0, width, height)

  // 随机背景色
  const bgColors = ['#f0f8ff', '#fff5eb', '#e8f5e9', '#fce4ec', '#e3f2fd', '#f3e5f5']
  ctx.fillStyle = bgColors[Math.floor(Math.random() * bgColors.length)]
  ctx.fillRect(0, 0, width, height)

  // 绘制干扰线
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, 0.4)`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(Math.random() * width, Math.random() * height)
    ctx.lineTo(Math.random() * width, Math.random() * height)
    ctx.stroke()
  }

  // 绘制干扰点
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, 0.6)`
    ctx.beginPath()
    ctx.arc(Math.random() * width, Math.random() * height, 1.5, 0, 2 * Math.PI)
    ctx.fill()
  }

  // 生成并绘制验证码文字
  captchaCode.value = generateCaptchaText()
  const code = captchaCode.value
  const fontSize = 26
  ctx.textBaseline = 'middle'

  for (let i = 0; i < code.length; i++) {
    ctx.save()
    const x = 15 + i * 26
    const y = height / 2 + (Math.random() - 0.5) * 8
    ctx.translate(x, y)
    ctx.rotate((Math.random() - 0.5) * 0.4)
    ctx.font = `bold ${fontSize}px Arial`
    ctx.fillStyle = `rgb(${Math.floor(Math.random() * 100) + 50}, ${Math.floor(Math.random() * 100) + 50}, ${Math.floor(Math.random() * 100) + 50})`
    ctx.fillText(code[i], 0, 0)
    ctx.restore()
  }
}

// 刷新验证码
function refreshCaptcha() {
  loginForm.captcha = ''
  drawCaptcha()
}

// 登录
async function handleLogin() {
  const valid = await loginFormRef.value?.validate().catch(() => false)
  if (!valid) return

  // 验证码校验
  if (loginForm.captcha.toLowerCase() !== captchaCode.value.toLowerCase()) {
    ElMessage.error('验证码错误，请重新输入')
    refreshCaptcha()
    return
  }

  loading.value = true
  try {
    await userStore.login(loginForm)
    await userStore.getUserInfo()
    ElMessage.success('登录成功')

    // 记住密码
    if (rememberPassword.value) {
      localStorage.setItem('erp_username', loginForm.username)
      localStorage.setItem('erp_password', loginForm.password)
    }

    // 跳转首页或重定向地址
    const redirect = route.query.redirect || '/'
    await router.push(redirect)
  } catch (error) {
    console.error('登录失败:', error)
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

// 初始化记住的密码
onMounted(() => {
  const savedUsername = localStorage.getItem('erp_username')
  const savedPassword = localStorage.getItem('erp_password')
  if (savedUsername && savedPassword) {
    loginForm.username = savedUsername
    loginForm.password = savedPassword
    rememberPassword.value = true
  }
  // 绘制验证码
  drawCaptcha()
})
</script>

<style lang="scss" scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  .login-bg-shape {
    position: absolute;
    width: 600px;
    height: 600px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
    top: -200px;
    right: -100px;

    &::after {
      content: '';
      position: absolute;
      width: 400px;
      height: 400px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 50%;
      bottom: -150px;
      left: -100px;
    }
  }
}

.login-card {
  width: 420px;
  padding: 40px 36px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  z-index: 1;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

  .login-logo {
    width: 56px;
    height: 56px;
    margin-bottom: 12px;
  }

  .login-title {
    font-size: 28px;
    font-weight: 700;
    color: #303133;
    margin-bottom: 6px;
  }

  .login-subtitle {
    font-size: 14px;
    color: #909399;
  }
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.captcha-row {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;

  .captcha-input {
    flex: 1;
  }

  .captcha-canvas {
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid #dcdfe6;
    flex-shrink: 0;
    height: 40px;
    transition: border-color 0.2s;

    &:hover {
      border-color: #409eff;
    }
  }
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  letter-spacing: 4px;
}

.login-footer {
  text-align: center;
  margin-top: 20px;

  p {
    font-size: 13px;
    color: #909399;
  }
}
</style>
