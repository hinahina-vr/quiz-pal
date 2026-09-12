import type { Question, Section } from "../domain/types";

const createdAt = "2026-08-12T00:00:00.000Z";
const option = (id: string, text: string) => ({ id, text });
const choices = (values: [string, string, string, string]) => [
  option("a", values[0]),
  option("b", values[1]),
  option("c", values[2]),
  option("d", values[3]),
];

const source = (year: number, exam: string, number: number, note = "（アプリ表示用に一部改変）") =>
  `©${year} IPA / 出典：${exam} 問${number}${note}`;

type OfficialQuestion = Pick<
  Question,
  "id" | "sectionId" | "promptMarkdown" | "options" | "correctOptionIds" | "explanationMarkdown" | "tags" | "order" | "license"
>;

const official = (question: OfficialQuestion): Question => ({
  ...question,
  type: "single_choice",
  acceptedAnswers: [],
  timeLimitSeconds: 90,
  contentRevision: 5,
  origin: "ipa-official-past-question",
  createdAt,
  updatedAt: createdAt,
});

export const ipaOfficialSections: Section[] = [
  { id: "ipa-ip-syllabus-strategy", subjectId: "sample-it-passport", name: "ストラテジ系（シラバスVer.6.5）", description: "企業と法務、経営戦略、システム戦略。IPA公式公開問題を収録。", order: 10, createdAt, updatedAt: createdAt },
  { id: "ipa-ip-syllabus-management", subjectId: "sample-it-passport", name: "マネジメント系（シラバスVer.6.5）", description: "開発技術、プロジェクトマネジメント、サービスマネジメント。IPA公式公開問題を収録。", order: 11, createdAt, updatedAt: createdAt },
  { id: "ipa-ip-syllabus-technology", subjectId: "sample-it-passport", name: "テクノロジ系（シラバスVer.6.5）", description: "基礎理論、コンピュータシステム、技術要素。IPA公式公開問題を収録。", order: 12, createdAt, updatedAt: createdAt },
  { id: "ipa-fe-syllabus-strategy", subjectId: "sample-fe", name: "ストラテジ系（シラバスVer.9.2）", description: "システム戦略、経営戦略、企業と法務。IPA公式公開問題を収録。", order: 10, createdAt, updatedAt: createdAt },
  { id: "ipa-fe-syllabus-management", subjectId: "sample-fe", name: "マネジメント系（シラバスVer.9.2）", description: "プロジェクトマネジメント、サービスマネジメント。IPA公式公開問題を収録。", order: 11, createdAt, updatedAt: createdAt },
  { id: "ipa-fe-syllabus-technology", subjectId: "sample-fe", name: "テクノロジ系（シラバスVer.9.2）", description: "基礎理論、コンピュータシステム、技術要素、開発技術。IPA公式公開問題を収録。", order: 12, createdAt, updatedAt: createdAt },
  { id: "ipa-ap-syllabus-strategy", subjectId: "sample-ap", name: "ストラテジ系（シラバスVer.7.2）", description: "システム戦略、経営戦略、企業と法務。IPA公式公開問題を収録。", order: 10, createdAt, updatedAt: createdAt },
  { id: "ipa-ap-syllabus-management", subjectId: "sample-ap", name: "マネジメント系（シラバスVer.7.2）", description: "プロジェクトマネジメント、サービスマネジメント。IPA公式公開問題を収録。", order: 11, createdAt, updatedAt: createdAt },
  { id: "ipa-ap-syllabus-technology", subjectId: "sample-ap", name: "テクノロジ系（シラバスVer.7.2）", description: "基礎理論、コンピュータシステム、技術要素、開発技術。IPA公式公開問題を収録。", order: 12, createdAt, updatedAt: createdAt },
];

