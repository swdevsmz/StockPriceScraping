# 国税庁財産評価基準書更新通知システム

このプロジェクトは、国税庁の財産評価基準書の更新を自動的に監視し、変更があった場合にLINE通知を送信するシステムです。

## 機能

* 国税庁の財産評価基準書ページを定期的に取得
* 前回取得した情報と比較し、更新があった場合にLINE通知を送信
* 取得した情報をテキストファイルに保存
* GitHub Actions による自動実行（毎日19:30）

## 必要条件

* Node.js (v20以上)
* npm
* LINE Messaging API のアクセストークン

## セットアップ

1. リポジトリをクローンします：
```bash
git clone <repository-url>
cd stock-price-scraping
```

2. 必要なパッケージをインストールします：
```bash
npm install
```

3. 環境変数を設定します：
   * `.env`ファイルをプロジェクトのルートディレクトリに作成
   * 以下の内容を追加：
   ```
   LINE_ACCESS_TOKEN=your_line_access_token
   ```
   * `your_line_access_token`を実際のLINE Messaging APIのアクセストークンに置き換えてください

## GitHub Actionsの設定

1. GitHubのリポジトリのSettings > Secrets and variables > Actionsで以下のシークレットを設定：
   * `LINE_ACCESS_TOKEN`: LINE Messaging APIのアクセストークン

2. GitHub Actionsのワークフローは既に設定されているため、追加の設定は不要です。
   * 毎日19:30（JST）に自動実行されます
   * 更新があった場合、LINE通知が送信されます
   * 更新された内容は自動的にコミットされます

## ローカルでの実行

```bash
npm run dev
```

## ファイル構造

```
stock-price-scraping/
├── src/
│   └── index.ts      # メインのスクレイピングスクリプト
├── data/
│   └── last_content.txt  # 取得した情報の保存ファイル
├── .github/
│   └── workflows/
│       └── schedule.yml  # GitHub Actionsの設定
├── .env                # 環境変数設定ファイル（手動作成）
├── package.json        # プロジェクト設定
└── tsconfig.json       # TypeScript設定
```

## LINE通知

更新があった場合、以下のような形式でLINE通知が送信されます：

```
国税庁の財産評価基準書に更新がありました

前回の内容：
[前回の内容]

現在の内容：
[現在の内容]

詳細はこちら：
https://www.nta.go.jp/law/tsutatsu/kobetsu/hyoka/zaisan.htm
```

## 注意事項

* LINE Messaging APIのアクセストークンは厳重に管理してください
* スクレイピングの実行頻度は適切な間隔を保ってください
* サイトの構造が変更された場合、スクリプトの修正が必要になる可能性があります 