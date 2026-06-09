---
version: alpha
name: Prompt Library Warm Morandi
description: >-
  Monē 拍照記帳 App 的設計系統。暖色莫蘭迪（Warm Morandi）視覺語言，低飽和、沉穩溫暖，
  傳達專業且親切的理財體驗。跨平台共用（mone-web / admin-portal / mobile / landing），
  原生支援淺色（light，預設）與深色（dark）雙主題。
  token 真實來源：src/shared/src/design-tokens/。

# ── 淺色主題（light，預設）────────────────────────────────
colors:
  # Primary（暖鼠尾草綠 Warm Sage）
  primary: "#81b29a"
  primaryDark: "#5a9a7a"
  primaryLight: "#a8d4be"
  # Surfaces（奶油／砂 Cream & Sand）
  bgPrimary: "#faf8f5"
  bgCard: "#ffffff"
  bgSecondary: "#f0eeeb"
  # Text（暖棕／灰 Warm Brown & Gray）
  textPrimary: "#3d3a36"
  textSecondary: "#9a9590"
  textTertiary: "#b5b0ab"
  # Border
  border: "#e8e6e3"
  borderDark: "#d4d1cd"
  borderSubtle: "#00000008"
  # Status
  success: "#81b29a"
  warning: "#f2cc8f"
  error: "#e07a5f"
  info: "#3d405b"
  # Status containers（低飽和提示底色）
  successContainer: "#e8f5e9"
  warningContainer: "#fff8e1"
  errorContainer: "#fce4de"
  infoContainer: "#e3edf8"
  # Financial（收入／支出）
  income: "#81b29a"
  expense: "#e07a5f"
  # Accent（為淺色背景加深以利可讀性）
  accentGreen: "#3d8b6e"
  accentRed: "#c9563c"
  accentYellow: "#b38b2d"
  accentBlue: "#3d405b"
  # Brand / Foreground
  logoText: "#3d3a36"
  onPrimary: "#ffffff"
  onError: "#ffffff"
  shadow: "#000000"

# ── 深色主題（dark，覆寫 colors 中的同名 token）─────────────
colorsDark:
  # Primary（深色背景用亮綠 Bright Green）
  primary: "#4ade80"
  primaryDark: "#22c55e"
  primaryLight: "#86efac"
  # Surfaces（近黑帶暖調 Near-black）
  bgPrimary: "#0a0a0b"
  bgCard: "#141416"
  bgSecondary: "#1a1a1c"
  # Text（暖白／灰 Warm White & Gray）
  textPrimary: "#e8e6e3"
  textSecondary: "#666666"
  textTertiary: "#4a4a4a"
  # Border
  border: "#2a2a2c"
  borderDark: "#3a3a3c"
  borderSubtle: "#ffffff08"
  # Status
  success: "#4ade80"
  warning: "#ffe66d"
  error: "#ff6b6b"
  info: "#4ecdc4"
  # Status containers
  successContainer: "#1a3a2a"
  warningContainer: "#3a3020"
  errorContainer: "#3a1a1a"
  infoContainer: "#1a2a3a"
  # Financial
  income: "#4ade80"
  expense: "#ff6b6b"
  # Accent
  accentGreen: "#4ade80"
  accentRed: "#ff6b6b"
  accentYellow: "#ffe66d"
  accentBlue: "#4ecdc4"
  # Brand / Foreground
  logoText: "#ffffff"
  onPrimary: "#000000"
  onError: "#ffffff"
  shadow: "#000000"

# ── 圖表配色（跨主題共用，依序取色）─────────────────────────
chart:
  c1: "#e07a5f"
  c2: "#81b29a"
  c3: "#f2cc8f"
  c4: "#3d405b"
  c5: "#6d597a"
  c6: "#b56576"
  c7: "#355070"
  c8: "#eaac8b"
  c9: "#9a9590"

# ── Typography（語義字級，源自三大字型家族）─────────────────
typography:
  display:
    fontFamily: Libre Baskerville
    fontSize: 2.5rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Libre Baskerville
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.2
  headline-md:
    fontFamily: Noto Sans TC
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: Libre Baskerville
    fontSize: 1.125rem
    fontWeight: 700
    lineHeight: 1.3
  body-lg:
    fontFamily: Noto Sans TC
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Noto Sans TC
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Noto Sans TC
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: Noto Sans TC
    fontSize: 0.875rem
    fontWeight: 600
    lineHeight: 1.4
  label-sm:
    fontFamily: Noto Sans TC
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: Noto Sans TC
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.4
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0.02em