export const ipaOfficialQuestions: Question[] = [
  official({
    id: "ipa-ip-2026-q1", sectionId: "ipa-ip-syllabus-strategy", order: 0,
    promptMarkdown: "生成AIを用いた生成物の取扱いに関して，既存の著作物の著作権者から許諾を得ることが必要となる可能性のあるものだけを，全て挙げたものはどれか。\n\n- a：好みのアーティストの楽曲に似た音楽が得られるように生成AIを用いて楽曲を生成し，その楽曲をインターネット上にアップロードし，無料で公開した。\n- b：好みのアーティストの楽曲に似た音楽が得られるように生成AIを用いて楽曲を生成し，その楽曲を自分のPC上に保管し，個人で視聴した。\n- c：生成AIで音楽を生成したところ，偶然好みのアーティストの楽曲に似た音楽が生成できたので，自分のPC上に保管し，個人で視聴した。",
    options: choices(["a", "a，b", "a，b，c", "b，c"]), correctOptionIds: ["a"],
    explanationMarkdown: "公開を伴うaは，既存著作物との類似性・依拠性によって著作権者の許諾が必要となる可能性があります。bとcは設問の条件では個人的な視聴です。",
    tags: ["ITパスポート", "ストラテジ", "知的財産権"], license: source(2026, "令和8年度 ITパスポート試験 公開問題", 1),
  }),
  official({
    id: "ipa-ip-2026-q2", sectionId: "ipa-ip-syllabus-strategy", order: 1,
    promptMarkdown: "BYODに関する記述として，適切なものはどれか。",
    options: choices(["従業員が私物のスマートフォンなどの端末を会社の許可を得た上で持ち込み，業務で使用する。", "ソフトウェアで自動化することによって，定型的な業務を作業者に代わって処理する。", "業務プロセスを継続的に分析して改善する。", "業務プロセスを根本的に考え直し，抜本的にデザインし直す。"]), correctOptionIds: ["a"],
    explanationMarkdown: "BYODはBring Your Own Deviceの略で，個人所有の端末を許可の下で業務に利用する形態です。",
    tags: ["ITパスポート", "ストラテジ", "BYOD"], license: source(2026, "令和8年度 ITパスポート試験 公開問題", 2),
  }),
  official({
    id: "ipa-ip-2026-q3", sectionId: "ipa-ip-syllabus-strategy", order: 2,
    promptMarkdown: "A社がマクシミン戦略を採り，かつ，市況が好転した場合の利益はどれか。戦略aの利益は，市況好転時20億円・市況悪化時－15億円，戦略bの利益は，市況好転時5億円・市況悪化時0億円とする。",
    options: choices(["－15億円", "0億円", "5億円", "20億円"]), correctOptionIds: ["c"],
    explanationMarkdown: "各戦略の最小利益はaが－15億円，bが0億円なので，マクシミン戦略ではbを選びます。市況が好転したときのbの利益は5億円です。",
    tags: ["ITパスポート", "ストラテジ", "意思決定"], license: source(2026, "令和8年度 ITパスポート試験 公開問題", 3, "（アプリ表示用に改変：表をテキスト化）"),
  }),
  official({
    id: "ipa-ip-2026-q4", sectionId: "ipa-ip-syllabus-strategy", order: 3,
    promptMarkdown: "ハッカソンに関する記述として，適切なものはどれか。",
    options: choices(["企業や組織が，製品やサービスを展示して説明することによって，その効用や価値を広く消費者にアピールするイベント", "ソフトウェア開発者や企画者などが，短期間に集中してアイデアを出したり，ソフトウェアなどの成果物を開発したりする共同作業のイベント", "テーマに沿って司会者がパネリストに対し質問し，その回答を基に討論を進めるイベント", "幅広い分野の専門家を招き，講演や討論を行うイベント"]), correctOptionIds: ["b"],
    explanationMarkdown: "ハッカソンは参加者が短期間に集中的な共同作業を行い，アイデアやソフトウェアなどを形にするイベントです。",
    tags: ["ITパスポート", "ストラテジ", "ハッカソン"], license: source(2026, "令和8年度 ITパスポート試験 公開問題", 4),
  }),

  official({
    id: "ipa-ip-2026-q39", sectionId: "ipa-ip-syllabus-management", order: 0,
    promptMarkdown: "WBSに関する記述として，適切なものはどれか。",
    options: choices(["プロジェクトで行う作業のうち，最も長い時間を要する作業の経路を示す。", "プロジェクトの主要な成果物の開始日と終了日を予定表に示す。", "プロジェクトで成果物を作成するために必要な作業を階層的に分解する。", "プロジェクトで使用するツールを体系的に整理する。"]), correctOptionIds: ["c"],
    explanationMarkdown: "WBSは，プロジェクトの成果物と必要な作業を管理可能な単位へ階層的に分解したものです。",
    tags: ["ITパスポート", "マネジメント", "WBS"], license: source(2026, "令和8年度 ITパスポート試験 公開問題", 39),
  }),
  official({
    id: "ipa-ip-2026-q40", sectionId: "ipa-ip-syllabus-management", order: 1,
    promptMarkdown: "内部統制における統制活動の例として，適切なものはどれか。",
    options: choices(["財務諸表に重要な誤りがあった場合，速やかに社外へ公表する。", "伝票の起票者が自ら内容を点検し，最終承認まで行う。", "リスクを評価し，全てのリスクに対して回避策を採用する。", "社内の全ての報告を直属の上司だけを経由して行う。"]), correctOptionIds: ["a"],
    explanationMarkdown: "適正な財務報告を確保するため，重要な誤りを把握して是正・公表する活動は内部統制の統制活動に該当します。",
    tags: ["ITパスポート", "マネジメント", "内部統制"], license: source(2026, "令和8年度 ITパスポート試験 公開問題", 40),
  }),
  official({
    id: "ipa-ip-2026-q41", sectionId: "ipa-ip-syllabus-management", order: 2,
    promptMarkdown: "ITガバナンスにおいて，取締役会がリーダーシップを発揮して実施すべき活動として，適切なものはどれか。",
    options: choices(["IT部門の個々の担当者の日常業務を直接指揮する。", "個別システムのプログラム仕様を決定する。", "ITの利活用によって生じるリスクを把握し，受容可能な水準に管理する。", "全てのIT投資案件の開発作業を取締役が担当する。"]), correctOptionIds: ["c"],
    explanationMarkdown: "ITガバナンスでは，経営陣がITの利活用を評価・指示・モニタリングし，リスクを適切な水準へ管理します。",
    tags: ["ITパスポート", "マネジメント", "ITガバナンス"], license: source(2026, "令和8年度 ITパスポート試験 公開問題", 41),
  }),
  official({
    id: "ipa-ip-2026-q42", sectionId: "ipa-ip-syllabus-management", order: 3,
    promptMarkdown: "サービスデスクの業務として，適切なものはどれか。",
    options: choices(["システムの受入れテスト段階で発見された不具合に対応する。", "システム稼働後に利用者から寄せられる問合せに対応する。", "プログラム開発者からの技術的な質問だけに対応する。", "要件定義で利用者の要求を収集する。"]), correctOptionIds: ["b"],
    explanationMarkdown: "サービスデスクは利用者との単一窓口として，問合せやインシデントなどを受け付けて対応します。",
    tags: ["ITパスポート", "マネジメント", "サービスデスク"], license: source(2026, "令和8年度 ITパスポート試験 公開問題", 42),
  }),

  official({
    id: "ipa-ip-2026-q60", sectionId: "ipa-ip-syllabus-technology", order: 0,
    promptMarkdown: "レスポンシブWebデザインに関する記述として，適切なものはどれか。",
    options: choices(["PC，スマートフォンなど，多くの種類の端末で，見やすく，かつ操作しやすくなるように，表示する端末の画面サイズなどに応じてWebサイトの画面レイアウトが変化する。", "動画をストリーミング再生するとき，複数の配信サーバのうち利用者に適したサーバに接続させる。", "端末に内蔵された加速度センサーやジャイロセンサーのデータを使用する。", "マウスポインタをWebコンテンツに重ねたとき，ポップアップで機能の説明などを表示する。"]), correctOptionIds: ["a"],
    explanationMarkdown: "レスポンシブWebデザインは，画面サイズなどに応じてレイアウトを調整し，多様な端末での見やすさと操作性を保つ設計です。",
    tags: ["ITパスポート", "テクノロジ", "Web"], license: source(2026, "令和8年度 ITパスポート試験 公開問題", 60),
  }),
  official({
    id: "ipa-ip-2026-q61", sectionId: "ipa-ip-syllabus-technology", order: 1,
    promptMarkdown: "PCの画面表示に必要なデータを保持するのに使われる，画面表示専用メモリはどれか。",
    options: choices(["EEPROM", "VRAM", "キャッシュメモリ", "フラッシュメモリ"]), correctOptionIds: ["b"],
    explanationMarkdown: "VRAMは画面に表示する画像データを保持するためのビデオメモリです。",
    tags: ["ITパスポート", "テクノロジ", "メモリ"], license: source(2026, "令和8年度 ITパスポート試験 公開問題", 61),
  }),
  official({
    id: "ipa-ip-2026-q62", sectionId: "ipa-ip-syllabus-technology", order: 2,
    promptMarkdown: "システムの性能評価におけるベンチマークテストに関する記述として，適切なものはどれか。",
    options: choices(["評価対象で使われるものと同じデータ，同じプログラムを，ほかの疑似システム上で実行させる。", "評価対象の動作特性をモデル化したものを，ほかの疑似システム上で実行させる。", "プログラムステップ数，ハードウェア性能，I/O回数の机上計算値から処理時間を積算する。", "標準的な処理を設定した評価用プログラムを，評価対象のシステム上で実際に実行させる。"]), correctOptionIds: ["d"],
    explanationMarkdown: "ベンチマークテストは，標準化した処理やプログラムを実機で動かし，結果を比較して性能を評価します。",
    tags: ["ITパスポート", "テクノロジ", "性能評価"], license: source(2026, "令和8年度 ITパスポート試験 公開問題", 62),
  }),
  official({
    id: "ipa-ip-2026-q63", sectionId: "ipa-ip-syllabus-technology", order: 3,
    promptMarkdown: "PCに保存されたファイルを使用できなくするランサムウェアによる被害を低減させるための対策として，適切なものはどれか。",
    options: choices(["UPSの導入", "データの暗号化", "データのバックアップ", "ログインパスワードの変更"]), correctOptionIds: ["c"],
    explanationMarkdown: "端末から切り離した世代管理付きバックアップがあれば，暗号化・破壊されたデータを復元でき，被害を低減できます。",
    tags: ["ITパスポート", "テクノロジ", "ランサムウェア"], license: source(2026, "令和8年度 ITパスポート試験 公開問題", 63),
  }),

  official({
    id: "ipa-fe-2026-q1", sectionId: "ipa-fe-syllabus-technology", order: 0,
    promptMarkdown: "入力されたビットに対して出力されるビットが0か1のいずれかである確率を遷移確率という。遷移確率を表にしたとき，入力0に対する出力0，1の確率をそれぞれa，b，入力1に対する出力0，1の確率をそれぞれc，dとする。a，b，c，dの関係はどれか。",
    options: choices(["a＋b＋c＋d＝1", "a＋b＝1，c＋d＝1", "a＋c＝1，b＋d＝1", "a＋d＝1，b＋c＝1"]), correctOptionIds: ["b"],
    explanationMarkdown: "同じ入力に対する出力0と出力1は排反で全事象を構成するので，それぞれの確率の和は1です。",
    tags: ["基本情報技術者", "テクノロジ", "確率"], license: source(2026, "令和8年度 基本情報技術者試験 科目A 公開問題", 1, "（アプリ表示用に改変：表をテキスト化）"),
  }),
  official({
    id: "ipa-fe-2026-q2", sectionId: "ipa-fe-syllabus-technology", order: 1,
    promptMarkdown: "クイックソートの処理方法を説明したものはどれか。",
    options: choices(["既に整列済みのデータ列の正しい位置に，データを追加する操作を繰り返していく方法である。", "データ中の最小値を求め，次にそれを除いた部分の中から最小値を求める。この操作を繰り返していく方法である。", "適当な基準値を選び，それよりも小さな値のグループと大きな値のグループにデータを分割する。同様にして，グループの中で基準値を選び，それぞれのグループを分割する。この操作を繰り返していく方法である。", "隣り合ったデータの比較と入替えを繰り返すことによって，小さな値のデータを次第に端の方に移していく方法である。"]), correctOptionIds: ["c"],
    explanationMarkdown: "クイックソートは基準値（ピボット）で大小のグループに分割し，各グループへ同じ処理を再帰的に適用します。",
    tags: ["基本情報技術者", "テクノロジ", "整列"], license: source(2026, "令和8年度 基本情報技術者試験 科目A 公開問題", 2),
  }),
  official({
    id: "ipa-fe-2026-q3", sectionId: "ipa-fe-syllabus-technology", order: 2,
    promptMarkdown: "プロセッサの一つであるGPUの特徴として，適切なものはどれか。",
    options: choices(["OS及び他のハードウェアから独立して機能し，暗号キーなどの情報を安全に管理する。", "並列に動作する多数の浮動小数点演算ユニットによって，高速な3D演算ができる。", "目的に応じて半導体デバイス内部の論理回路を再構成できる。", "量子ビットによって0と1を重ね合わせた状態を計算に使うことができる。"]), correctOptionIds: ["b"],
    explanationMarkdown: "GPUは多数の演算ユニットによる並列処理を得意とし，画像処理や3D演算などを高速に実行します。",
    tags: ["基本情報技術者", "テクノロジ", "GPU"], license: source(2026, "令和8年度 基本情報技術者試験 科目A 公開問題", 3),
  }),
  official({
    id: "ipa-fe-2026-q4", sectionId: "ipa-fe-syllabus-technology", order: 3,
    promptMarkdown: "クラウドコンピューティングのサービスモデルとしてのPaaSの説明はどれか。",
    options: choices(["OSやアプリケーションを含む任意のソフトウェアを実行可能にするリソースが利用者に提供される。OSなどのプラットフォームへの限定的な設定や制御を行うことができる。", "アプリケーションの開発や運用に必要となるミドルウェアなどが利用者に提供されるので，これらを利用して，アプリケーションを開発して運用することができる。利用者は，プラットフォームを直接変更することはできない。", "利用者は，ハードウェア，OSなどのプラットフォームとアプリケーションを自ら準備して，それらの運用を依頼する。利用者は，プラットフォームの構成を決めることができるなど，環境構築の自由度が高い。", "利用者は，用意されたアプリケーションをそのまま又はカスタマイズして利用するが，OSなどのプラットフォームからアプリケーションまで全てを自ら準備する必要はない。利用者は，プラットフォームを直接変更することはできない。"]), correctOptionIds: ["b"],
    explanationMarkdown: "PaaSはアプリケーションの開発・実行に必要なプラットフォームをサービスとして提供します。",
    tags: ["基本情報技術者", "テクノロジ", "PaaS"], license: source(2026, "令和8年度 基本情報技術者試験 科目A 公開問題", 4),
  }),

  official({
    id: "ipa-fe-2026-q11", sectionId: "ipa-fe-syllabus-management", order: 0,
    promptMarkdown: "あるシステムにおいて，“プログラムの記述方法が統一されていないので保守がしづらい”という問題が発生している。今後の新規開発プロジェクトにおけるこの問題の低減策として，最も適切なものはどれか。",
    options: choices(["コーディング規約を見直し，教育する。", "セキュアプログラミングを採用する。", "単体テストでの命令網羅度を上げる。", "プロジェクト管理レビューに全プログラマーが参加する。"]), correctOptionIds: ["a"],
    explanationMarkdown: "記述方法の不統一には，明確なコーディング規約を整備し，開発者へ教育して適用を徹底する対策が直接有効です。",
    tags: ["基本情報技術者", "マネジメント", "品質管理"], license: source(2026, "令和8年度 基本情報技術者試験 科目A 公開問題", 11),
  }),
  official({
    id: "ipa-fe-2026-q12", sectionId: "ipa-fe-syllabus-management", order: 1,
    promptMarkdown: "バーンダウンチャートの使い方として，適切なものはどれか。",
    options: choices(["縦軸を完成した成果物の総量，横軸を時間とし，プロジェクトが進むに従って完成した成果物の総量が増加する様子を確認する。", "縦軸を残課題の総数，横軸を時間とし，プロジェクトが進むに従って残課題の総量が増減する様子を確認する。", "縦軸を残作業の量，横軸を時間とし，プロジェクトが進むに従って残作業の量が減少する様子を確認する。", "縦軸を延べ工数，横軸を時間とし，プロジェクトが進むに従って延べ工数が増加する様子を確認する。"]), correctOptionIds: ["c"],
    explanationMarkdown: "バーンダウンチャートは横軸に時間，縦軸に残作業量をとり，完了へ向けた減少を可視化します。",
    tags: ["基本情報技術者", "マネジメント", "アジャイル"], license: source(2026, "令和8年度 基本情報技術者試験 科目A 公開問題", 12),
  }),
  official({
    id: "ipa-fe-2026-q13", sectionId: "ipa-fe-syllabus-management", order: 2,
    promptMarkdown: "あるシステム開発プロジェクトの進捗が遅延したので，クリティカルパス上の作業への投入工数を増やすことによって遅延の解消を図った。このとき適用した，所要期間を短縮するための手法を何と呼ぶか。",
    options: choices(["クラッシング", "コーチング", "ファストトラッキング", "メンタリング"]), correctOptionIds: ["a"],
    explanationMarkdown: "クラッシングはクリティカルパス上の作業へ資源を追加し，コストを増やして所要期間を短縮する手法です。",
    tags: ["基本情報技術者", "マネジメント", "日程管理"], license: source(2026, "令和8年度 基本情報技術者試験 科目A 公開問題", 13),
  }),
  official({
    id: "ipa-fe-2026-q14", sectionId: "ipa-fe-syllabus-management", order: 3,
    promptMarkdown: "A社は，自社のデータセンタでアプリケーションシステムを運用し，顧客にサービスを提供している。現在，実行環境をクラウドサービスに移行して，サービス可用性を向上させることを検討している。サービス提供時間は移行前後とも年間5,000時間，移行前の停止時間は年間100時間，移行後は年間30分である。サービス可用性（%）は小数第3位を切り捨てるとき，移行後に何パーセントポイント向上するか。",
    options: choices(["0.01", "0.19", "1.40", "1.99"]), correctOptionIds: ["d"],
    explanationMarkdown: "移行前は98.00%，移行後は99.99%なので，向上幅は1.99パーセントポイントです。",
    tags: ["基本情報技術者", "マネジメント", "可用性"], license: source(2026, "令和8年度 基本情報技術者試験 科目A 公開問題", 14),
  }),

  official({
    id: "ipa-fe-2026-q16", sectionId: "ipa-fe-syllabus-strategy", order: 0,
    promptMarkdown: "小売事業者が，オムニチャネル戦略を実現するためのIT活用事例はどれか。",
    options: choices(["実店舗，オンライン店舗，コールセンタなど複数の顧客接点で，顧客情報や在庫情報などを一元的に管理・共有して接客することによって，顧客の利便性を高める。", "複数店舗からネットワークを経由して，受発注，出荷，請求，支払などの取引情報を電子的に交換することによって，卸売業者とメーカとの間の受発注業務の効率を高める。", "複数店舗に設置した監視カメラの画像データを本部に集め，本部が各店舗の状況をリアルタイムに把握することによって，店舗運営業務の効率を高める。", "複数店舗のPOSデータを本部に集め，本部が日次で売れ筋商品の抽出，複数の商品の併売率の分析を行うことによって，商品計画や棚割計画を最適化する。"]), correctOptionIds: ["a"],
    explanationMarkdown: "オムニチャネルは実店舗やECなど複数チャネルを統合し，一貫した顧客体験と利便性を提供します。",
    tags: ["基本情報技術者", "ストラテジ", "オムニチャネル"], license: source(2026, "令和8年度 基本情報技術者試験 科目A 公開問題", 16),
  }),
  official({
    id: "ipa-fe-2026-q17", sectionId: "ipa-fe-syllabus-strategy", order: 1,
    promptMarkdown: "サービスA～Dの中で会員のリテンション率が最も高いものはどれか。リテンションの対象は前月末から当月末まで継続して在籍した会員とし，当月新規会員は月末までの退会はないものとする。前月末会員数／当月新規会員数／当月末会員数は，A：1,000／500／800，B：1,000／200／800，C：1,500／500／1,100，D：1,500／1,000／1,800である。",
    options: choices(["サービスA", "サービスB", "サービスC", "サービスD"]), correctOptionIds: ["b"],
    explanationMarkdown: "継続会員は当月末会員数から新規会員数を引いて求めます。前月末会員数で割るとA 30%，B 60%，C 40%，D 約53.3%で，Bが最大です。",
    tags: ["基本情報技術者", "ストラテジ", "リテンション"], license: source(2026, "令和8年度 基本情報技術者試験 科目A 公開問題", 17, "（アプリ表示用に改変：表をテキスト化）"),
  }),
  official({
    id: "ipa-fe-2026-q18", sectionId: "ipa-fe-syllabus-strategy", order: 2,
    promptMarkdown: "AIの事例として，適切でないものはどれか。",
    options: choices(["制御量を目標値側へフィードバックすることによって両者を比較し，その差によって両者を一致させるような修正動作を行うPID制御のモーターコントローラー", "部屋の広さや形，家具の位置などを学習し，移動のルートを決めて掃除をするロボット", "ヘルプデスク及びコールセンターに代わって，自然言語による質問の意味を推測して返事をするチャットボット", "ボードゲームでプロの人間に勝つような，多数の統計データを処理することによって人間に勝るソフトウェア"]), correctOptionIds: ["a"],
    explanationMarkdown: "PID制御は偏差に基づく古典制御であり，この設問ではAIの事例には該当しません。",
    tags: ["基本情報技術者", "ストラテジ", "AI活用"], license: source(2026, "令和8年度 基本情報技術者試験 科目A 公開問題", 18),
  }),
  official({
    id: "ipa-fe-2026-q19", sectionId: "ipa-fe-syllabus-strategy", order: 3,
    promptMarkdown: "ブレーンストーミングの説明はどれか。",
    options: choices(["あるテーマの検討において，複数のメンバーで，各自が思いつくままに自由奔放にできるだけ多くのアイデアを出し合うことによって，創造的思考を喚起し，アイデアを開発しようとする会議方法", "研修を始める前に行う簡単なゲームや，商談や面接の本題に入る前に行う雑談など，参加者の緊張をほぐすためのコミュニケーション方法", "情報を，決められた枠組みに従って整理・分析するスキルや方法を利用し，複雑なものごとを明快に把握したり，問題に対する解決策を導き出したりするような思考方法", "ポイントを繰り返したり，言い換えたりすることによって，お互いの理解する意味合いが一致していることを確認したり，意見・評価を伝えたりする方法"]), correctOptionIds: ["a"],
    explanationMarkdown: "ブレーンストーミングでは批判を避け，自由奔放に多数のアイデアを出し，結合・発展させます。",
    tags: ["基本情報技術者", "ストラテジ", "発想法"], license: source(2026, "令和8年度 基本情報技術者試験 科目A 公開問題", 19),
  }),

  official({
    id: "ipa-ap-2025a-q2", sectionId: "ipa-ap-syllabus-technology", order: 0,
    promptMarkdown: "M/M/1の待ち行列モデルを適用できるコンピュータシステムにおいて，平均待ち時間が平均サービス時間T以上となるのは，利用率が少なくとも何%となったときか。到着はポアソン分布に従い，待ち行列の長さに制限はなく，サービス時間は平均Tの指数分布に従うものとする。",
    options: choices(["33", "50", "67", "80"]), correctOptionIds: ["b"],
    explanationMarkdown: "M/M/1で平均待ち時間はρT÷(1－ρ)です。これがT以上になる条件からρ≧0.5です。",
    tags: ["応用情報技術者", "テクノロジ", "待ち行列"], license: source(2025, "令和7年度 秋期 応用情報技術者試験 午前", 2),
  }),
  official({
    id: "ipa-ap-2025a-q3", sectionId: "ipa-ap-syllabus-technology", order: 1,
    promptMarkdown: "機械学習モデルの評価における偽陰性率（False Negative Rate）の説明として，適切なものはどれか。",
    options: choices(["正しいデータを，誤って不正と予測した割合", "実際には不正であるデータを，誤って正しいと予測した割合", "実際には不正であるデータを，正しく不正と予測した割合", "全データのうち，誤って予測した割合"]), correctOptionIds: ["b"],
    explanationMarkdown: "偽陰性は，実際は陽性（ここでは不正）なのに陰性（正しい）と誤判定したケースです。",
    tags: ["応用情報技術者", "テクノロジ", "機械学習"], license: source(2025, "令和7年度 秋期 応用情報技術者試験 午前", 3),
  }),
  official({
    id: "ipa-ap-2025a-q4", sectionId: "ipa-ap-syllabus-technology", order: 2,
    promptMarkdown: "CRC（巡回冗長検査）に関する記述として，適切なものはどれか。",
    options: choices(["検査対象データが生成多項式の1ビットだけであることを確認する。", "受信側では，検査対象データを付加された検査データで割る。", "送信側では，生成多項式を用いて検査データを作り，検査対象データに付加する。", "送信側と受信側では異なる生成多項式を用いる。"]), correctOptionIds: ["c"],
    explanationMarkdown: "CRCでは送信側が生成多項式による除算の余りを検査データとして付加し，受信側も同じ生成多項式で検査します。",
    tags: ["応用情報技術者", "テクノロジ", "誤り検出"], license: source(2025, "令和7年度 秋期 応用情報技術者試験 午前", 4),
  }),
  official({
    id: "ipa-ap-2025a-q5", sectionId: "ipa-ap-syllabus-technology", order: 3,
    promptMarkdown: "可変区画方式の主記憶管理におけるベストフィット方式の説明として，適切なものはどれか。",
    options: choices(["空き領域をアドレスの小さい順に探索し，最初に見つかった領域へ割り当てる。", "要求された大きさを満たす空き領域のうち，最も小さいものを割り当てるので，小さな空き領域が多数生じやすい。", "ハッシュ値を用いて空き領域を探索する。", "空き領域をアドレス順に管理し，隣接する空き領域を併合する方式だけをいう。"]), correctOptionIds: ["b"],
    explanationMarkdown: "ベストフィットは要求を満たす最小の空き区画を選ぶため，割当て後に細かな未使用領域が残りやすくなります。",
    tags: ["応用情報技術者", "テクノロジ", "メモリ管理"], license: source(2025, "令和7年度 秋期 応用情報技術者試験 午前", 5),
  }),

  official({
    id: "ipa-ap-2025a-q51", sectionId: "ipa-ap-syllabus-management", order: 0,
    promptMarkdown: "プロジェクトマネジメントにおいて，スコープを対象とするプロセスを集めた対象群“スコープ”に含まれるプロセスはどれか。",
    options: choices(["WBSの作成", "アクティビティの所要期間の見積り", "コストの見積り", "予算の作成"]), correctOptionIds: ["a"],
    explanationMarkdown: "WBSの作成は，プロジェクトスコープを管理可能な作業へ分解するスコープ管理のプロセスです。",
    tags: ["応用情報技術者", "マネジメント", "WBS"], license: source(2025, "令和7年度 秋期 応用情報技術者試験 午前", 51),
  }),
  official({
    id: "ipa-ap-2025a-q52", sectionId: "ipa-ap-syllabus-management", order: 1,
    promptMarkdown: "タックマンモデルにおいて，メンバーの異なる価値観が明らかになり，メンバーがそれぞれの意見を主張する段階はどれか。",
    options: choices(["安定期（Norming）", "遂行期（Performing）", "成立期（Forming）", "動乱期（Storming）"]), correctOptionIds: ["d"],
    explanationMarkdown: "Stormingでは役割や方針を巡って意見の対立が表面化します。その後Normingで規範や関係が整います。",
    tags: ["応用情報技術者", "マネジメント", "チーム形成"], license: source(2025, "令和7年度 秋期 応用情報技術者試験 午前", 52),
  }),
  official({
    id: "ipa-ap-2025a-q55", sectionId: "ipa-ap-syllabus-management", order: 2,
    promptMarkdown: "サービス可用性管理において，障害の発生経路や根本原因，発生確率を分析する技法はどれか。",
    options: choices(["FTA", "FMEA", "CFIA", "SPOF"]), correctOptionIds: ["a"],
    explanationMarkdown: "FTAはトップ事象から論理的に原因を展開するフォールトツリーを用い，障害の発生経路と確率を分析します。",
    tags: ["応用情報技術者", "マネジメント", "可用性"], license: source(2025, "令和7年度 秋期 応用情報技術者試験 午前", 55),
  }),
  official({
    id: "ipa-ap-2025a-q59", sectionId: "ipa-ap-syllabus-management", order: 3,
    promptMarkdown: "システム監査人が実施するフォローアップとして，適切なものはどれか。",
    options: choices(["被監査部門の長に改善措置の実施を命令する。", "改善プロジェクトを自ら管理する。", "監査結果に基づく改善措置の実施状況をモニタリングする。", "被監査部門に代わって改善計画を策定する。"]), correctOptionIds: ["c"],
    explanationMarkdown: "監査人は独立性を保ちつつ，監査結果への改善措置が適切に実施されているかを確認します。",
    tags: ["応用情報技術者", "マネジメント", "システム監査"], license: source(2025, "令和7年度 秋期 応用情報技術者試験 午前", 59),
  }),

  official({
    id: "ipa-ap-2025a-q61", sectionId: "ipa-ap-syllabus-strategy", order: 0,
    promptMarkdown: "プログラムマネジメントの説明として，適切なものはどれか。",
    options: choices(["複数の関連するプロジェクトを調整して管理し，個別に管理した場合には得られない便益と統制を実現する。", "一つのプロジェクトの品質だけを管理する。", "定常業務を部門ごとに管理する。", "複数の無関係なプロジェクトの予算だけを一括管理する。"]), correctOptionIds: ["a"],
    explanationMarkdown: "プログラムマネジメントは，関連する複数プロジェクトを一体として調整し，戦略的な便益の実現を目指します。",
    tags: ["応用情報技術者", "ストラテジ", "プログラムマネジメント"], license: source(2025, "令和7年度 秋期 応用情報技術者試験 午前", 61),
  }),
  official({
    id: "ipa-ap-2025a-q62", sectionId: "ipa-ap-syllabus-strategy", order: 1,
    promptMarkdown: "SOA（Service Oriented Architecture）の説明として，適切なものはどれか。",
    options: choices(["一つの巨大なプログラムに全機能を実装する設計思想", "画面ごとに専用データベースを必ず配置する設計思想", "ハードウェアの命令セットを統一する設計思想", "業務上の機能を独立したサービスとして公開し，それらを組み合わせてシステムを構築する考え方"]), correctOptionIds: ["d"],
    explanationMarkdown: "SOAは再利用可能な業務機能を疎結合なサービスとして提供し，組合せによってシステムを構成します。",
    tags: ["応用情報技術者", "ストラテジ", "SOA"], license: source(2025, "令和7年度 秋期 応用情報技術者試験 午前", 62),
  }),
  official({
    id: "ipa-ap-2025a-q63", sectionId: "ipa-ap-syllabus-strategy", order: 2,
    promptMarkdown: "データ分析手法の一つであるアソシエーション分析の説明として，適切なものはどれか。",
    options: choices(["時系列データから将来値を予測する。", "大量の取引データから，同時に購入されやすい商品の組合せなど，項目間の関連性を見つける。", "データをあらかじめ決めた正解ラベルへ分類する。", "線形計画法で利益を最大化する。"]), correctOptionIds: ["b"],
    explanationMarkdown: "アソシエーション分析は，購買履歴などから“商品Aを買う人は商品Bも買う”といった共起規則を抽出します。",
    tags: ["応用情報技術者", "ストラテジ", "データ分析"], license: source(2025, "令和7年度 秋期 応用情報技術者試験 午前", 63),
  }),
  official({
    id: "ipa-ap-2025a-q64", sectionId: "ipa-ap-syllabus-strategy", order: 3,
    promptMarkdown: "投資評価方法の一つである回収期間法（PBP法）の説明として，適切なものはどれか。",
    options: choices(["キャッシュフローの時間的価値を必ず考慮する。", "投資回収後の全キャッシュフローを評価対象とする。", "投資額を回収するまでの期間の長さによって投資案を評価する。", "正味現在価値が最大となる案を選ぶ。"]), correctOptionIds: ["c"],
    explanationMarkdown: "PBP法は初期投資を将来のキャッシュフローで回収するまでの期間を求め，短い案を有利と評価します。",
    tags: ["応用情報技術者", "ストラテジ", "投資評価"], license: source(2025, "令和7年度 秋期 応用情報技術者試験 午前", 64),
  }),
];
