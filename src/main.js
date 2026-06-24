import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import './permission'
import '@/styles/index.scss'
import { setupDirectives } from '../directives/index'
import i18n from '@/locales'

const app = createApp(App)

// 初始化主题
const savedTheme = localStorage.getItem('erp_theme')
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark')
}

// 初始化语言
const savedLang = localStorage.getItem('erp_language') || 'zh-CN'

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

setupDirectives(app)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(ElementPlus, { locale: savedLang === 'en-US' ? en : zhCn })

app.mount('#app')