# ── 圓角 ─────────────────────────────────────────────────
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  full: 9999px

# ── 間距（8px 節奏，4px 半階）──────────────────────────────
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  "2xl": 24px
  "3xl": 32px

# ── 元件 token（property 以 token reference 引用，僅引用淺色 colors 群組）──
components:
  # ── Buttons ──
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.onPrimary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md} {spacing.lg}"
  button-primary-hover:
    backgroundColor: "{colors.primaryDark}"
    textColor: "{colors.onPrimary}"
  button-secondary:
    backgroundColor: "{colors.bgSecondary}"
    textColor: "{colors.textPrimary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md} {spacing.lg}"
  # ── Photo-first 主操作（中央拍照／記帳懸浮鈕，App 的核心入口）──
  fab-scan:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.onPrimary}"
    rounded: "{rounded.full}"
    padding: "{spacing.lg}"
  # ── Cards & Surfaces ──
  card:
    backgroundColor: "{colors.bgCard}"
    textColor: "{colors.textPrimary}"
    rounded: "{rounded.lg}"
    padding: "{spacing.2xl}"
  list-item:
    backgroundColor: "{colors.bgCard}"
    textColor: "{colors.textPrimary}"
    typography: "{typography.body-md}"
    padding: "{spacing.md} {spacing.lg}"
  modal:
    backgroundColor: "{colors.bgCard}"
    textColor: "{colors.textPrimary}"
    rounded: "{rounded.lg}"
    padding: "{spacing.2xl}"
  bottom-sheet:
    backgroundColor: "{colors.bgCard}"
    textColor: "{colors.textPrimary}"
    rounded: "{rounded.xl}"
    padding: "{spacing.2xl}"
  # ── Navigation（底部分頁列）──
  tab-bar:
    backgroundColor: "{colors.bgCard}"
    textColor: "{colors.textSecondary}"
    typography: "{typography.label-sm}"
    padding: "{spacing.sm} {spacing.md}"
  tab-active:
    textColor: "{colors.primary}"
    typography: "{typography.label-sm}"
  # ── Inputs ──
  input:
    backgroundColor: "{colors.bgCard}"
    textColor: "{colors.textPrimary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md} {spacing.lg}"
  input-focus:
    backgroundColor: "{colors.bgCard}"
    textColor: "{colors.textPrimary}"
  input-error:
    backgroundColor: "{colors.errorContainer}"
    textColor: "{colors.error}"
  # ── Chips ──
  chip:
    backgroundColor: "{colors.bgSecondary}"
    textColor: "{colors.textSecondary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs} {spacing.md}"
  chip-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.onPrimary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs} {spacing.md}"
  # ── Status：badge / toast / banner ──
  badge-success:
    backgroundColor: "{colors.successContainer}"
    textColor: "{colors.accentGreen}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs} {spacing.md}"
  badge-warning:
    backgroundColor: "{colors.warningContainer}"
    textColor: "{colors.accentYellow}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs} {spacing.md}"
  badge-error:
    backgroundColor: "{colors.errorContainer}"
    textColor: "{colors.accentRed}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs} {spacing.md}"
  badge-info:
    backgroundColor: "{colors.infoContainer}"
    textColor: "{colors.info}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs} {spacing.md}"
  toast:
    backgroundColor: "{colors.bgCard}"
    textColor: "{colors.textPrimary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "{spacing.md} {spacing.lg}"
  banner-warning:
    backgroundColor: "{colors.warningContainer}"
    textColor: "{colors.accentYellow}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "{spacing.md} {spacing.lg}"
  # ── Financial amount（記帳金額顯示，襯線體 + 收支語義色）──
  amount-income:
    textColor: "{colors.income}"
    typography: "{typography.display}"
  amount-expense:
    textColor: "{colors.expense}"
    typography: "{typography.display}"
---

# Prompt Library Design System

> Monē 是一款以「拍照記帳」為核心的 AI 智慧記帳應用程式。本檔案是 Monē 設計系統的
> **單一真實來源（SSOT）**，描述視覺識別供 AI agent 與人類在跨 session、跨工具時保持一致。
>
> **Token 程式碼真實來源**：[`src/shared/src/design-tokens/`](src/shared/src/design-tokens/)
> （`colors.ts` / `types.ts`）。本檔案的 frontmatter 由該處逐值萃取，**修改 token 值時請以程式碼為準並同步本檔**。
> 給 Copilot 的操作指引另見 [`.github/instructions/design.instructions.md`](.github/instructions/design.instructions.md)。

