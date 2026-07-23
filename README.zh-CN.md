# thinking-orbs

[English](README.md) · **简体中文** · [日本語](README.ja.md)

适用于 AI 与智能体界面的点阵思考球加载指示器。包含六种手工调校的动画状态，每种状态均提供两种针对不同用途调校的尺寸；使用普通 2D canvas 渲染，无需 WebGL 和滤镜，在 Chrome、Safari 与 Firefox 中表现一致。

[在线演示](https://orbs.jakubantalik.com) · [代码仓库](https://github.com/Jakubantalik/thinking-orbs) · [报告问题](https://github.com/Jakubantalik/thinking-orbs/issues)

## 安装

```bash
npm install thinking-orbs
```

## 快速开始

```tsx
import { ThinkingOrb } from 'thinking-orbs';

function Status() {
  return <ThinkingOrb state="searching" size={64} />;
}
```

## 状态

智能体可能执行的六种动作，每种都有独特动画：

```tsx
<ThinkingOrb state="working" />    {/* 粒子沿倾斜轨道运动 */}
<ThinkingOrb state="searching" />  {/* 扫描子午线掠过点阵球体 */}
<ThinkingOrb state="solving" />    {/* 环带打乱后重新拼合 */}
<ThinkingOrb state="listening" />  {/* 波形穿过环带 */}
<ThinkingOrb state="composing" />  {/* 起伏的多环带饰带 */}
<ThinkingOrb state="shaping" />    {/* 点阵轮廓：圆形 → 三角形 → 方形 */}
```

## 尺寸

提供两种分别调校的预设，并非简单缩放。`64` 适合聊天头像尺寸，`20` 适合行内文本尺寸；两者各自拥有专门的点数、点大小和速度设置：

```tsx
<ThinkingOrb state="working" size={64} />
<ThinkingOrb state="working" size={20} />
```

## 主题

严格采用单色设计：深色背景使用浅色图形，浅色背景使用深色图形；模式会根据宿主项目自动选择：

```tsx
<ThinkingOrb theme="auto" />   {/* 默认：从项目中检测 */}
<ThinkingOrb theme="dark" />   {/* 固定：深色背景使用浅色点 */}
<ThinkingOrb theme="light" />  {/* 固定：浅色背景使用深色点 */}
```

`auto` 按三层规则解析，并在任一条件变化时实时更新：

1. 查找祖先元素的 `data-theme="dark|light"` 属性或 `dark`/`light` 类（Tailwind / shadcn 约定），并通过 `MutationObserver` 监听；
2. 否则使用 `prefers-color-scheme`，并订阅操作系统主题的实时切换；
3. 支持 SSR：canvas 仅在客户端解析主题后绘制。

## 其他属性

```tsx
<ThinkingOrb
  state="solving"
  size={20}
  speed={1.5}          // 预设速度的倍率
  paused={false}       // 停在当前帧
  aria-label="正在分析仓库…"  // 覆盖各状态的默认标签
/>
```

其他所有 `<canvas>` 属性（`className`、`style`、`data-*` 等）都会原样传递。

## 无障碍与性能

- 默认提供 `role="img"` 和符合各状态含义的 `aria-label`。
- 当设置 `prefers-reduced-motion: reduce` 时，会渲染静态代表帧而不播放动画，并继续响应实时主题。
- 每个实例在滚出屏幕（`IntersectionObserver`）或标签页隐藏时会自动暂停，并以同步相位恢复；所有实例共用同一个时钟。
- 仅使用普通 2D canvas 圆弧：不使用 `ctx.filter`、SVG 滤镜或 WebGL；各处像素表现一致，对低端设备也很轻量。设备像素比上限为 2。

## 许可证

MIT © Jakub Antalik
