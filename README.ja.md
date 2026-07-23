# thinking-orbs

[English](README.md) · [简体中文](README.zh-CN.md) · **日本語**

AI・エージェント UI 向けの、ドットで構成された思考オーブ型ローディングインジケーターです。手作業で調整された 6 つのアニメーション状態を、それぞれ用途別に調整した 2 サイズで提供します。通常の 2D canvas で描画し、WebGL もフィルターも不要です。Chrome、Safari、Firefox で同じように動作します。

[ライブデモ](https://orbs.jakubantalik.com) · [リポジトリ](https://github.com/Jakubantalik/thinking-orbs) · [問題を報告](https://github.com/Jakubantalik/thinking-orbs/issues)

## インストール

```bash
npm install thinking-orbs
```

## クイックスタート

```tsx
import { ThinkingOrb } from 'thinking-orbs';

function Status() {
  return <ThinkingOrb state="searching" size={64} />;
}
```

## 状態

エージェントが実行できる 6 つの動作を、それぞれ異なるアニメーションで表します：

```tsx
<ThinkingOrb state="working" />    {/* 粒子が傾いた軌道を周回 */}
<ThinkingOrb state="searching" />  {/* スキャン子午線がドット球を通過 */}
<ThinkingOrb state="solving" />    {/* 帯が崩れ、解けた形に戻る */}
<ThinkingOrb state="listening" />  {/* 波形がリングを通過 */}
<ThinkingOrb state="composing" />  {/* 波打つ複数帯のサッシュ */}
<ThinkingOrb state="shaping" />    {/* ドット輪郭：円 → 三角形 → 四角形 */}
```

## サイズ

単純な拡大縮小ではなく、個別に調整した 2 つのプリセットがあります。`64` はチャットアバター向け、`20` はインラインテキスト向けです。それぞれ専用のドット数、ドットサイズ、速度設定を持ちます：

```tsx
<ThinkingOrb state="working" size={64} />
<ThinkingOrb state="working" size={20} />
```

## テーマ

完全なモノクロです。暗い背景には明るい描画、明るい背景には暗い描画を使い、ホストプロジェクトからモードを自動選択します：

```tsx
<ThinkingOrb theme="auto" />   {/* デフォルト：プロジェクトから検出 */}
<ThinkingOrb theme="dark" />   {/* 固定：暗い背景に明るいドット */}
<ThinkingOrb theme="light" />  {/* 固定：明るい背景に暗いドット */}
```

`auto` は次の 3 段階で解決し、いずれかが変わるとリアルタイムに更新されます：

1. 祖先要素の `data-theme="dark|light"` 属性、または `dark`/`light` クラス（Tailwind / shadcn の慣例）を探し、`MutationObserver` で監視します。
2. 見つからなければ `prefers-color-scheme` を使い、OS テーマの切り替えを購読します。
3. SSR セーフです。canvas はテーマ解決後にクライアント上でのみ描画されます。

## その他のプロパティ

```tsx
<ThinkingOrb
  state="solving"
  size={20}
  speed={1.5}          // プリセット速度に掛ける倍率
  paused={false}       // 現在のフレームで停止
  aria-label="リポジトリを解析中…"  // 状態ごとのデフォルト値を上書き
/>
```

その他の `<canvas>` プロパティ（`className`、`style`、`data-*` など）はすべてそのまま渡されます。

## アクセシビリティと性能

- デフォルトで `role="img"` と、状態ごとに適切な `aria-label` を設定します。
- `prefers-reduced-motion: reduce` ではアニメーションを使わず代表的な静止フレームを描画し、ライブテーマには引き続き追従します。
- 各インスタンスは画面外へスクロールされたとき（`IntersectionObserver`）やタブが非表示のときに自動停止し、同じ位相で再開します。すべてのインスタンスが 1 つのクロックを共有します。
- 通常の 2D canvas の円弧のみを使います。`ctx.filter`、SVG フィルター、WebGL は不使用です。どの環境でも同じピクセルになり、低性能端末でも軽量です。デバイスピクセル比は最大 2 に制限します。

## ライセンス

MIT © Jakub Antalik
