# Golf App

自分専用のゴルフ記録アプリ。クラブごとのショット(飛距離・方向)を記録し、統計ベースの気づき(ばらつき・方向の癖・クラブ間のギャッピング)を表示する。

## スタック

- フロントエンド: React + Vite + TypeScript(`client/`)
- バックエンド: Node.js + Express + SQLite(Drizzle ORM + libSQL)(`server/`)
- ホスティング: AWS Lightsail(Ubuntu + nginx + pm2)に相乗り。認証はnginx Basic認証

npm workspaces構成(`client/` + `server/`)。認証・データストアはすべて自前のLightsailインスタンス内で完結し、外部のAWS API(IAMキー等)は一切不要。

## セットアップ

```bash
npm install
npm run db:push      # SQLiteスキーマを作成(server/data.db)
```

2つのターミナルで:

```bash
npm run dev:server   # http://localhost:4002
npm run dev:client   # http://localhost:5173 (/api は dev:server にプロキシ)
```

ブラウザで http://localhost:5173 を開く。

## テスト

```bash
npm test    # 統計・音声テキスト解析ロジックのユニットテスト(Vitest、client workspace)
npm run build
```

## 主な機能

- クラブ管理(標準14本セットの一括登録、有効/無効の切り替え)
- ショット入力(クラブ選択 + 飛距離・方向の手入力、または音声/テキスト一括入力)
  - 音声入力はiPhone標準の音声文字入力(キーボードのマイクボタン)を使う想定。アプリ側で音声認識は行わず、入力されたテキストをルールベースでパースして距離・方向を抽出する
- ダッシュボード(クラブ別の平均飛距離・ばらつき・方向の癖、クラブ間のギャッピング検出)

## デプロイ(Lightsail)

同じLightsailインスタンスに既存の`toeic-master`アプリ(ポート4001, pm2管理)が相乗りしている。golf-appは**ポート4002**、pm2プロセス名`golf-app`、nginxの`/golf/`パス配下で同様に相乗りする。

### Lightsailインスタンスの初回セットアップ

自分の端末からSSHで接続して実施する:

```bash
ssh -i ~/.ssh/LightsailDefaultKey-ap-northeast-1.pem ubuntu@<インスタンスのIP>
```

nginx・pm2・Node.jsは既に導入済み(toeic-master用)。golf-appのリポジトリを配置:

```bash
mkdir -p ~/apps && cd ~/apps
git clone https://github.com/masafuku/test.git golf-app
cd golf-app
npm install
npm run db:push
```

Basic認証ユーザーを追加(既存`/realestate/`と同じhtpasswdファイルに追記):

```bash
sudo htpasswd /etc/nginx/.htpasswd golf
```

nginxの`default`サイト(`/etc/nginx/sites-available/default`)に`/golf/`ロケーションを追記する。書式は`deploy/nginx.conf.example`を参照(`/toeic/`ブロックと同じreverse proxyパターン + Basic認証)。

```bash
sudo nginx -t && sudo systemctl reload nginx
```

初回起動:

```bash
VITE_BASE_PATH=/golf/ npm run build
pm2 start server/dist/index.js --name golf-app
pm2 save
```

### デプロイ手順(更新のたびに、Lightsailインスタンス上で)

```bash
cd ~/apps/golf-app
./deploy/deploy.sh
```

内部で`git pull` → `npm install` → `VITE_BASE_PATH=/golf/`でのビルド → `npm run db:push`(既存データは壊さない) → `pm2 restart golf-app`を行う。

### 制約

- ドメインが無いため現状は平文HTTP配信。将来ドメインを用意できたらLet's EncryptでHTTPS化することを推奨する
- 認証はnginx Basic認証のみ(ゴルフスコアという機密性の低いデータのため、この程度の保護で許容)
- SQLiteデータ(`server/data.db`)はLightsailインスタンス内のみに存在し、バックアップは別途検討すること
- CI連携はまだ無く、手動デプロイのみ

## 将来の拡張(未実装)

Toptracer等のランチモニターとの連携は、個人向け公開APIが存在しないため見送っている。`ShotRecord.externalId`フィールドは将来のCSVインポート等の拡張に備えて用意してある。
