# 計画書: 高機能インブラウザ・HTMLプレビューツール開発 (Astro + Monaco Editor + Tailwind CSS)

## 1. プロジェクト概要
AIワークショップ向けに、VS Codeと同等の操作性を持つ「Monaco Editor」を組み込んだ、完全クライアントサイド完結型のWebアプリケーション。
UIデザインに Tailwind CSS を採用し、自然で洗練された「グリーン（緑）」をテーマカラーとしたモダンなインターフェースを構築する。自動保存、コードスニペット、JavaScriptの意図的な実行・強制終了制御を備え、受講者が安全かつ直感的にコードを検証できる環境をAstro（SSG）で提供する。

---

## 2. 技術スタック
- フレームワーク: Astro (v4.x以降 / SSGモード)
- UIデザイン: Tailwind CSS (Astro公式インテグレーション @astrojs/tailwind)
- コアエディタ: Monaco Editor (loader経由でのCDN読み込み)
- 状態管理: Web Storage API (LocalStorage)
- iframe制御: 動的DOM生成によるJS実行・強制終了ロジック

---

## 3. デザインシステム（グリーンテーマ）
Tailwind CSSのカラーパレットをベースに、開発集中度を高めるダークモード主体のエディタUIと、清潔感のあるグリーンのアクセントを採用する。

- 主要カラー:
  - プライマリ（アクセント）: emerald-600 (#059669) / emerald-500 （ボタン、アクティブ状態、進捗表示）
  - ベース背景（UI周り）: slate-900 (#0f172a) / slate-800 （エディタ外枠、ツールバー、サイドメニュー）
  - テキスト: slate-100 （ヘッダー・ラベル）、emerald-400 （強調テキスト・成功ステータス）
- タイポグラフィ:
  - UI要素: font-sans (Inter, 游ゴシック等)
  - コード・スニペット要素: font-mono (Fira Code, JetBrains Mono等)

---

## 4. 主要機能要件

### ① Monaco Editorの導入とスニペット機能
- VS Codeクローン: 構文ハイライト（vs-darkテーマ）、自動補完、インデント。
- HTML/CSS/JSスニペット: Tailwindのレイアウト（Grid/Flexbox）、モダンなボタンデザイン、Fetch APIのテンプレートなどをワンクリックで挿入できるサイドパネル、またはドロップダウンメニュー。

### ② ローカル自動保存 (LocalStorage)
- 自動保存: ユーザーのタイピングを検知し、500msのデバウンス（時間差）を経てブラウザの localStorage に自動保存。
- 自動復元: ページリロード時やブラウザ再起動時に、前回のコード状態をエディタに自動展開。

### ③ JSの実行制御（手動実行 ＆ 強制終了ボタン）
- JS実行ボタン: 無限ループの即時実行を防ぐため、HTML/CSSのリアルタイム反映とは別に、JavaScriptを任意のタイミングで評価させる制御オプション。
- JS強制終了ボタン: while(true) 等によるフリーズ発生時、iframe をDOMから完全に削除（remove()）し、新しい iframe を動的に再生成することで、タブを閉じることなくスクリプトのプロセスを強制停止する。

---

## 5. コンポーネント・画面レイアウト設計 (Tailwind CSSベース)

### 画面構成（3カラム・1ヘッダー構造）
- 画面最上部: ヘッダー。アプリ名「AI Web Sandbox」を左側に配し、右側に「▶ Run JS」「■ Force Stop」「Reset」のコントロールボタンを配置。
- 画面左側（幅 w-64）: スニペットメニューパネル。背景は bg-slate-900。HTML5 Template、Tailwind Button、Grid Layout、Fetch API などの選択肢を縦に並べる。
- 画面中央（可変幅 flex-1）: Monaco Editor配置エリア。背景は bg-slate-950。
- 画面右側（可変幅 flex-1）: ライブプレビュー表示エリア。背景は bg-white（独立したiframe）。

---

## 6. 詳細開発ロードマップ

### フェーズ 1: プロジェクト初期化とTailwind導入
- npm create astro@latest でプロジェクト作成。
- npx astro add tailwind を実行し、Tailwind CSS環境を自動セットアップ。
- tailwind.config.mjs でテーマカラーの拡張（必要に応じてカスタムエメラルドグリーンを設定）。

### フェーズ 2: UIレイアウト構築（Tailwindスタイリング）
- Header.astro の作成。背景を bg-slate-900、境界線を border-emerald-800、ボタン類を bg-emerald-600 hover:bg-emerald-500 でスタイリング。
- SnippetMenu.astro の作成。スニペット一覧をホバー時に hover:bg-slate-800 / hover:text-emerald-400 となるよう実装。
- FlexboxまたはGridを用いた、PC最適な3カラム配置の確立。

### フェーズ 3: Monaco EditorとLocalStorageの統合
- @monaco-editor/loader を用いて、静的サイト内でMonaco Editorを安全にインポート。
- エディタの変更イベントに連動させた localStorage への自動保存ロジックの実装。

### フェーズ 4: 実行・強制終了（iframe制御）の実装
- 「プレビュー実行」ボタンによる iframe.srcdoc へのコード注入機能の確立。
- 「強制終了」ボタンによる iframe の破棄と、document.createElement('iframe') による再生成処理の実装。アタッチ時にTailwindクラス（w-full h-full bg-white）を動的に付与する。

---

## 7. ワークショップ運営時の技術的留意点
- TailwindのCDN対応（プレビュー内）:
  受講者がプレビュー（iframe内）でもTailwind CSSクラスを使用できるよう、スニペットのHTMLテンプレート内、またはツール側で自動的に TailwindのプレイグラウンドCDNスクリプト（script src="https://cdn.tailwindcss.com"） を head に埋め込む仕様にする。これにより、AIが生成したTailwindコードがその場で美しくレンダリングされる。
- データのリセット:
  別のワークや新しいセッションに移る際、前回のキャッシュをワンクリックでクリアできるよう、ヘッダーに「環境初期化（localStorage.clear() & リロード）」ボタンを配置し、視認性の高いアクセント（hover:bg-amber-600）を付与する。



ちなみにこのプロダクトの名前案は「Emerald Box」
全てのUIは日本語で記述してください。