## Overview

Monē 的視覺語言是**暖色莫蘭迪（Warm Morandi）**：以低飽和度、沉穩溫暖的大地色調為核心，
偏好奶油白、暖砂、鼠尾草綠與陶土紅，避免高飽和度的冷色系，營造「專業卻親切」的理財氛圍。

- **品牌個性**：溫暖、沉穩、值得信賴。像一本質感雅緻的記帳本，而非冰冷的金融儀表板。
- **目標情緒**：讓使用者在記錄消費時感到輕鬆、無壓力；金錢數字以節制的色彩呈現，不製造焦慮。
- **設計哲學**：**功能 > 動畫 > 基本無障礙**。先把功能做對，再投入視覺回饋，最後補上必要的無障礙支援。
- **介面氣質**：留白充足、層次柔和、圓角親和。資訊密度適中，重要操作（拍照記帳）始終是視覺焦點。
- **語言**：UI 與文件以**繁體中文優先**。

此設計系統**跨平台統一**：mone-web（使用者 Web）、admin-portal（管理後台）、mobile（React Native App）
與 landing（行銷頁）共用同一套 token，並原生支援**淺色（預設）與深色**雙主題。

### 核心特徵（Key Characteristics）

- **拍照記帳優先**：中央懸浮的拍照／記帳按鈕（`fab-scan`）是每個畫面的視覺與操作焦點。
- **暖色莫蘭迪**：低飽和大地色系，奶油白底（`#faf8f5`）+ 暖鼠尾草綠單一主色，刻意避開冷色系。
- **單一 Primary**：每個畫面只有一個 primary 操作；綠＝收入、陶土紅＝支出，色彩語義即財務語義。
- **襯線金額**：金額與大標以 Libre Baskerville 襯線體呈現（`amount-income` / `amount-expense`），帶記帳本般的質感。
- **柔和圓角 + 色調分層**：以 tonal layer（底色→卡片）與細描邊取代厚重陰影，圓角親和（卡片 16px、pill 9999px）。
- **原生雙主題**：light（預設）與 dark 為並列 token 群組，語義名一致；深色用亮綠主色 + 黑字（`onPrimary`）。
- **克制動效**：150/200/300ms 三段過場，動畫服務功能回饋，不喧賓奪主。

## Colors

調色盤建立在**暖中性色**與**少量語義強調色**之上。所有 UI 色彩都必須透過語義 token 引用，
**嚴禁硬編碼 hex 值**。深色主題並非單純反相，而是調整明度與飽和度以確保深色背景上的可讀性。

### 語義角色

- **Primary（鼠尾草綠 / 亮綠）**：主要操作、按鈕、強調與選取狀態。淺色為暖鼠尾草綠 `#81b29a`，
  深色改用亮綠 `#4ade80` 以在近黑背景上維持辨識度。
- **Surfaces（奶油白 → 純白 / 近黑 → 卡片黑）**：頁面底色比卡片底色更「暖、更暗一階」，
  以 tonal layer 建立層次（見 Elevation & Depth）。淺色底色 `#faf8f5` 比純白更柔和有機。
- **Text（暖棕 / 暖白）**：主文字、輔助文字、提示文字三階，避免純黑與純白。
- **Status（success / warning / error / info）**：狀態色；深色主題略提高明度。
  **error（陶土紅 `#e07a5f`）** 同時作為支出色，呼應品牌的溫暖調性。
- **Financial（income / expense）**：收入＝primary 綠、支出＝error 紅，與 status 共用同一色系。
- **Accent（green / red / yellow / blue）**：用於文字/圖示上的強調。**淺色主題刻意加深**
  （如 accentGreen `#3d8b6e`、accentRed `#c9563c`），以在淺底上達到足夠對比；深色主題則與 status 同值。

### 色票對照（Light / Dark）

