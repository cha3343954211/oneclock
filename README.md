<div align="center">

<img width="1200" height="475" alt="For Clock Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# For Clock

**极简 · 禅意 · 沉浸式时钟屏保**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Build & Release](https://github.com/cha3343954211/oneclock/actions/workflows/build-and-release.yml/badge.svg)](https://github.com/cha3343954211/oneclock/actions/workflows/build-and-release.yml)

[下载应用](#-下载) · [功能特性](#-功能特性) · [使用说明](#-使用说明) · [开发指南](#-开发指南)

</div>

---

## 📥 下载

| 平台 | 获取方式 |
|---|---|
| **Android** | [Releases](https://github.com/cha3343954211/oneclock/releases/latest) 下载 `For-Clock-Android.apk` |
| **iOS** | [Releases](https://github.com/cha3343954211/oneclock/releases/latest) 下载 `For-Clock-iOS-unsigned.ipa`，用 [Sideloadly](https://sideloadly.io) 签名安装 |
| **Web** | `git clone` 后 `npm run dev`，或直接部署 `dist/` |

> Android 安装前需在手机「设置 → 安全」中开启**允许安装未知来源应用**。  
> iOS IPA 为未签名构建，安装后在「设置 → 通用 → VPN 与设备管理」信任证书。

---

## ✨ 功能特性

### 🕐 三种时钟模式
| 模式 | 说明 |
|---|---|
| **数字时钟** | 翻页动画效果，支持 12/24 小时制 |
| **模拟时钟** | 优雅表盘，可开启平滑扫描秒针 |
| **双显模式** | 模拟表盘 + 数字时钟同屏显示 |

### 🎨 五套主题
| 主题 | 风格 |
|---|---|
| **Midnight Void** | 极简黑，存在主义气质 |
| **Paper White** | 纸白，书写与诗意 |
| **Cyberpunk Neon** | 赛博霓虹，科技感 |
| **Misty Forest** | 自然森林，随机背景图 |
| **Retro Terminal** | 复古终端，绿色代码风 |

### 🌟 粒子特效
**飞雪 · 星空 · 雨滴 · 矩阵代码** — 四种粒子系统，支持手势实时交互。

### ⏱️ 计时器 / 秒表
- **秒表**：毫秒精度，实时计时
- **倒计时**：自定义时长，结束时声音提醒

### 🤖 AI 时光感悟
- 接入 **Google Gemini / 自定义 OpenAI 兼容接口** 生成诗意时光感悟
- **无需配置 API**：内置本地语句池，按主题 × 时段智能匹配，共 100+ 条双语语句

### 🎛️ 深度自定义
- **颜色**：实色或渐变（Sunset / Ocean / Aurora / Berry 等）
- **字体**：现代无衬线 / 衬线 / 等宽 / 板式等多种
- **背景**：上传本地图片，或使用主题自带背景
- **元素布局**：双击任意元素 → 独立调整位置 / 大小 / 旋转 / 透明度 / 层级

### ✋ 手势控制
开启摄像头后，使用 **MediaPipe** 识别手势，实时操控粒子：

| 手势 | 飞雪 / 星空 | 雨滴 | 矩阵 |
|---|---|---|---|
| ✊ 握拳 | 粒子聚拢 | 时间静止 | 系统崩溃 |
| 🖐 张掌 | 粒子散开 | 雨伞模式 | 力场扭曲 |
| 👆 食指 | 轻微吸引 | 风力控制 | 数据流向 |

---

## 🚀 使用说明

### 打开控制面板
鼠标移至屏幕**顶部中央**，出现白色提示条后点击即可打开设置面板。点击面板外侧关闭。

### 元素设置
**双击**任意时钟元素（数字时钟 / 模拟时钟 / 日期）可打开该元素的独立配置面板，调整颜色、大小、位置、旋转等参数。

### AI 感悟
无 API Key 时自动从本地语句池取句，有 API Key 时调用 AI 实时生成。  
在设置 → AI 配置中填入 Gemini Key 或任意 OpenAI 兼容接口。

---

## 🛠️ 开发指南

### 环境要求
- Node.js 18+
- npm

### 快速启动

```bash
git clone https://github.com/cha3343954211/oneclock.git
cd oneclock

npm install
npm run dev        # http://localhost:3000
```

### 常用命令

```bash
npm run build          # 生产构建
npm run preview        # 预览构建产物
npm run build:cap      # 构建 Web 并同步至 Capacitor
npm run open:android   # Android Studio 打开 Android 项目
npm run open:ios       # Xcode 打开 iOS 项目
```

### 技术栈

| 层级 | 技术 |
|---|---|
| UI 框架 | React 19 + TypeScript |
| 样式 | Tailwind CSS v4 |
| 构建 | Vite 6 |
| 手势识别 | MediaPipe Tasks Vision |
| AI | Google Gemini / OpenAI 兼容接口 |
| 移动端 | Capacitor 8 (iOS / Android) |
| 图标 | Lucide React |

### 项目结构

```
for-clock/
├── components/          # UI 组件
│   ├── DigitalClock.tsx
│   ├── AnalogClock.tsx
│   ├── TimerDisplay.tsx
│   ├── DateLine.tsx
│   ├── ParticlesCanvas.tsx
│   ├── Controls.tsx
│   ├── ElementSettings.tsx
│   └── DraggableElement.tsx
├── hooks/               # 状态管理 Hooks
│   ├── useSettings.ts
│   ├── useLayout.ts
│   └── useTimers.ts
├── services/
│   ├── geminiService.ts # AI 调用
│   └── wisdomPool.ts    # 本地语句池
├── constants.ts         # 主题 / 颜色预设
├── types.ts
├── App.tsx
└── index.html
```

### CI / CD

每次推送至 `main` 分支自动触发 **Build & Release** 流水线：

```
push → build-android (ubuntu) ┐
                               ├─ 全部成功 → 创建 GitHub Release
       build-ios (macos)      ┘
```

产物：`For-Clock-Android.apk` + `For-Clock-iOS-unsigned.ipa`，挂载至 `latest-build` Release。

---

## 📄 License

[MIT](LICENSE) © For Clock

---

<div align="center">

**If you find this project useful, please consider giving it a ⭐**

</div>