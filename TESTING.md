# 提出版QAの再実行

このリポジトリはWeb・HTML共通版用です。78単体テストを維持し、旧Windowsランチャーだけを対象にした3テストは移行対象から外しています。今回の成果物と実施結果はQA.md、配布ZIPと公開ファイルの識別はPUBLICATION_MANIFEST.jsonを参照してください。

実機スマートフォン、Mac/Linux、Safari、新しい公開URLは未確認です。2026-09-12にOpenRouter / DeepSeek V4 Flashの認証付き実応答を3回確認しました。他のAIプロバイダーは未検証です。HTTP試験と性能試験はローカルで実施します。端末エミュレーションを実機スマートフォンの確認として扱わないでください。

## ビルドと確認順

1. `npm ci`、`npm test`、`npm run typecheck`、`npm run build`、`npm run check:contest`を実行する。
2. `artifacts/Quiz-Pal-HTML.zip`を空の新しいフォルダーへ展開する。
3. 展開した`index.html`を以下の`QA_HTML`に指定する。
4. ブラウザーテストは単独で実行する。性能試験中は他の負荷をかけない。全問テストはブラウザー操作が多く、同時実行時に待機タイムアウトが発生したため、直列実行を推奨する。
5. テスト後に成果物を変更したら、再展開して影響する操作を再確認する。成果物ハッシュ、ブラウザー版、結果JSON・画像を記録する。

PlaywrightはQA用です。アプリの実行時依存には追加しません。既にあるPlaywright Testを`PLAYWRIGHT_TEST_MODULE`で指定するか、リポジトリとは別のQA用フォルダーにインストールしてその絶対パスを指定してください。

```powershell
$env:PLAYWRIGHT_TEST_MODULE = 'C:\qa-tools\node_modules\playwright\test'
$env:QA_CHROME = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$env:QA_HTML = 'C:\qa\fresh-extract\Quiz-Pal-HTML\index.html'
$env:QA_ROOT = Split-Path -Parent $env:QA_HTML
$env:QA_OUTPUT = 'C:\qa\results\regressions'
node scripts/check-release-regressions.cjs
```

Chromeを使うスクリプトは`QA_CHROME`で実行ファイルを変更できます。Edgeの場合は`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`を指定します。`QA_IMAGE`には`tests/fixtures/explanation-fixture.png`を指定できます。

紹介画面を閉じるだけでは次回の表示は止まりません。保存・復元などを連続検証する既存スクリプトは、最初の画面で実際に「もう表示しない」を選択しています。表示方針そのものはcheck-guide-refresh.cjsで未チェック・チェック・解除・旧版からの移行を検証します。

## スクリプトの用途

セキュリティ回帰は、`QA_HTML`に最終ZIPの新規展開先、`QA_OUTPUT`にリポジトリ外の診断用保存先を指定し、`node scripts/check-backup-security.cjs`で実行します。細工したバックアップを実際のファイル入力からロードし、さらに以前のプロファイルに残っている教材キャッシュを再現して、どちらからもコードが実行されないことを確認します。生成される試験用JSONやブラウザープロファイルは公開用フォルダーにコピーしないでください。

`check-api-key-persistence.cjs`はダミーキーを使って保存許可・取消・再起動・セーブ除外を確認します。実AI通信の試験ではありません。`check-intro-continuous.cjs`では軽量プレビューと元PNGの拡大を確認します。`check-release-tools.cjs`では初期状態の背景停止、設定での再開、狭い画面での履歴メニュー位置を確認します。

