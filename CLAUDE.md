# CLAUDE.md

このリポジトリで作業する際のガイドラインです。

## プロジェクト概要

**Emerald Box** は、ブラウザだけで完結する HTML/CSS/JS サンドボックス（AI ワークショップ向け）。
完全クライアントサイドの Astro（SSG）アプリで、Monaco Editor・`localStorage` 自動保存・iframe による JS 実行/強制終了を備える。詳細な要件は `plan.md` を参照。

## コマンド

> パッケージマネージャは **必ず `pnpm`** を使う（`npm` は使わない）。

```bash
pnpm install      # 依存インストール
pnpm dev          # 開発サーバー（http://localhost:4321）
pnpm build        # 本番ビルド（dist/ へ静的出力）
pnpm preview      # ビルド結果のプレビュー
```

- コード変更後は **コミット前に `pnpm build` を通す**（Astro が型チェックも行う）。
- 挙動確認は `pnpm dev` を起動し `curl` で配信内容を検証するのが手早い。

## アーキテクチャ

- `src/pages/index.astro` が UI 本体 + クライアントスクリプト。`<script>` 内で Monaco を初期化し全機能を配線する。
- **ペインの概念**: `PaneKey = 'html' | 'css' | 'javascript' | 'preview'`（`src/lib/storage.ts`）。HTML/CSS/JS/プレビューの4ペインを横並びにし、各ペインは表示トグルとガターによるリサイズが可能。
  - 表示状態・サイズ（flex-grow 比率）・コードはそれぞれ別キーで `localStorage` に永続化（`emerald-box:code/panels/sizes:v1`）。
  - エディタは `EditorLang`（preview を除く3種）にのみ存在。`preview` を扱う箇所は `isEditorLang()` でガードする。
- `src/lib/preview.ts` の `PreviewController` が iframe を管理。
  - `renderMarkup()`: HTML/CSS のみ反映（ライブプレビュー）。
  - `runWithJs()`: JS を含めて実行（「JS実行」ボタン）。
  - `forceStop()`: iframe を `remove()` → 再生成して暴走スクリプトを停止。
- `src/lib/storage.ts`: 読み込み/保存とデバウンス。壊れたデータは必ずデフォルトへフォールバックする。
- `src/components/Credits.astro` + `src/lib/licenses.ts`: ライセンス表示モーダル。

## 規約・注意点

- **UI 文言はすべて日本語**で記述する。
- **イミュータブル**に書く（オブジェクトは破壊的変更せず新規生成。例: `panels = { ...panels, [key]: !panels[key] }`）。
- **多数の小さなファイル** を優先（高凝集・低結合）。
- **コミットは1作業ごと**。Conventional Commits（`feat:` `fix:` `chore:` `docs:` 等）で、メッセージは日本語。**attribution（Co-Authored-By）は付けない**。
- 外部依存（Monaco・0xProto フォント）は **CDN からバージョン固定で読み込む**（改ざんリスク低減）。バージョンを上げる際は固定値を更新する。

## ハマりどころ

- **0xProto のフォント名は CSS で必ず引用符で囲む**（`"0xProto"`）。数字始まりのフォント名は無引用だと無効トークンになり適用されない。Tailwind config・Monaco の `fontFamily`・`@font-face` すべてで引用する。
- **プレビュー iframe に `allow-same-origin` を絶対に追加しない**。`allow-scripts` と併用するとサンドボックスが実質無効化される。
- ペインを再表示・リサイズした後は対象エディタの `editor.layout()` を呼んでサイズを再計算する。

## 公開について

完全クライアントサイドで秘密情報を持たず、`public` リポジトリで公開可能。利用 OSS/フォントは MIT / SIL OFL 1.1 で、クレジットはアプリ内モーダルに表示済み。