| Token | Light | Dark | 用途 |
|-------|-------|------|------|
| `primary` | `#81b29a` | `#4ade80` | 主要操作、按鈕、強調 |
| `primaryDark` | `#5a9a7a` | `#22c55e` | 主色深變體、hover |
| `primaryLight` | `#a8d4be` | `#86efac` | 主色淺變體 |
| `bgPrimary` | `#faf8f5` | `#0a0a0b` | 頁面主背景 |
| `bgCard` | `#ffffff` | `#141416` | 卡片／面板背景 |
| `bgSecondary` | `#f0eeeb` | `#1a1a1c` | 次要背景區塊 |
| `textPrimary` | `#3d3a36` | `#e8e6e3` | 主要文字 |
| `textSecondary` | `#9a9590` | `#666666` | 輔助文字 |
| `textTertiary` | `#b5b0ab` | `#4a4a4a` | 提示／禁用文字 |
| `border` | `#e8e6e3` | `#2a2a2c` | 一般邊框 |
| `borderDark` | `#d4d1cd` | `#3a3a3c` | 較深邊框 |
| `borderSubtle` | `#00000008` | `#ffffff08` | 細微邊框（卡片描邊） |
| `success` | `#81b29a` | `#4ade80` | 成功狀態 |
| `warning` | `#f2cc8f` | `#ffe66d` | 警告狀態 |
| `error` | `#e07a5f` | `#ff6b6b` | 錯誤／支出 |
| `info` | `#3d405b` | `#4ecdc4` | 資訊狀態 |
| `successContainer` | `#e8f5e9` | `#1a3a2a` | 成功提示底色 |
| `warningContainer` | `#fff8e1` | `#3a3020` | 警告提示底色 |
| `errorContainer` | `#fce4de` | `#3a1a1a` | 錯誤提示底色 |
| `infoContainer` | `#e3edf8` | `#1a2a3a` | 資訊提示底色 |
| `income` | `#81b29a` | `#4ade80` | 收入金額 |
| `expense` | `#e07a5f` | `#ff6b6b` | 支出金額 |
| `accentGreen` | `#3d8b6e` | `#4ade80` | 綠色強調文字／圖示 |
| `accentRed` | `#c9563c` | `#ff6b6b` | 紅色強調文字／圖示 |
| `accentYellow` | `#b38b2d` | `#ffe66d` | 黃色強調文字／圖示 |
| `accentBlue` | `#3d405b` | `#4ecdc4` | 藍色強調文字／圖示 |
| `logoText` | `#3d3a36` | `#ffffff` | Logo 文字 |
| `onPrimary` | `#ffffff` | `#000000` | Primary 上的前景色 |
| `onError` | `#ffffff` | `#ffffff` | Error 上的前景色 |

### 狀態容器（Status Containers）

低飽和度背景色，用於狀態提示區塊（toast、inline alert、badge）。較大區塊的文字可搭配同名 status 色
（`successContainer` 配 `success`、`errorContainer` 配 `error`）；**小字（如 badge）建議改用加深的 `accent*` token**
（`accentGreen` / `accentYellow` / `accentRed`）以確保在淺色容器上的對比。

### 圖表配色（Chart Palette）

資料視覺化統一使用 `chart.c1…c9`，依資料序列**依序取色**，跨淺／深主題共用同一組值：

```
#e07a5f  #81b29a  #f2cc8f  #3d405b  #6d597a  #b56576  #355070  #eaac8b  #9a9590
```

程式碼匯出為 `CHART_PALETTE`（`@mone/shared/design-tokens`）。

### 不納入 token 系統的品牌例外色

以下色值遵循**外部品牌規範**，不納入語義 token，亦不受深色主題切換影響：

- **Google Sign-In**：`#131314` / `#FFFFFF` / `#4285F4` 等，遵循 Google Brand Guidelines。
- **分類色彩（Category Colors）**：各記帳分類有固定色碼，由 API 回傳，前端直接套用。

## Typography

字型策略以三個家族分工，建立「敘事 / 內文 / 數據」三條視覺線：

- **Libre Baskerville（serif，`font-title`）**：標題、Logo 與**金額數字**。襯線體帶來雜誌般的
  質感與權威感，是品牌的「敘事聲音」。
- **Noto Sans TC（sans-serif，`font-body`）**：所有內文與 UI 文字，確保繁體中文長文易讀。
  fallback 串接系統字型（`-apple-system`、`PingFang TC`、`Microsoft YaHei`、`Heiti TC` 等）。
- **JetBrains Mono（monospace，`font-mono`）**：發票號碼、時間戳、技術性數據與等寬對齊場景。

### 字級 scale（語義級別）

