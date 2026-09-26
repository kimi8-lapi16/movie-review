# movie-review

自分用の映画レビュー投稿アプリ。

- **backend**: Go (`net/http` + pgx) — `backend/`
- **frontend**: React + TypeScript + Vite + antd — `frontend/`
- **DB**: PostgreSQL（テーブルはサーバ起動時に自動マイグレーション）

本番では Go のサーバが API (`/api/*`) とビルド済みフロントエンドの両方を配信するので、デプロイ先は Docker コンテナ 1 つだけです。

## 機能

- レビューの一覧・検索（タイトル／本文）・詳細表示 — 誰でも閲覧可
- レビューの投稿・編集・削除 — `ADMIN_PASSWORD` でログインした人のみ
- 1 レビュー = タイトル / 鑑賞日 / 評価（0.5〜5、0.5 刻み）/ 感想

## ローカル開発

```sh
# 1. DB
docker compose up -d

# 2. backend (http://localhost:8080)
cd backend
DATABASE_URL=postgres://postgres:postgres@localhost:5432/moviereview?sslmode=disable \
ADMIN_PASSWORD=dev \
go run .

# 3. frontend (http://localhost:5173, /api は 8080 にプロキシ)
cd frontend
npm install
npm run dev
```

## 環境変数

| 変数 | 必須 | 説明 |
| --- | --- | --- |
| `DATABASE_URL` | ✔ | PostgreSQL の接続文字列 |
| `ADMIN_PASSWORD` | ✔ | 投稿・編集用ログインパスワード |
| `SESSION_SECRET` | | ログイントークンの署名鍵。未指定ならパスワードから導出 |
| `PORT` | | 待ち受けポート（デフォルト `8080`） |
| `STATIC_DIR` | | フロントエンドのビルド成果物の場所（デフォルト `../frontend/dist`） |

## デプロイ（無料構成: Render + Neon）

アプリは [Render](https://render.com) の Free Web Service、DB は [Neon](https://neon.tech) の Free プランを使います（どちらもクレジットカード不要）。

1. **Neon** でプロジェクトを作成し、接続文字列（`postgresql://...?sslmode=require`）をコピー
2. **Render** で *New → Blueprint* を選び、このリポジトリを接続（`render.yaml` が読み込まれる）
3. `DATABASE_URL` に Neon の接続文字列、`ADMIN_PASSWORD` に好きなパスワードを入力してデプロイ

`main` に push すると自動で再デプロイされます。

注意点:
- Render の Free プランは 15 分アクセスがないとスリープし、次のアクセス時の起動に 1 分弱かかります
- Render の無料 PostgreSQL は 30 日で失効するため、DB は Neon を使っています（Neon Free は 0.5GB まで。レビュー用途なら十分）
