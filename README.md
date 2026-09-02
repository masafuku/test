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
npm test                   # 統計・音声テキスト解析ロジックのユニットテスト(Vitest、client workspace)
npm test --workspace server # 音声テキスト解析ロジックのサーバー側コピーのテスト(下記Siriショートカット連携用)
npm run build
```

## 主な機能

- クラブ管理(標準14本セットの一括登録、有効/無効の切り替え)
- ショット入力(クラブ・ライ・強度をタップ選択 + 飛距離・方向の手入力、または音声/テキスト一括入力)
  - 音声入力はiPhone標準の音声文字入力(キーボードのマイクボタン)を使う想定。アプリ側で音声認識は行わず、入力されたテキストをルールベースでパースしてクラブ・ライ・強度・距離・方向・左右のズレを抽出する
- ダッシュボード(クラブ別の平均飛距離・ばらつき・方向の癖、クラブ間のギャッピング検出。表のクラブ名をタップするとそのクラブだけの散布図に絞り込める)
- セッション管理(「ショット入力」タブ上部の開始/終了ボタンで、練習場/コース単位にショットをまとめる。現在開いているセッションはサーバー側で一意に管理され、Webフォーム・Siriショートカットどちらからのショットも自動的にそこへ紐付く。ダッシュボードでセッションごとの絞り込みも可能)
- 設定タブ(クラブ管理を格納。標準14本セットの一括登録、有効/無効の切り替え)
- Siriショートカット連携(下記「音声だけで記録する(Siriショートカット)」参照) — Webアプリを開かず、Apple WatchやiPhoneのアクションボタン等から音声だけでショットを記録できる

## 音声だけで記録する(Siriショートカット)

Webアプリを開かず、iPhoneの「ショートカット」アプリ(標準搭載・無料、Apple Developer Programのライセンス不要)経由で、音声だけでショットを記録できる。作ったショートカットはApple Watchにも自動で同期されるので、Watch単体でも使える。

### 使うAPI

`POST /golf/api/shots/from-text`(Basic認証は他のAPIと同じくnginx層で保護される)

```json
// リクエスト
{ "text": "7番アイアン、ラフからハーフで150ヤード、ちょっと右5ヤード" }

// レスポンス(成功時 201)
{ "id": "...", "clubName": "7 Iron", "carryDistanceYds": 150, "direction": "PUSH", "strength": "HALF", "lie": "ROUGH", "lateralDeviationYds": 5, "summary": "7 Iron、150ヤード、PUSHを記録しました" }

// レスポンス(クラブ・距離を認識できなかった場合 422)
{ "error": "クラブを認識できませんでした。もう一度お試しください。" }
```

クラブ名は`ClubsPage`で実際に登録した名前(および「7番アイアン」「52度」「ドライバー」などの一般的な言い回し)から一致するものを解析する。距離が読み取れなかった場合、およびクラブが一致しなかった場合はショットを作成せず`422`を返す(タップで選び直すUIが無い経路のため、この2つだけは必須)。強度・ライ・方向・左右のズレは認識できなくても保存される。

### ショートカットの作り方(iPhoneの「ショートカット」アプリで)

1. 新規ショートカットを作成し、アクションを2つ(任意で3つ)追加する:
   1. **「テキストを口述」**(Dictate Text) — ショートカット実行と同時に聞き取りが始まる(タップ起動なら「Hey Siri」は不要)
   2. **「URLの内容を取得」**(Get Contents of URL)
      - URL: `http://<インスタンスのIP>/golf/api/shots/from-text`
      - メソッド: `POST`
      - ヘッダー: `Authorization: Basic <base64エンコードした "golf:パスワード">`(`Content-Type: application/json`も追加)
      - 本文(JSON): `{"text": <直前の「テキストを口述」の結果>}`
   3. (オプション)**「もし」**(If)で前アクションの成功/失敗を判定し、**「テキストを読み上げる」**(Speak Text)でレスポンスの`summary`(成功時)または`error`(失敗時)を読み上げる。不要なら省略してよい。
2. 起動方法(いずれも「Hey Siri」不要、タップで起動):
   - Apple Watchの文字盤にコンプリケーションとして追加
   - iPhoneのホーム画面にアイコンとして追加(ショートカット詳細 → 共有 → 「ホーム画面に追加」)
   - iPhone 15 Pro以降ならアクションボタンに割り当て
   - 設定 → アクセシビリティ → タッチ → 背面タップ、に割り当てることも可能
   - アプリの「ショット入力」ページ上部にも起動ボタンがある(`shortcuts://run-shortcut?name=...`へのリンク、iPhone Safari限定)。ボタンの起動先は[ShotEntryPage.tsx](client/src/pages/ShotEntryPage.tsx)の`SHORTCUT_NAME`定数で指定しており、**ここに書いた名前とショートカットの実際の名前が完全一致している必要がある**(1文字でも違うと何も起きない)。ショートカットの名前を変えたらこの定数も合わせて更新すること

平文HTTP経由でBasic認証情報が流れる点は他のAPI呼び出しと同じ制約。将来ドメインを取得したらHTTPS化を推奨する(下記「制約」参照)。

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
