# Golf App

自分専用のゴルフ記録アプリ。クラブごとのショット(飛距離・方向)を記録し、統計ベースの気づき(ばらつき・方向の癖・クラブ間のギャッピング)を表示する。

## スタック

- フロントエンド: React + Vite + TypeScript
- バックエンド: AWS Amplify Gen2(Cognito認証 + AppSync/DynamoDB)
- ホスティング: Amplify Hosting

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

## 将来の拡張(未実装)

Toptracer等のランチモニターとの連携は、個人向け公開APIが存在しないため見送っている。`ShotRecord.source`/`externalId` フィールドは将来のCSVインポート等の拡張に備えて用意してある。
