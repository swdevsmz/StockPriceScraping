# 国税庁財産評価基準書更新通知システム

このプロジェクトは、国税庁の財産評価基準書の更新を自動的に監視し、  
変更があった場合にLINE通知を送信するシステムです。

## 機能

* 国税庁の財産評価基準書ページを定期的に取得
* 前回取得した情報と比較し、更新があった場合にメール送信
* 取得した情報をテキストファイルに保存
* GitHub Actions による自動実行

## 必要条件

* Node.js (v20以上)
* npm

## セットアップ

1. 必要なパッケージをインストールします：

```bash
npm install
```

1. 環境変数を設定します：
   * `.env.example`ファイルをコピーして`.env`ファイルを作成
   * `.env`に各種メール設定を記載

## GitHub Actionsの設定

1. GitHubのリポジトリのSettings > Secrets and variables > Actionsで以下のシークレットを設定：
   * `EMAIL_USERNAME`
   * `EMAIL_PASSWORD`
   * `EMAIL_FROM`
   * `EMAIL_TO`

2. GitHub Actionsのワークフローは既に設定されているため、追加の設定は不要です。
   * 更新があった場合、メール送信されます
   * 更新された内容は自動的にコミットされます

## ローカルでの実行

```bash
npm run dev
```

## ファイル構造

```
stock-price-scraping/
├── .vscode/
│   └── launch.json       # vscode用の起動設定
│   └── tasks.json        # vscode用のタスク設定
├── src/
│   └── main.ts           # メインのスクレイピングスクリプト
│   └── email-notifier.ts # メール送信のスクレイピングスクリプト
├── data/
│   └── last_content.txt  # 取得した情報の保存ファイル
├── .github/
│   └── workflows/
│       └── schedule.yml  # GitHub Actionsの設定
├── .env                  # 環境変数設定ファイル（手動作成）
├── package.json          # プロジェクト設定
└── tsconfig.json         # TypeScript設定
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

* スクレイピングの実行頻度は適切な間隔を保ってください
* サイトの構造が変更された場合、スクリプトの修正が必要になる可能性があります 