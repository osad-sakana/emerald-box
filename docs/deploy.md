# デプロイ手順書

本番は **S3 + CloudFront** で配信する（公開 URL: https://emerald-box.shisui.tokyo/ ）。
公開リポジトリなので、実際のアカウント ID・バケット名・ディストリビューション ID・ロール ARN は
ここに書かない（GitHub Variables と AWS コンソールで管理する）。

## 構成

```
GitHub (main) ──push──▶ GitHub Actions ──OIDC──▶ IAM ロール
                              │                      │
                              ▼                      ▼
                         pnpm build ─▶ dist/ ─▶ S3（非公開）◀──OAC── CloudFront ◀── Route 53 (Alias) ◀── ユーザー
                                                                          │
                                                                    ACM 証明書
```

| 要素 | 役割 |
|---|---|
| S3 バケット | `dist/` の置き場。パブリックアクセスはすべてブロックし、CloudFront の OAC だけが読む |
| CloudFront | HTTPS 配信（**Free プラン**）。HTTP は HTTPS へリダイレクト。デフォルトルートオブジェクトは `index.html` |
| ACM 証明書 | CloudFront 用は **`us-east-1`** で発行する |
| Route 53 | `emerald-box.shisui.tokyo` の A / AAAA（Alias）を CloudFront に向ける |

Emerald Box は 1 ページだけの静的サイトなので、URL 書き換え用の CloudFront Function は不要。
また COOP/COEP ヘッダーも付けない（`require-corp` を付けると CDN 読み込みの Monaco・フォントがブロックされる）。

## 通常のデプロイ

1. 変更を PR にする。PR では `ci.yml` の `test` と `build` が走る。
2. 両方が緑になったら main へマージする。
3. main への push で `.github/workflows/deploy.yml` が自動で動く。
   - `pnpm test` → `pnpm build` → OIDC でロールを引き受け → `aws s3 sync` → CloudFront の無効化（`/*`）
4. Actions の **Deploy (S3 + CloudFront)** が成功したことを確認する。

```bash
gh run list --workflow deploy.yml --limit 3
```

手動で再実行したいとき（main のみ）:

```bash
gh workflow run deploy.yml
```

### キャッシュの扱い

| 対象 | Cache-Control | 理由 |
|---|---|---|
| `_astro/`（ファイル名にハッシュ付き） | `public,max-age=31536000,immutable` | 内容が変われば名前が変わるため。`--delete` しない（古い版を参照中のタブを壊さない） |
| それ以外（`index.html` など） | `no-cache` | 名前が変わらないので毎回再検証させる。`--delete` する |

デプロイのたびに CloudFront を `/*` で無効化する（月 1000 パスまで無料、`/*` は 1 パス扱い）。

## デプロイ後の確認

```bash
curl -sI https://emerald-box.shisui.tokyo/
```

- 先頭が `HTTP/2 200`
- `server: AmazonS3`、`x-cache`、`via: …cloudfront.net` が出る

ブラウザで、エディタが表示され、プレビューと JS 実行が動くことを確認する。

## ロールバック

main の変更を `git revert` で PR にして、マージする（再びデプロイが走る）。`_astro/` は
削除しないので、直前の版のファイルも S3 に残っている。

## GitHub の設定

Settings → Secrets and variables → Actions → **Variables**（Secrets ではない）:

| 名前 | 値 |
|---|---|
| `AWS_ROLE_ARN` | デプロイ用 IAM ロールの ARN |
| `S3_BUCKET` | バケット名 |
| `CLOUDFRONT_DISTRIBUTION_ID` | ディストリビューション ID（`E…`） |

Secrets は使わない（OIDC のため保存する秘密がない）。

## 初期構築のメモ（再構築するとき）

1. **ACM**（`us-east-1`）: `emerald-box.shisui.tokyo` の証明書を DNS 検証で発行する。Route 53 で検証レコードを作成するボタンが使える。
2. **S3**: バケットを作る（リージョンは `ap-northeast-1`）。パブリックアクセスはすべてブロックのまま。
3. **ディストリビューション**:
   - オリジン: S3 の REST エンドポイント + OAC。作成後に表示されるバケットポリシーを S3 に貼る
   - ビューワープロトコル: HTTP を HTTPS にリダイレクト、圧縮オン、キャッシュポリシーは CachingOptimized
   - 料金プランは **Free**（定額）。Emerald Box はカスタムのヘッダーポリシーが不要なので Free で足りる
   - 代替ドメイン名 `emerald-box.shisui.tokyo`・ACM 証明書・デフォルトルートオブジェクト `index.html`（**先頭に `/` を付けない**。`/index.html` だと `/` が 403 になる）
   - WAF は有効にしない（費用が増える）
4. **Route 53**: `emerald-box.shisui.tokyo` の A と AAAA を Alias で CloudFront に向ける。
5. **IAM**:
   - ID プロバイダ `token.actions.githubusercontent.com`（Audience `sts.amazonaws.com`）を追加する
   - ポリシー: 対象バケットの `s3:ListBucket`、バケット配下の `s3:PutObject` / `s3:DeleteObject` / `s3:GetObject`、対象ディストリビューションの `cloudfront:CreateInvalidation` だけを許可する
   - ロールの信頼ポリシーは、リポジトリの `main` ブランチだけに絞る:

     ```json
     "Condition": {
       "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
       "StringLike": { "token.actions.githubusercontent.com:sub": "repo:osad-sakana/emerald-box:ref:refs/heads/main" }
     }
     ```

     PR や他のブランチ、フォークからはロールを引き受けられない。
6. **GitHub**: 上の Variables を登録し、Settings → Pages を無効にする（旧 GitHub Pages デプロイは廃止）。

## 課金の備え

CloudFront は **Free プラン**（定額）で、超過料金は発生しない。利用量の上限はコンソールのプラン詳細で確認する。
S3 の保存料と Route 53 のホストゾーン料は別にかかる（どちらも少額）。

- **AWS Budgets**: 月額 $5 などで通知を設定しておくと安心
- 上限を超えたり想定外の請求があったら、請求画面とプラン詳細を確認する。止めたいときは **CloudFront の対象ディストリビューションを「無効にする」**

## トラブルシュート

| 症状 | 原因の目安 |
|---|---|
| Actions で `Could not assume role` / `AssumeRoleWithWebIdentity` | ロールの信頼ポリシーの `sub`（リポジトリ・ブランチ）や OIDC プロバイダー |
| Actions の S3 で `AccessDenied` | ロールのポリシーのバケット名、`S3_BUCKET` の値 |
| Actions の CloudFront で `AccessDenied` | ロールのポリシーのディストリビューション ID、`CLOUDFRONT_DISTRIBUTION_ID` の値 |
| ブラウザで `403` | バケットポリシー（OAC）が貼られていない、または別のディストリビューション向け。`/index.html` は 200 で `/` だけ 403 なら、デフォルトルートオブジェクトが未設定、または `/index.html` と先頭に `/` が付いている |
| 証明書エラー | ACM が `us-east-1` で発行済みか、代替ドメイン名の設定 |
| 名前が引けない | Route 53 のレコード、ディストリビューションが有効か（無効だと Alias が応答しない） |
| 更新が反映されない | 無効化が完了しているか（数十秒〜数分）、ブラウザのキャッシュ |
