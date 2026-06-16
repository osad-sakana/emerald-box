<div align="center">

# 🟢 Emerald Box

**ブラウザだけで完結する HTML / CSS / JavaScript サンドボックス**

VS Code と同等の操作感（Monaco Editor）を備え、AI が生成したコードをその場で安全に検証できる、完全クライアントサイドの Web プレイグラウンドです。

[![Astro](https://img.shields.io/badge/Astro-SSG-FF5D01?logo=astro&logoColor=white)](https://astro.build/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-0.52-007ACC?logo=visualstudiocode&logoColor=white)](https://microsoft.github.io/monaco-editor/)
[![License: MIT](https://img.shields.io/badge/License-MIT-059669.svg)](#-ライセンス)

</div>

---

## ✨ 特長

- 🖥 **VS Code クローンの編集体験** — Monaco Editor による構文ハイライト・自動補完・インデント（`vs-dark` テーマ）
- 🧩 **HTML / CSS / JS / プレビューの4ペイン** — それぞれ独立したウィンドウとして並べて表示
- 👁 **ペインの表示オン/オフ** — 必要なウィンドウだけを開閉でき、状態は自動保存
- ↔️ **ドラッグでサイズ変更** — ペイン間のガターをドラッグして幅を自由に調整（比率も保存）
- 💾 **ローカル自動保存** — タイピングを 500ms デバウンスで `localStorage` に保存し、再訪時に自動復元
- ▶️ **JS の手動実行** — HTML/CSS はライブ反映、JavaScript は「JS実行」ボタンで任意のタイミングに評価
- ⏹ **暴走スクリプトの強制終了** — `while(true)` 等でフリーズしても、iframe を破棄・再生成してタブを閉じずに停止
- 🎨 **プレビュー内 Tailwind 対応** — プレビュー iframe に Tailwind Play CDN を自動注入し、AI 生成の Tailwind コードがそのまま美しく描画
- 🧹 **ワンクリック環境初期化** — 保存データを消去して初期状態へリセット
- 🔤 **0xProto フォント** — UI・コードともに視認性の高いプログラミングフォントを採用

---

## 🖼 画面構成

```
┌──────────────────────────────────────────────────────────────────────┐
│  🟢 Emerald Box  Web Sandbox        ▶ JS実行  ■ 強制終了  環境初期化  ⓘ │  ← ヘッダー
├──────────────────────────────────────────────────────────────────────┤
│  表示:  [HTML] [CSS] [JS] [プレビュー]                                  │  ← トグルバー
├───────────────┬───────────────┬───────────────┬──────────────────────┤
│     HTML      │      CSS      │  JavaScript   │      プレビュー        │
│  (Monaco)     ║  (Monaco)     ║  (Monaco)     ║   (iframe / 白背景)    │
│               ║               ║               ║                        │
└───────────────┴───────────────┴───────────────┴──────────────────────┘
                ↑ ガターをドラッグして各ペインの幅を変更
```

> 初期表示は **HTML エディタ + プレビュー** のみ。`CSS` / `JS` はトグルで開けます。

---

## 🚀 セットアップ

> パッケージマネージャは **pnpm** を使用します。

```bash
# 依存関係のインストール
pnpm install

# 開発サーバー起動（http://localhost:4321）
pnpm dev

# 本番ビルド（静的ファイルを dist/ に出力）
pnpm build

# ビルド結果のプレビュー
pnpm preview
```

完全な静的サイト（SSG）なので、`dist/` を任意の静的ホスティング（GitHub Pages / Cloudflare Pages / Netlify など）にそのまま配置できます。

---

## 🛠 技術スタック

| 領域 | 採用技術 |
| --- | --- |
| フレームワーク | [Astro](https://astro.build/)（SSG モード） |
| UI スタイリング | [Tailwind CSS 3](https://tailwindcss.com/)（`@astrojs/tailwind`） |
| コードエディタ | [Monaco Editor](https://microsoft.github.io/monaco-editor/)（`@monaco-editor/loader` で CDN 読み込み） |
| 状態管理 | Web Storage API（`localStorage`） |
| フォント | [0xProto](https://github.com/0xType/0xProto)（jsDelivr CDN） |
| 実行隔離 | サンドボックス化した動的 iframe |

---

## 📁 プロジェクト構成

```
emerald-box/
├─ astro.config.mjs          # Astro 設定（SSG / Tailwind 統合）
├─ tailwind.config.mjs       # グリーンテーマ・0xProto フォント拡張
├─ src/
│  ├─ layouts/
│  │  └─ Layout.astro        # HTML 土台・@font-face 定義
│  ├─ components/
│  │  ├─ Header.astro        # アプリ名 + 操作ボタン群
│  │  └─ Credits.astro       # ライセンス表示モーダル
│  ├─ pages/
│  │  └─ index.astro         # 4ペイン UI + エディタ統合スクリプト
│  └─ lib/
│     ├─ storage.ts          # localStorage 保存/復元・デバウンス
│     ├─ preview.ts          # iframe 制御（実行・強制終了）
│     └─ licenses.ts         # 利用 OSS / フォントのライセンス情報
└─ plan.md                   # 開発計画書
```

---

## 🔒 セキュリティ

- プレビューは `sandbox="allow-scripts allow-modals"` の iframe で実行され、**`allow-same-origin` は付与しません**。ユーザーコードは不透明オリジンに隔離され、親ページの DOM・Cookie・`localStorage` へアクセスできません。
- バックエンド・データベース・秘密情報を一切持たない完全クライアントサイド構成です。ユーザーのコードはブラウザの外へ送信されません。

---

## 📜 ライセンス

本プロジェクトは **MIT License** で公開しています。

利用しているオープンソースソフトウェア・フォントのクレジットは、アプリ右上の **「ⓘ ライセンス」** から確認できます。

| ライブラリ / フォント | ライセンス |
| --- | --- |
| Astro / Tailwind CSS / Monaco Editor / @monaco-editor/loader | MIT License |
| 0xProto | SIL Open Font License 1.1 |

---

<div align="center">

Made with 💚 for AI workshops.

</div>