| Level | Family | Size | Weight | 用途 |
|-------|--------|------|--------|------|
| `display` | Libre Baskerville | 2.5rem / 40px | 700 | Hero 大數字、首頁金額 |
| `headline-lg` | Libre Baskerville | 1.5rem / 24px | 700 | 頁面主標題、卡片大標 |
| `headline-md` | Noto Sans TC | 1.25rem / 20px | 600 | 區塊標題 |
| `title` | Libre Baskerville | 1.125rem / 18px | 700 | 卡片標題、品牌字 |
| `body-lg` | Noto Sans TC | 1rem / 16px | 400 | 主要內文 |
| `body-md` | Noto Sans TC | 0.9375rem / 15px | 400 | 一般內文（預設） |
| `body-sm` | Noto Sans TC | 0.875rem / 14px | 400 | 次要內文 |
| `label-md` | Noto Sans TC | 0.875rem / 14px | 600 | 按鈕、表單標籤 |
| `label-sm` | Noto Sans TC | 0.75rem / 12px | 500 | 小標籤、tab |
| `caption` | Noto Sans TC | 0.75rem / 12px | 400 | 輔助說明、metadata |
| `mono-data` | JetBrains Mono | 0.875rem / 14px | 500 | 發票號、時間戳、代碼 |

> Web 端字級由 Tailwind 預設 scale 驅動（1rem = 16px），上表為語義對應；
> **Mobile（React Native）使用系統預設字型**，不額外載入自訂字型，僅沿用相同的字級與字重語義。

## Layout

版面以 **8px 節奏**為基礎，搭配 **4px 半階**做微調，維持一致的視覺韻律。

### 間距 scale

| Token | 值 |
|-------|-----|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 12px |
| `lg` | 16px |
| `xl` | 20px |
| `2xl` | 24px |
| `3xl` | 32px |

- **卡片內距**：一般使用 `2xl`（24px）營造柔和、可呼吸的留白；緊湊列表可降至 `lg`（16px）。
- **元素間距**：相關元素群以 `sm`～`md` 聚合，區塊之間以 `2xl`～`3xl` 分隔。

### RWD 斷點（Web）

採 mobile-first 流式版面，桌面以最大寬度容器收斂內容。Tailwind 斷點：

| 斷點 | 寬度 |
|------|------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

### Motion

過場以克制為原則，使用三段 transition：`fast 150ms` / `normal 200ms` / `slow 300ms`（皆 `ease`）。
動畫服務於功能回饋，不喧賓奪主。

## Elevation & Depth

層次以 **Tonal Layers（色調分層）** 為主，**而非厚重陰影**：

1. **背景層** `bgPrimary`（淺色 `#faf8f5` 暖白／深色 `#0a0a0b` 近黑）——最底層。
2. **次要層** `bgSecondary`——區塊、輸入框、chip 等。
3. **卡片層** `bgCard`（淺色純白／深色 `#141416`）——浮起的內容卡片，承載主要資訊。

卡片以 `borderSubtle`（`#00000008` / `#ffffff08`）做極細描邊強化邊界，而非依賴陰影。
需要陰影時，`shadowColor` 使用 `#000000`（React Native 陰影系統慣例），保持輕、柔、低不透明度。

### 深色模式核心規則

1. **背景**用近黑 `#0a0a0b`，**避免純黑** `#000000`。
2. **Primary** 改用亮綠 `#4ade80`（非鼠尾草綠），確保深底可辨識。
3. **onPrimary** 在深色下為 `#000000`（亮綠按鈕上用黑字）。
4. **Status 色**略提高明度，確保深底可讀。
5. **Status Container** 使用低明度、低飽和的深色底。

## Shapes

形狀語言為**柔和親和的圓角**，呼應品牌的溫暖調性：

| Token | 值 | 用途 |
|-------|-----|------|
| `sm` | 8px | 小元件、badge、input |
| `md` | 12px | 按鈕、輸入框 |
| `lg` | 16px | 卡片、面板 |
| `xl` | 20px | 大型容器、modal |
| `full` | 9999px | chip、pill、頭像、圓形按鈕 |

同一視圖內保持圓角一致，避免混用尖角與圓角。

## Components

元件樣式一律由 token 組成，皆引用 frontmatter 中的語義 token。
元件 token 引用**淺色 `colors` 群組**；深色主題在消費端**改用 `colorsDark` 的同名 token**（見「雙主題慣例」）。
邊框（border）為本系統「以細邊框取代陰影」的扁平風格核心，但 DESIGN.md 元件 sub-token 無對應欄位，故僅於下方 prose 描述，實作時引用 `border` / `borderSubtle` / `primary` 等語義色。