| スクリプト | 範囲・追加入力 |
| --- | --- |
| `check-supplied-diagram.cjs` | 指定図解の表示・拡大、10画面条件、再読み込み・セーブ・2環境での復元。QA_HTMLに新規展開HTML、QA_BACKUPにはsample-feの設問sample-fe-101101へ同梱guide-captures/binary-study-note.pngを実追加してセーブしたJSONを指定 |
| `check-guide-refresh.cjs` | 6画面サイズ・3ページ、実画面切替・拡大、チェックの保存／解除、旧設定からの移行。QA_HTML未指定ならローカルHTTP |
| `check-contest-download.cjs` | `QA_ROOT=docs`で3か所の実ZIP取得、画面幅、学習・編集・画像・書出し、予定リンク。`QA_URL`を指定すると起動済みローカルプレビューを検証 |
| `check-contest-roundtrip.cjs` | ダウンロード試験の`web-backup.json`を`QA_WEB_BACKUP`、同じ出力の`explanation-fixture.png`を`QA_WEB_IMAGE`へ指定。展開したHTMLを`QA_HTML`に指定し、Web→HTML→Webの復元 |
| `check-release-regressions.cjs` | 15画面幅の実クリック、検索位置、全183問、不正バックアップ、60回の連続操作、オフライン |
| `check-release-tools.cjs` | テーマ・履歴メニュー、9テーマ、アニメーション停止・再開 |
| `check-release-hosted.cjs` | `QA_ROOT`に`docs`を指定し、`/contest-preview/`配下の操作を検証 |
| `check-release-touch.cjs` | タッチ・DPR3・縦横画面の端末エミュレーション |
| `check-explanation-images.cjs` | 画像の実追加、拡大、保存・別プロファイル復元、再起動。旧版画像入りバックアップは`QA_OLD_BACKUP=tests/fixtures/previous-html-image-backup.json` |
| `check-image-events.cjs` | 合成DOM貼付け／ドロップ。`QA_IMAGE=tests/fixtures/explanation-fixture.png`を指定。OS操作の試験ではない |
| `check-portable-workflow.cjs` | 学習、進捗、編集、保存、復元、表示の20項目 |
| `check-portable-csv.cjs`、`check-portable-restart.cjs` | workflowと同じ`QA_OUTPUT`で順に実行し、CSVと同じプロファイルの再起動を検証 |
| `check-html-specific.cjs` | HTML固有の画面遷移と旧Windows保存データの移行。`QA_BACKUP=tests/fixtures/windows-qa-backup.json`を指定。この合成試験データ内の科目名・進捗を期待する |
| `check-product-intro.cjs`、`check-intro-transition.cjs` | 紹介、API設定導線、ガイドの位置・遷移 |
| `check-html-public-api.cjs` | OpenRouter公開モデル一覧の実GET。認証付き生成は実施しない |
| `measure-performance.cjs` | HTTP・gzip・コールドキャッシュ。PC無制限／390×844・CPU4倍低速・下り1.6Mbps・150ms。`QA_RUNS`は既定3 |
| `probe-network.cjs` | CDPによるリクエストと転送量の補助記録 |

各実行前に`QA_OUTPUT`を別の空フォルダーへ変えてください。workflow・CSV・restartだけは同じ出力フォルダーを使用します。各スクリプトはユーザーが普段使っているブラウザープロファイルと分離した環境で起動します。

性能結果の`shifts`は、直近入力による変動を除外してセッションウィンドウ方式のCLSへ集計します。単純合計はCLSではありません。Event Timingの少数の操作時間は実利用者のINPではありません。PCではResource Timingに背景画像のバイト数が載らない回があったため、完全な転送量と断定しないでください。

## フォントの再生成

従来のKaisei Optiの元TTFとライセンスは`public/assets/fonts`に残しています。Pythonの`fonttools[woff]==4.64.0`を別の開発用環境に用意し、次を実行します。

```powershell
python scripts/build-web-fonts.py --output C:\qa\font-build
```

通常文字の補助データは`tools/font-common-ui.txt`です。生成物の収録文字を確認してから、WOFF2を`public/assets/fonts`、CSSを`public/fonts.css`へ反映してください。このスクリプトは直接アプリを書き換えません。追加文字のフォントも含め、元の7,930文字を各ウェイトで保持します。

本文用のM PLUS Rounded 1cは別系統です。[取得元とTTFのハッシュ](tools/rounded-font-sources.json)を確認してMedium/Boldを開発用フォルダーへ用意し、`python scripts/build-rounded-fonts.py --source C:\qa\rounded-source --output C:\qa\rounded-build`を実行します。生成時に元の8,201文字と横幅の保持を照合します。生成先の4個のWOFF2とfonts.cssを現行版と比較してから反映してください。派生名はQuiz Pal Rounded、OFLはpublic/assets/fonts/OFL-Rounded.txtです。通常のアプリ利用やビルドではフォント再生成は不要です。

## 認証付きAIの再検証

外部APIへの実送信は利用者が許可したキーで行い、対象モデルをdeepseek/deepseek-v4-flashと指定します。UIからキーを保存し、初回解説→追加質問2回を操作します。応答モデル・200応答・会話の文脈・保存画像の表示を確認します。スクリーンショットは設定を閉じ、キー入力欄が空であることを確認してから撮影してください。キーは試験後に削除し、ログ・バックアップ・配布物へ含めないでください。記録済みの認証情報は同梱していません。

## 紹介画面の連続スクロール
PLAYWRIGHT_TEST_MODULE、QA_HTML（新規展開した index.html）、QA_OUTPUT を指定して `node scripts/check-intro-continuous.cjs` を実行。QA_HTML の代わりに QA_URL でローカルWebも検証可能。

理解度メニュー・AI横並びのv1.0.0回帰は、`QA_HTML`（新規展開HTML）、`QA_OUTPUT`（結果保存先）、`PLAYWRIGHT_TEST_MODULE`を指定し、`node scripts/check-question-controls.cjs`で実行します。`QA_URL`指定で公開先も同じ操作を確認できます。

`check-responsive-guide.cjs`は`QA_HTML`（新規展開HTML）または`QA_URL`を指定し、12画面サイズで回答・前後移動・紹介・操作ガイド9段階・教材管理ガイド6段階・科目保存と問題編集への移動を実操作します。`QA_OUTPUT`に結果とスクリーンショットを保存します。端末実機ではなくChromeの画面幅・タッチエミュレーションです。
