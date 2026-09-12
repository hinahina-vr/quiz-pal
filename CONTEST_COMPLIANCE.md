# Webページ部門の規定と確認状況

2026年9月12日、[公式レギュレーション](https://progedu.github.io/webappcontest/2026/summer/index.html)を再確認し、提出版v1.0.0と照合しました。コード・構成・同梱素材について、確認した範囲ではWebページ部門の規定に違反する事項は確認されていません。Publicリポジトリ・GitHub Pagesの公開を確認しました。[公開記録](PUBLICATION.md)

| 条件 | 状態 |
| --- | --- |
| HTML / CSS / JavaScriptの動く作品 | ブラウザーで実行するファイルはHTML・CSS・JavaScriptと素材。基本操作をローカルで検証 |
| 外部ライブラリの制限 | npm実行時依存0件。外部スクリプト・CSS・フォントのCDN読込なし。互換名は自作実装 |
| PublicのGitHubリポジトリURL | [hinahina-vr/quiz-pal](https://github.com/hinahina-vr/quiz-pal)をPublicで作成・プッシュ済み |
| 公開URLと提出コードが同じ動作 | GitHub Pagesの109ファイルとZIPをハッシュ照合し一致。公開Web→HTML→公開Webの保存・復元も確認 |
| PC版Chrome | 公開URLで実Chromeによる紹介・学習・編集・画像追加・ダウンロード・セーブ／ロードを確認 |
| スマートフォン版Chrome | 画面幅変更とタッチエミュレーションで確認。実機は未確認 |
| 著作権・素材の条件 | MIT、CC0対象の例題、IPA問題、OFLフォントを区別し、出典とライセンスを同梱 |
| オリジナリティ・制作の説明 | 参考元と制作支援を明記。制作期間・本人の担当と発展させた部分は本人が補足 |
| 応募資格・所属枠 | 本人が公式ページの該当フォームを選択 |
| 作品の公開・共有の維持 | 応募者の同意と、授業での表彰・紹介が終わるまでの公開継続を提出前に確認 |

コード・ライブラリ条件は現行コードの監査上、準拠と判断しています。応募条件全体の完了や、主催者による受理・審査結果を示すものではありません。

公式ページには応募締切が2026年9月13日と記載されています。外部ライブラリはBootstrap・TailWind CSSを除き制限されますが、本作品はこれらも実行時に使用していません。開発用の依存パッケージと、提出HTMLで動作する実装を分けて確認しています。AI制作支援は制作説明へ記載し、独自性の最終評価を自己認定していません。

同梱図解は作者が提供・選定した画像として扱っています。第三者の権利を含まないことの最終確認、応募資格、公開・共有の継続への同意は応募者が確認してください。実機未確認のまま「すべての応募条件を満たした」とはしていません。

## 実装と開発ツール

2026年9月12日の再照合では、`check:contest`でソース147ファイル・公開用111ファイル・HTML版109ファイルの一致、実行時依存0件、限定的な秘密情報パターン検査の合格を確認しました。外部ライブラリ境界のテストは`tests/contest-dependencies.test.ts`、具体的なブラウザー試験結果は[QA.md](QA.md)に記録しています。チェックの合格を、応募資格・実機確認まで完了したという意味には用いていません。

UIは`src/native-ui/`、CSV・保存・検証はリポジトリ内の実装、画面演出はCanvas 2Dです。`native-runtime.js`にあるlucide・marked・DOMPurify・katexという名前は互換名で、外部ライブラリ本体を読み込んでいません。

TypeScript・Viteはビルド用、Vitest・jsdom・Testing Library・fake-indexeddbはテスト用です。今回はWeb・HTML共通版に絞り、Windows起動用ソース・ビルドとCloudflare配備用ツールを新リポジトリ用の一式から外しました。元プロジェクトは別途保持しています。

フォントはKaisei OptiとM PLUS Rounded 1cをOFLで同梱しています。読みやすい本文・ガイドにはM PLUS Rounded 1cを分割したQuiz Pal Roundedを使用します。オリジナル例題のCC0を、IPA公式問題やフォントへ一括適用していません。[第三者素材の表示](THIRD_PARTY_NOTICES.md)

## 公開手順と確認記録

公開先は[GitHub Pagesの公開URL](https://hinahina-vr.github.io/quiz-pal/)です。`main /docs`を公開元にする構成で、`.nojekyll`を同梱しています。`PUBLICATION_MANIFEST.json`と`npm run check:contest`で、ソース変更の有無・公開ファイル・配布ZIPの一致を確認できます。

`_headers`は元プロジェクトのホスティング用ポリシー雛形です。GitHub Pages上でHTTPヘッダーとして適用されたとはしていません。公開中の配信ファイルとブラウザー動作は確認済みです。結果は[公開記録](PUBLICATION.md)にまとめています。

詳細は[QA.md](QA.md)と[PUBLISHING.md](PUBLISHING.md)を参照してください。公開規定本文では、Webページ部門の紹介動画やリポジトリ直下サムネイルを必須とは確認していません。画像は紹介用として用意し、フォーム独自の指定があれば従います。