- **Button — Primary**：`primary` 底 + `onPrimary` 字 + `label-md`，圓角 `md`，內距 `md lg`；hover 轉 `primaryDark`。
  深色改用 `colorsDark` 同名 token（亮綠底 + 黑字）。每個畫面**僅一個** primary 按鈕。
- **Button — Secondary**：`bgSecondary` 底 + `textPrimary` 字，圓角 `md`，用於次要操作。
- **FAB — Scan**（`fab-scan`）：**拍照記帳主操作**。`primary` 底 + `onPrimary` 圖示，圓角 `full`，
  置於底部分頁列中央，是 App 的核心入口。
- **Card**：`bgCard` 底 + `textPrimary` 字，圓角 `lg`，內距 `2xl`，以 `borderSubtle` 描邊（非陰影）。
- **List Item**（`list-item`）：交易列／設定列。`bgCard` 底 + `body-md`，以 `border` 作列分隔，內距 `md lg`。
- **Modal / Bottom Sheet**：`bgCard` 底，modal 圓角 `lg`、bottom-sheet 圓角 `xl`，內距 `2xl`。
- **Tab Bar**（`tab-bar` / `tab-active`）：底部分頁列。`bgCard` 底 + `textSecondary`，以 `border` 描上緣；
  選取項（`tab-active`）轉 `primary` 字色。
- **Input**：`bgCard` 底 + `textPrimary` 字 + `body-md`，圓角 `md`，內距 `md lg`，以 `border` 描邊；
  focus 轉 `primary` 邊框；error 以 `errorContainer` 底 + `error` 字/邊框。
- **Chip**：`bgSecondary` 底 + `textSecondary` 字 + `label-sm`，圓角 `full`；選取（`chip-selected`）轉 `primary` 底 + `onPrimary` 字。
- **Status Badge**（`badge-success` / `badge-warning` / `badge-error` / `badge-info`）：對應 `*Container` 底色，
  圓角 `full`。彩色 badge 的小字採用**加深的 `accent*` token**（`accentGreen` / `accentYellow` / `accentRed`）以提升淺色容器上的對比；`badge-info` 用深靛藍 `info`。
- **Toast**（`toast`）：`bgCard` 底 + `body-sm`，圓角 `md`，以 `borderSubtle` 描邊；對應 `Toast.vue` / `useToast`。
- **Banner — Warning**（`banner-warning`）：`warningContainer` 底 + `accentYellow` 字，用於配額提醒等情境。
- **Amount**（`amount-income` / `amount-expense`）：記帳金額顯示，以 `display`（Libre Baskerville 襯線）字級
  搭配 `income`（綠）／`expense`（紅）語義色，是記帳場景的招牌元件。

> 開發新元件時，從 `useTheme()`（Mobile）或 Tailwind token class（Web）取色，
> 切勿硬編碼；按鈕文字/圖示用 `onPrimary`、錯誤提示用 `errorContainer`、圖表取色用 chart palette。

## Do's and Don'ts

- ✅ **Do** 一律透過語義 token 引用色彩（Tailwind class / `useTheme()` / CSS 變數）。
- ✅ **Do** primary 色每個畫面只用於**單一最重要的操作**。
- ✅ **Do** 按鈕上的文字/圖示使用 `onPrimary`；錯誤提示底色使用 `errorContainer`。
- ✅ **Do** 圖表取色一律使用 `CHART_PALETTE`（`@mone/shared/design-tokens`）。
- ✅ **Do** 深色模式下確認文字在新背景上有足夠對比；維持 WCAG AA（一般文字 4.5:1）。
- ✅ **Do** 同一視圖維持一致圓角與一致間距節奏（8px / 4px 半階）。
- ❌ **Don't** 在 Mobile 硬編碼 hex 色值（`#FFFFFF`、`#000000` 等）。
- ❌ **Don't** 在 Web 直接寫 hex，而不走 Tailwind color token。
- ❌ **Don't** 使用高飽和度的冷色系（如 Tailwind 預設的 emerald、indigo）。
- ❌ **Don't** 在 `StyleSheet.create` 靜態樣式放入主題色（應以 inline style override）。
- ❌ **Don't** 在同一視圖混用尖角與圓角。
- ✅ **允許例外**：`shadowColor: '#000'`、相機畫面 `backgroundColor: '#000'`、
  半透明遮罩 `rgba(0,0,0,0.x)`、以及 Google 品牌色——這些不算硬編碼違規。

