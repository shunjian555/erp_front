# Smart ERP

<p align="center">
  <strong>智能企业资源管理系统</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.4-brightgreen" alt="Vue 3" />
  <img src="https://img.shields.io/badge/Vite-5.4-blue" alt="Vite" />
  <img src="https://img.shields.io/badge/Element_Plus-2.7-blue" alt="Element Plus" />
  <img src="https://img.shields.io/badge/Pinia-2.1-yellow" alt="Pinia" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

## 简介

Smart ERP 是一个基于 Vue3 的企业资源管理前端系统，涵盖 CRM、OA、商品、采购、销售、库存、WMS、财务、BI 报表、系统管理等核心业务模块，采用纯前端 Mock 数据驱动，无需后端即可完整运行。

## 功能模块

| 模块         | 功能                                          |
| ------------ | --------------------------------------------- |
| **工作台**   | 数据概览、快捷入口、待办事项                  |
| **CRM**      | 客户管理、联系人、线索、商机、报价、合同      |
| **OA**       | 审批中心、请假、报销、采购申请、公告、消息    |
| **商品中心** | 商品管理、分类、品牌、单位                    |
| **采购管理** | 采购申请、采购订单、入库、退货、供应商        |
| **销售管理** | 销售订单、出库、退货、客户                    |
| **库存管理** | 库存查询、流水、预警、盘点、调整              |
| **WMS**      | 仓库、库区、库位、调拨、批次、条码            |
| **财务管理** | 会计科目、凭证、总账、报表、应收/应付、发票等 |
| **BI 报表**  | 销售分析、采购分析、库存分析、利润分析        |
| **系统管理** | 用户、角色、菜单、部门、字典、日志、配置      |

## 技术栈

- **框架**: Vue 3 + Composition API
- **构建**: Vite 5
- **UI**: Element Plus
- **路由**: Vue Router 4
- **状态**: Pinia
- **图表**: ECharts 5
- **富文本**: wangEditor 5
- **样式**: SCSS
- **Mock**: MockJS + 自研请求适配器

## 快速开始

### 环境要求

- Node.js >= 16
- npm >= 8

### 安装

```bash
# 克隆项目
git clone https://github.com/your-username/smart-erp.git

# 进入目录
cd smart-erp

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

启动后访问 http://localhost:3000，默认账号 `admin / 123456`。

### 构建

```bash
# 生产构建
npm run build

# 预览构建产物
npm run preview
```

## 项目结构

```
smart-erp/
├── public/                 # 静态资源
├── src/
│   ├── api/                # 接口定义
│   ├── assets/             # 项目资源
│   ├── components/         # 通用组件
│   ├── directives/         # 自定义指令
│   ├── layout/             # 布局组件
│   ├── mock/               # Mock 数据
│   ├── permission/         # 权限控制
│   ├── router/             # 路由配置
│   ├── stores/             # 状态管理
│   ├── styles/             # 全局样式
│   ├── utils/              # 工具函数
│   ├── views/              # 页面视图
│   ├── App.vue
│   ├── main.js
│   └── permission.js
├── .editorconfig
├── .eslintrc.cjs
├── .gitignore
├── .prettierrc
├── LICENSE
├── package.json
└── vite.config.js
```

## 开发规范

- 使用 Composition API + `<script setup>` 语法
- 组件命名采用 PascalCase，页面采用 kebab-case 目录
- CSS 使用 BEM 命名或 scoped SCSS
- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范

## 贡献

欢迎提交 Pull Request，请阅读 [贡献指南](./CONTRIBUTING.md)。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交改动 (`git commit -m 'feat: add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

## 许可证

[MIT](./LICENSE)
