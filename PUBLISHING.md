# 公開・凍結後の取り扱い

2026年9月12日に[Publicリポジトリ](https://github.com/hinahina-vr/quiz-pal)と[GitHub Pages](https://hinahina-vr.github.io/quiz-pal/)を公開しました。公開元はmainの/docsです。[公開確認記録](PUBLICATION.md)と[凍結方針](FREEZE.md)を参照してください。

以後は致命的な不具合の修正だけを扱います。修正が必要な場合は再現条件を記録し、変更用ブランチで最小限の修正を行い、npm ci・単体テスト・型検査・ビルド・配布物照合と実操作を確認します。最終ZIPを新規展開し、保存・復元・公開先のダウンロードまで再確認します。現在の審査タグを移動せず、別バージョン・別タグで記録してください。

`PUBLICATION_MANIFEST.json`の`local-preparation-only`は、ビルドスクリプト自身がアップロードしないことを示す生成時の属性です。公開の実状態はPUBLICATION.mdで記録しています。`npm run check:contest`で提出ソース・docs・ZIPの一致を照合できます。`_headers`はGitHub PagesのHTTP設定として適用されません。

実機スマートフォンChromeでの確認、応募資格・本人情報の確認、応募フォームの送信は作者が行います。審査・紹介が終わるまで公開状態を維持してください。