## Iconography

圖示風格為**線性、簡約、與文字同色**，呼應暖色莫蘭迪的克制調性。各平台的圖示來源不同，但語義一致：

- **Web（mone-web / admin-portal）**：使用專案內自製 SVG 元件，位於
  `src/mone-web/web/src/components/icons/*.vue`（如 `RefreshIcon.vue`），以 `currentColor` 繼承文字色。
- **Mobile**：使用 [`react-native-vector-icons/MaterialCommunityIcons`](https://github.com/oblador/react-native-vector-icons)，
  顏色由 `useTheme()` 的 `colors` 注入。

規則：

- 圖示一律取**語義文字色**（`textPrimary` / `textSecondary` / `primary` / status 色），**勿硬編碼**。
- 互動圖示（如分頁列、FAB）作用中狀態用 `primary`；停用狀態用 `textTertiary`。
- 常用尺寸對齊間距節奏：小 16px、中 20px、大 24px、FAB 內圖示 28–32px。
- 同一畫面維持一致的線寬與視覺重量，避免線性與填色圖示混用。

## 跨平台實作（Cross-Platform Usage）

同一套語義 token 在各平台的引用方式：

**Web（Vue + Tailwind）** — 以 light/dark class 前綴切換：

```html
<div class="bg-light-bg-primary dark:bg-dark-bg-primary
            text-light-text-primary dark:text-dark-text-primary">
```

> Tailwind 對照定義於 `src/mone-web/web/tailwind.config.js` 與 `src/admin-portal/web/tailwind.config.js`，
> 切換策略為 `darkMode: 'class'`（根元素加 `.dark`）。CSS 變數另見 `src/.../assets/styles/variables.css`。

**Mobile（React Native）** — 以 `useTheme()` 取得當前主題的 `colors`：

```tsx
const { colors, isDark } = useTheme()
<View style={{ backgroundColor: colors.background }}>
  <Text style={{ color: colors.text }}>...</Text>
</View>
```

> Mobile 取色定義於 `src/mobile/src/theme/colors.ts`，直接消費 `@mone/shared/design-tokens` 的
> `lightTokens` / `darkTokens`，並透過 React Context（`ThemeContext`）提供 `colors` 與 `isDark`。

## 雙主題慣例（Light / Dark Convention）

本檔案 frontmatter 以 `colors`（淺色，預設）與 `colorsDark`（深色覆寫）**兩個並列群組**表達雙主題，
兩者**語義 token 名完全一致**——消費端只需依當前主題挑選對應群組，不需改變引用名稱。

- `colorsDark` 為官方 DESIGN.md 規範外的延伸群組；規範允許保留未知群組而不報錯。
- **元件 token 一律引用淺色 `colors` 群組**（官方 linter 只解析 `colors`/`typography`/`rounded`/`spacing` 等已知群組的 reference，無法解析 `{colorsDark.*}`）。深色主題由消費端在 runtime **切換到 `colorsDark` 的同名 token**，而非在 frontmatter 定義 `-dark` 元件變體。
- 程式碼層級對應 `@mone/shared/design-tokens` 的 `lightTokens` / `darkTokens`（型別 `DesignTokenColors`）。
- 新增或修改色彩時，請以 `colors.ts` 為準，並同步更新本檔的兩個群組，確保 SSOT 一致。

## Accessibility（無障礙與對比）

依設計哲學「功能 > 動畫 > **基本**無障礙」，暖色莫蘭迪刻意採用低飽和、柔和的色調，部分品牌配色
（如 `onPrimary` 白字於 `primary` 鼠尾草綠、status 色於同名 `*Container`）的對比低於 WCAG AA 4.5:1。
這是品牌識別的既有取捨，**非文件錯誤**；官方 linter 會如實標記這些對比 warning。緩解建議：

- 主色按鈕／FAB 上的文字與圖示**加大、加粗**，套用大型文字（≥ 18.66px bold / 24px）的 AA 3:1 門檻。
- 不單靠顏色傳達狀態：搭配**圖示與文字標籤**（success/error/warning/info）。
- 淺色容器上的小字優先使用**加深的 `accent*` token**（如 `accentYellow` / `accentGreen` / `accentRed`）。
- 深色主題已調高主色與 status 明度；切換主題後仍應抽查關鍵頁面的對比。
