# Golf App

自分専用のゴルフ記録アプリ。クラブごとのショット(飛距離・方向)を記録し、統計ベースの気づき(ばらつき・方向の癖・クラブ間のギャッピング)を表示する。

## スタック

- フロントエンド: React + Vite + TypeScript
- バックエンド: AWS Amplify Gen2(Cognito認証 + AppSync/DynamoDB)
- ホスティング: AWS Lightsail(Ubuntu + nginx)に静的ビルドを配信

## セットアップ

```bash
npm install
npx ampx sandbox   # AWS認証情報が必要。Cognito/AppSync/DynamoDBを個人サンドボックスに構築し amplify_outputs.json を生成する
npm run dev
```

`amplify_outputs.json` は `ampx sandbox`(または本番デプロイ)が生成する環境固有の設定ファイルで、Gitには含めない。リポジトリにはビルドを通すためのプレースホルダーのみ置いている。

## テスト

```bash
npm test    # 統計・音声テキスト解析ロジックのユニットテスト(Vitest)
npm run build
```

## 主な機能

- クラブ管理(標準14本セットの一括登録、有効/無効の切り替え)
- ショット入力(クラブ選択 + 飛距離・方向の手入力、または音声/テキスト一括入力)
  - 音声入力はiPhone標準の音声文字入力(キーボードのマイクボタン)を使う想定。アプリ側で音声認識は行わず、入力されたテキストをルールベースでパースして距離・方向を抽出する
- ダッシュボード(クラブ別の平均飛距離・ばらつき・方向の癖、クラブ間のギャッピング検出)

## デプロイ(Lightsail)

フロントの静的配信のみLightsailで行う。認証・データ(Cognito/AppSync/DynamoDB)はAmplify側のまま。

### Lightsailインスタンスの初回セットアップ

自分の端末からSSHで接続して実施する(このリポジトリの作業環境からは、鍵もサーバーへの経路も無いため実行できない):

```bash
ssh -i ~/.ssh/LightsailDefaultKey-ap-northeast-1.pem ubuntu@<インスタンスのIP>
sudo apt update && sudo apt install -y nginx
```

Lightsailコンソールのネットワーキングタブで、インスタンスのファイアウォールにHTTP(80番)を開放しておく。

```bash
sudo mkdir -p /var/www/golf-app && sudo chown ubuntu:ubuntu /var/www/golf-app
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/golf-app
sudo ln -s /etc/nginx/sites-available/golf-app /etc/nginx/sites-enabled/golf-app
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

(`deploy/nginx.conf.example` を先にこのリポジトリからサーバーにコピーしておくか、`scp` で転送してから上記を実行する)

### デプロイ手順(更新のたびに、ローカル端末で)

1. 本番用の `amplify_outputs.json` を用意する(sandbox用ではなく本番Amplifyバックエンドのもの): `npx ampx generate outputs --branch <本番ブランチ> --app-id <Amplify App ID>`
2. `deploy/deploy.sh` を実行(内部で `npm run build` → `rsync` を行う)

```bash
LIGHTSAIL_HOST=ubuntu@<インスタンスのIP> ./deploy/deploy.sh
```

`LIGHTSAIL_SSH_KEY`(デフォルト `~/.ssh/LightsailDefaultKey-ap-northeast-1.pem`)や `LIGHTSAIL_REMOTE_DIR` も環境変数で上書き可能。

### 制約

- ドメインが無いため現状は平文HTTP配信。Cognito/AppSyncへの通信自体はブラウザから直接AWSのHTTPSエンドポイントに送られるが、将来ドメインを用意できたらLet's EncryptでHTTPS化することを推奨する
- CI連携はまだ無く、手動デプロイのみ

## 将来の拡張(未実装)

Toptracer等のランチモニターとの連携は、個人向け公開APIが存在しないため見送っている。`ShotRecord.source`/`externalId` フィールドは将来のCSVインポート等の拡張に備えて用意してある。
