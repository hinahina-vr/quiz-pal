window.QUIZ_COURSE_DATA = window.QUIZ_COURSE_DATA || {};
window.QUIZ_COURSE_DATA["sample-ap"] = {
  "id": "sample-ap",
  "name": "応用情報技術者",
  "accent": "#b45309",
  "chapters": [
    {
      "id": "sample-ap-design",
      "number": 1,
      "title": "設計と信頼性",
      "sourceQuestionCount": 2,
      "questions": [
        {
          "id": "sample-ap-1",
          "prompt": "障害発生後、業務を再開するまでに許容できる目標時間を表す指標はどれですか。",
          "options": [
            "RTO",
            "RPO",
            "MTBF",
            "ROI"
          ],
          "answer": 0,
          "explanation": "RTOは目標復旧時間です。RPOは、どの時点までのデータ復旧を目標とするかを表します。",
          "sourceTitle": "CC0 書き下ろし例題"
        },
        {
          "id": "sample-ap-2",
          "prompt": "可用性0.99の装置を2台直列に接続し、両方が稼働したときだけシステムが稼働します。独立故障とするとシステムの可用性はいくつですか。小数で答えてください。",
          "options": [
            "0.9801"
          ],
          "answer": 0,
          "answerText": "0.9801",
          "format": "typing",
          "explanation": "直列システムでは各要素の可用性を掛けるので、0.99 × 0.99 = 0.9801 です。",
          "sourceTitle": "CC0 書き下ろし例題"
        }
      ]
    },
    {
      "id": "sample-ap-management",
      "number": 2,
      "title": "管理とリスク",
      "sourceQuestionCount": 2,
      "questions": [
        {
          "id": "sample-ap-3",
          "prompt": "損害保険に加入して、事故発生時の金銭的損失の一部を保険会社へ負担してもらうリスク対応はどれですか。",
          "options": [
            "回避",
            "低減",
            "移転",
            "受容"
          ],
          "answer": 2,
          "explanation": "保険や契約によって影響を第三者へ移す対応は、リスク移転に分類されます。",
          "sourceTitle": "CC0 書き下ろし例題"
        },
        {
          "id": "sample-ap-4",
          "prompt": "プロジェクトの出来高が80万円、実コストが100万円のとき、コスト効率指数（CPI）はいくつですか。",
          "options": [
            "0.8",
            "1.0",
            "1.2",
            "1.8"
          ],
          "answer": 0,
          "explanation": "CPIは出来高（EV）÷実コスト（AC）なので、80 ÷ 100 = 0.8 です。1未満はコスト効率が計画より悪いことを示します。",
          "sourceTitle": "CC0 書き下ろし例題"
        }
      ]
    },
    {
      "id": "ipa-ap-syllabus-strategy",
      "number": 3,
      "title": "ストラテジ系（シラバスVer.7.2）",
      "sourceQuestionCount": 4,
      "questions": [
        {
          "id": "ipa-ap-2025a-q61",
          "prompt": "プログラムマネジメントの説明として，適切なものはどれか。",
          "options": [
            "複数の関連するプロジェクトを調整して管理し，個別に管理した場合には得られない便益と統制を実現する。",
            "一つのプロジェクトの品質だけを管理する。",
            "定常業務を部門ごとに管理する。",
            "複数の無関係なプロジェクトの予算だけを一括管理する。"
          ],
          "answer": 0,
          "explanation": "プログラムマネジメントは，関連する複数プロジェクトを一体として調整し，戦略的な便益の実現を目指します。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問61（アプリ表示用に一部改変）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
        },
        {
          "id": "ipa-ap-2025a-q62",
          "prompt": "SOA（Service Oriented Architecture）の説明として，適切なものはどれか。",
          "options": [
            "一つの巨大なプログラムに全機能を実装する設計思想",
            "画面ごとに専用データベースを必ず配置する設計思想",
            "ハードウェアの命令セットを統一する設計思想",
            "業務上の機能を独立したサービスとして公開し，それらを組み合わせてシステムを構築する考え方"
          ],
          "answer": 3,
          "explanation": "SOAは再利用可能な業務機能を疎結合なサービスとして提供し，組合せによってシステムを構成します。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問62（アプリ表示用に一部改変）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
        },
        {
          "id": "ipa-ap-2025a-q63",
          "prompt": "データ分析手法の一つであるアソシエーション分析の説明として，適切なものはどれか。",
          "options": [
            "時系列データから将来値を予測する。",
            "大量の取引データから，同時に購入されやすい商品の組合せなど，項目間の関連性を見つける。",
            "データをあらかじめ決めた正解ラベルへ分類する。",
            "線形計画法で利益を最大化する。"
          ],
          "answer": 1,
          "explanation": "アソシエーション分析は，購買履歴などから“商品Aを買う人は商品Bも買う”といった共起規則を抽出します。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問63（アプリ表示用に一部改変）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
        },
        {
          "id": "ipa-ap-2025a-q64",
          "prompt": "投資評価方法の一つである回収期間法（PBP法）の説明として，適切なものはどれか。",
          "options": [
            "キャッシュフローの時間的価値を必ず考慮する。",
            "投資回収後の全キャッシュフローを評価対象とする。",
            "投資額を回収するまでの期間の長さによって投資案を評価する。",
            "正味現在価値が最大となる案を選ぶ。"
          ],
          "answer": 2,
          "explanation": "PBP法は初期投資を将来のキャッシュフローで回収するまでの期間を求め，短い案を有利と評価します。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問64（アプリ表示用に一部改変）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
        }
      ]
    },
    {
      "id": "ipa-ap-syllabus-management",
      "number": 4,
      "title": "マネジメント系（シラバスVer.7.2）",
      "sourceQuestionCount": 4,
      "questions": [
        {
          "id": "ipa-ap-2025a-q51",
          "prompt": "プロジェクトマネジメントにおいて，スコープを対象とするプロセスを集めた対象群“スコープ”に含まれるプロセスはどれか。",
          "options": [
            "WBSの作成",
            "アクティビティの所要期間の見積り",
            "コストの見積り",
            "予算の作成"
          ],
          "answer": 0,
          "explanation": "WBSの作成は，プロジェクトスコープを管理可能な作業へ分解するスコープ管理のプロセスです。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問51（アプリ表示用に一部改変）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
        },
        {
          "id": "ipa-ap-2025a-q52",
          "prompt": "タックマンモデルにおいて，メンバーの異なる価値観が明らかになり，メンバーがそれぞれの意見を主張する段階はどれか。",
          "options": [
            "安定期（Norming）",
            "遂行期（Performing）",
            "成立期（Forming）",
            "動乱期（Storming）"
          ],
          "answer": 3,
          "explanation": "Stormingでは役割や方針を巡って意見の対立が表面化します。その後Normingで規範や関係が整います。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問52（アプリ表示用に一部改変）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
        },
        {
          "id": "ipa-ap-2025a-q55",
          "prompt": "サービス可用性管理において，障害の発生経路や根本原因，発生確率を分析する技法はどれか。",
          "options": [
            "FTA",
            "FMEA",
            "CFIA",
            "SPOF"
          ],
          "answer": 0,
          "explanation": "FTAはトップ事象から論理的に原因を展開するフォールトツリーを用い，障害の発生経路と確率を分析します。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問55（アプリ表示用に一部改変）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
        },
        {
          "id": "ipa-ap-2025a-q59",
          "prompt": "システム監査人が実施するフォローアップとして，適切なものはどれか。",
          "options": [
            "被監査部門の長に改善措置の実施を命令する。",
            "改善プロジェクトを自ら管理する。",
            "監査結果に基づく改善措置の実施状況をモニタリングする。",
            "被監査部門に代わって改善計画を策定する。"
          ],
          "answer": 2,
          "explanation": "監査人は独立性を保ちつつ，監査結果への改善措置が適切に実施されているかを確認します。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問59（アプリ表示用に一部改変）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
        }
      ]
    },
    {
      "id": "ipa-ap-syllabus-technology",
      "number": 5,
      "title": "テクノロジ系（シラバスVer.7.2）",
      "sourceQuestionCount": 4,
      "questions": [
        {
          "id": "ipa-ap-2025a-q2",
          "prompt": "M/M/1の待ち行列モデルを適用できるコンピュータシステムにおいて，平均待ち時間が平均サービス時間T以上となるのは，利用率が少なくとも何%となったときか。到着はポアソン分布に従い，待ち行列の長さに制限はなく，サービス時間は平均Tの指数分布に従うものとする。",
          "options": [
            "33",
            "50",
            "67",
            "80"
          ],
          "answer": 1,
          "explanation": "M/M/1で平均待ち時間はρT÷(1－ρ)です。これがT以上になる条件からρ≧0.5です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問2（アプリ表示用に一部改変）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
        },
        {
          "id": "ipa-ap-2025a-q3",
          "prompt": "機械学習モデルの評価における偽陰性率（False Negative Rate）の説明として，適切なものはどれか。",
          "options": [
            "正しいデータを，誤って不正と予測した割合",
            "実際には不正であるデータを，誤って正しいと予測した割合",
            "実際には不正であるデータを，正しく不正と予測した割合",
            "全データのうち，誤って予測した割合"
          ],
          "answer": 1,
          "explanation": "偽陰性は，実際は陽性（ここでは不正）なのに陰性（正しい）と誤判定したケースです。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問3（アプリ表示用に一部改変）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
        },
        {
          "id": "ipa-ap-2025a-q4",
          "prompt": "CRC（巡回冗長検査）に関する記述として，適切なものはどれか。",
          "options": [
            "検査対象データが生成多項式の1ビットだけであることを確認する。",
            "受信側では，検査対象データを付加された検査データで割る。",
            "送信側では，生成多項式を用いて検査データを作り，検査対象データに付加する。",
            "送信側と受信側では異なる生成多項式を用いる。"
          ],
          "answer": 2,
          "explanation": "CRCでは送信側が生成多項式による除算の余りを検査データとして付加し，受信側も同じ生成多項式で検査します。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問4（アプリ表示用に一部改変）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
        },
        {
          "id": "ipa-ap-2025a-q5",
          "prompt": "可変区画方式の主記憶管理におけるベストフィット方式の説明として，適切なものはどれか。",
          "options": [
            "空き領域をアドレスの小さい順に探索し，最初に見つかった領域へ割り当てる。",
            "要求された大きさを満たす空き領域のうち，最も小さいものを割り当てるので，小さな空き領域が多数生じやすい。",
            "ハッシュ値を用いて空き領域を探索する。",
            "空き領域をアドレス順に管理し，隣接する空き領域を併合する方式だけをいう。"
          ],
          "answer": 1,
          "explanation": "ベストフィットは要求を満たす最小の空き区画を選ぶため，割当て後に細かな未使用領域が残りやすくなります。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問5（アプリ表示用に一部改変）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
        }
      ]
    },
    {
      "id": "ipa-practice-ap-2025-fall",
      "number": 6,
      "title": "令和7年度 秋期 午前 実践10問",
      "sourceQuestionCount": 10,
      "questions": [
        {
          "id": "ipa-practice-ap-2025-fall-q2",
          "prompt": "コンピュータによる伝票処理システムがある。このシステムは、伝票データをためる待ち行列をもち、M/M/1の待ち行列モデルが適用できるものとする。平均待ち時間がT秒以上となるのは、システムの利用率が少なくとも何%以上となったときか。ここで、伝票データはポアソン分布に従って到着し、待ち行列の長さに制限はなく、1件の処理時間は平均T秒の指数分布に従う。",
          "options": [
            "33",
            "50",
            "67",
            "80"
          ],
          "answer": 1,
          "explanation": "IPA公式解答例では「50」が正解です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問2（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2025-fall-q3",
          "prompt": "AIにおける機械学習において、2クラス分類モデルの評価方法の一つであるROC曲線で用いられる偽陽性率の説明として、最も適切なものはどれか。ここで、分類されるデータには正しいものと間違っているものが含まれるものとする。",
          "options": [
            "「間違い」と予測したデータのうち、実際は「正しい」データの割合",
            "実際に「間違い」であるデータに対し、誤って「正しい」と予測したデータの割合",
            "実際に「間違い」であるデータに対し、正しく「間違い」と予測したデータの割合",
            "全データのうち、実際に正しく予測できなかったデータの割合"
          ],
          "answer": 1,
          "explanation": "IPA公式解答例では「実際に「間違い」であるデータに対し、誤って「正しい」と予測したデータの割合」が正解です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問3（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2025-fall-q4",
          "prompt": "誤り検出方式であるCRCに関する記述として、適切なものはどれか。",
          "options": [
            "検査用のデータは、検査対象のデータを生成多項式で処理して得られる1ビットの値である。",
            "受信側では、付加されてきた検査用のデータで検査対象のデータを割り、余りがなければ送信が正しかったと判断する。",
            "送信側では、生成多項式を用いて検査対象のデータから検査用のデータを作り、これを検査対象のデータに付けて送信する。",
            "送信側と受信側では、異なる生成多項式が用いられる。"
          ],
          "answer": 2,
          "explanation": "IPA公式解答例では「送信側では、生成多項式を用いて検査対象のデータから検査用のデータを作り、これを検査対象のデータに付けて送信する。」が正解です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問4（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2025-fall-q5",
          "prompt": "記憶領域を管理するアルゴリズムのうち、ベストフィット方式の特徴として、適切なものはどれか。",
          "options": [
            "空きブロック群のうち、アドレスが下位のブロックを高い頻度で使用するので、アドレスが上位の方に大きな空きブロックが残る傾向にある。",
            "空きブロック群のうち、要求された大きさを満たす最小のものを割り当てるので、最終的には小さな空きブロックが多数残る傾向にある。",
            "空きブロックの検索にハッシュ関数を使用しているので、高速に検索することができる。",
            "空きブロックをアドレスの昇順に管理しているので、隣接する空きブロックを簡単に見つけられ、より大きな空きブロックにまとめることができる。"
          ],
          "answer": 1,
          "explanation": "IPA公式解答例では「空きブロック群のうち、要求された大きさを満たす最小のものを割り当てるので、最終的には小さな空きブロックが多数残る傾向にある。」が正解です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問5（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2025-fall-q7",
          "prompt": "OSSとして公開されているプログラム言語であるScalaの特徴はどれか。",
          "options": [
            "オブジェクト指向プログラミングと関数型プログラミングの両方が可能である。",
            "クラスの多重継承が可能である。",
            "実行前にコンパイルして、ネイティブコードを生成する必要がある。",
            "変数の型が、参照する実際の値によって実行時に決定される動的型付け言語である。"
          ],
          "answer": 0,
          "explanation": "IPA公式解答例では「オブジェクト指向プログラミングと関数型プログラミングの両方が可能である。」が正解です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問7（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2025-fall-q8",
          "prompt": "プロセッサの高速化技法の一つとして、同時に実行可能な複数の動作を、コンパイルの段階でまとめて一つの複合命令とし、高速化を図る方式はどれか。",
          "options": [
            "CISC",
            "MIMD",
            "RISC",
            "VLIW"
          ],
          "answer": 3,
          "explanation": "IPA公式解答例では「VLIW」が正解です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問8（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2025-fall-q9",
          "prompt": "画面表示用フレームバッファがユニファイドメモリ方式であるシステムの特徴はどれか。",
          "options": [
            "主記憶とは別に専用のフレームバッファをもつ。",
            "主記憶の一部を表示領域として使用する。",
            "シリアル接続した表示デバイスに、描画コマンドを用いて表示する。",
            "表示リフレッシュが不要である。"
          ],
          "answer": 1,
          "explanation": "IPA公式解答例では「主記憶の一部を表示領域として使用する。」が正解です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問9（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2025-fall-q12",
          "prompt": "IaC（Infrastructure as Code）の説明として、適切なものはどれか。",
          "options": [
            "OS、仮想化ソフトなどが何もインストールされていない、初期状態のサーバである。",
            "サーバなどの新規利用申請があった場合に、資源の割当て、設定などを手動で行い、利用可能な状態にする。",
            "システムの構成、設定などをプログラムとして記述し、専用のソフトウェアがその内容に従って自動的にシステムに適用する。",
            "利用者は、OS、アプリケーションなどの任意のソフトウェアをインフラストラクチャに手動で実装し、操作することができる。"
          ],
          "answer": 2,
          "explanation": "IPA公式解答例では「システムの構成、設定などをプログラムとして記述し、専用のソフトウェアがその内容に従って自動的にシステムに適用する。」が正解です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問12（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2025-fall-q13",
          "prompt": "コンピュータシステムの信頼性に関する記述のうち、適切なものはどれか。",
          "options": [
            "MTBF /（MTBF + MTTR）は、システムが稼働している時間の割合を表す。",
            "MTBF - MTTRは、システムが正常であった時間を表す。",
            "MTBFは、正常なシステムが運用を開始してから初めて故障が起きるまでの時間を表す。",
            "MTTRは、システムの故障が回復した時点から次に故障が起きるまでの平均時間を表す。"
          ],
          "answer": 0,
          "explanation": "IPA公式解答例では「MTBF /（MTBF + MTTR）は、システムが稼働している時間の割合を表す。」が正解です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問13（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2025-fall-q14",
          "prompt": "キャパシティプランニングの目的の一つに関する記述のうち、最も適切なものはどれか。",
          "options": [
            "応答時間に最も影響があるボトルネックだけに着目して、適切な変更を行うことによって、そのボトルネックの影響を低減又は排除することである。",
            "システムの現在の応答時間を調査して、長期的に監視することによって、将来を含めて応答時間を維持することである。",
            "ソフトウェアとハードウェアをチューニングして、現状の処理能力を最大限に引き出して、スループットを向上させることである。",
            "パフォーマンスの問題はリソースの過剰使用によって発生するので、特定のリソースの有効利用を向上させることである。"
          ],
          "answer": 1,
          "explanation": "IPA公式解答例では「システムの現在の応答時間を調査して、長期的に監視することによって、将来を含めて応答時間を維持することである。」が正解です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 秋期 応用情報技術者試験 午前 問14（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_ap_am_qs.pdf"
        }
      ]
    },
    {
      "id": "ipa-practice-ap-2025-spring",
      "number": 7,
      "title": "令和7年度 春期 午前 実践10問",
      "sourceQuestionCount": 10,
      "questions": [
        {
          "id": "ipa-practice-ap-2025-spring-q3",
          "prompt": "AIにおける機械学習の過程において、過学習と疑われたときの解消方法として、最も適切なものはどれか。",
          "options": [
            "訓練したときと同じ精度を出すために、訓練データをテストデータとして使用する。",
            "精度を高めるために、元の訓練データに加工を施し、訓練データの量を増やす。",
            "予測した結果に近づけるために、モデルをより複雑にする。",
            "より多くの未知のデータに対して予測できるように、汎化性能を下げる。"
          ],
          "answer": 1,
          "explanation": "IPA公式解答例では「精度を高めるために、元の訓練データに加工を施し、訓練データの量を増やす。」が正解です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 春期 応用情報技術者試験 午前 問3（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2025-spring-q4",
          "prompt": "リアルタイム性が求められる組込みシステムにおいて、システムへの入力に対するリアルタイムな応答の方法として、最も適切なものはどれか。",
          "options": [
            "OSを使用しないで応答する。",
            "定められた制限時間内に応答する。",
            "入力された順序を守って応答する。",
            "入力時刻を記録して応答する。"
          ],
          "answer": 1,
          "explanation": "IPA公式解答例では「定められた制限時間内に応答する。」が正解です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 春期 応用情報技術者試験 午前 問4（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2025-spring-q5",
          "prompt": "A、B、Cの順序で入力されるデータがある。各データについてスタックへの挿入と取出しを1回ずつ行うことができる場合、データの出力順序は何通りあるか。",
          "options": [
            "3",
            "4",
            "5",
            "6"
          ],
          "answer": 2,
          "explanation": "IPA公式解答例では「5」が正解です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 春期 応用情報技術者試験 午前 問5（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2025-spring-q7",
          "prompt": "fact(n)は、非負の整数nに対してnの階乗を返す。fact(n)の再帰的な定義はどれか。",
          "options": [
            "if n = 0 then return 0 else return n × fact(n - 1)",
            "if n = 0 then return 0 else return n × fact(n + 1)",
            "if n = 0 then return 1 else return n × fact(n - 1)",
            "if n = 0 then return 1 else return n × fact(n + 1)"
          ],
          "answer": 2,
          "explanation": "IPA公式解答例では「if n = 0 then return 1 else return n × fact(n - 1)」が正解です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 春期 応用情報技術者試験 午前 問7（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2025-spring-q8",
          "prompt": "同じ命令セットをもつコンピュータAとBとがある。あるプログラムを実行したとき、AのCPUクロック周期は1ナノ秒、CPIは4.0であり、BのCPUクロック周期は4ナノ秒、CPIは0.5である。そのプログラムを実行したとき、コンピュータAの処理時間は、コンピュータBの処理時間の何倍になるか。",
          "options": [
            "1/32",
            "1/2",
            "2",
            "8"
          ],
          "answer": 2,
          "explanation": "IPA公式解答例では「2」が正解です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 春期 応用情報技術者試験 午前 問8（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2025-spring-q9",
          "prompt": "DMAコントローラーの説明として、適切なものはどれか。",
          "options": [
            "MPUでは時間が掛かる積和演算を、高速に行う。",
            "仮想メモリ機能、メモリ保護機能などのメモリ管理機能を提供する。",
            "動作クロックに合わせてカウントするカウントレジスタをもち、それによって時間の経過を保持する。",
            "メモリと入出力装置、又はメモリとメモリとの間のデータ転送を、MPUを介さずに行う。"
          ],
          "answer": 3,
          "explanation": "IPA公式解答例では「メモリと入出力装置、又はメモリとメモリとの間のデータ転送を、MPUを介さずに行う。」が正解です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 春期 応用情報技術者試験 午前 問9（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2025-spring-q10",
          "prompt": "オブジェクトストレージの特徴として、適切なものはどれか。",
          "options": [
            "オブジェクトにはユニークな識別子が割り当てられ、識別子を使ってアクセスする。",
            "オブジェクトの内容を更新する際、上書き更新をする。",
            "広域分散を実現するためには、遠隔地のストレージと静止点を設けて同期を行う必要がある。",
            "ストレージはディレクトリの概念を使った階層構造である。"
          ],
          "answer": 0,
          "explanation": "IPA公式解答例では「オブジェクトにはユニークな識別子が割り当てられ、識別子を使ってアクセスする。」が正解です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 春期 応用情報技術者試験 午前 問10（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2025-spring-q11",
          "prompt": "マルチプロセッサによる並列処理で得られる高速化率Eを、E = 1 /（1 - r + r / n）によって評価する。r = 0.9のアプリケーションの高速化率がr = 0.3のものの3倍となるのは、プロセッサが何台のときか。ここで、nはプロセッサの台数、rは並列化が可能な部分の割合とし、並列化に伴うオーバーヘッドは考慮しない。",
          "options": [
            "3",
            "4",
            "5",
            "6"
          ],
          "answer": 3,
          "explanation": "IPA公式解答例では「6」が正解です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 春期 応用情報技術者試験 午前 問11（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2025-spring-q12",
          "prompt": "二つのシステムA、Bの稼働率をそれぞれaA、aB、MTBFをそれぞれMTBFA、MTBFB、MTTRをそれぞれMTTRA、MTTRBとしたとき、これらの関係として、常に成り立つものはどれか。",
          "options": [
            "aA = aBならば、MTBFA = MTBFBであり、かつMTTRA = MTTRBである。",
            "aA = aBならば、MTTRA / MTBFA = MTTRB / MTBFBである。",
            "aA > aBならば、MTBFA > MTBFBであり、かつMTTRA > MTTRBである。",
            "aA > aBならば、MTTRA / MTBFA > MTTRB / MTBFBである。"
          ],
          "answer": 1,
          "explanation": "IPA公式解答例では「aA = aBならば、MTTRA / MTBFA = MTTRB / MTBFBである。」が正解です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 春期 応用情報技術者試験 午前 問12（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2025-spring-q14",
          "prompt": "リアルタイムOSにおいて、実行中のタスクがプリエンプションによって遷移する状態はどれか。",
          "options": [
            "休止状態",
            "実行可能状態",
            "終了状態",
            "待ち状態"
          ],
          "answer": 1,
          "explanation": "IPA公式解答例では「実行可能状態」が正解です。",
          "sourceTitle": "©2025 IPA / 出典：令和7年度 春期 応用情報技術者試験 午前 問14（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_ap_am_qs.pdf"
        }
      ]
    },
    {
      "id": "ipa-practice-ap-2024-fall",
      "number": 8,
      "title": "令和6年度 秋期 午前 実践10問",
      "sourceQuestionCount": 10,
      "questions": [
        {
          "id": "ipa-practice-ap-2024-fall-q1",
          "prompt": "M/M/1の待ち行列モデルにおいて、窓口の利用率が25%から40%に増えると、平均待ち時間は何倍になるか。",
          "options": [
            "1.25",
            "1.60",
            "2.00",
            "3.00"
          ],
          "answer": 2,
          "explanation": "IPA公式解答例では「2.00」が正解です。",
          "sourceTitle": "©2024 IPA / 出典：令和6年度 秋期 応用情報技術者試験 午前 問1（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2024-fall-q2",
          "prompt": "AIにおける教師あり学習での交差検証に関する記述はどれか。",
          "options": [
            "過学習を防ぐために、回帰モデルに複雑さを表すペナルティ項を加え、訓練データへ過剰に適合しないようにモデルを調整する。",
            "学習の精度を高めるために、複数の異なるアルゴリズムのモデルで学習し、学習の結果は組み合わせて評価する。",
            "学習モデルの汎化性能を高めるために、単一のモデルで関連する複数の課題を学習することによって、課題間に共通する要因を獲得する。",
            "学習モデルの汎化性能を評価するために、データを複数のグループに分割し、一部を学習に残りを評価に使い、順にグループを入れ替えて学習と評価を繰り返す。"
          ],
          "answer": 3,
          "explanation": "IPA公式解答例では「学習モデルの汎化性能を評価するために、データを複数のグループに分割し、一部を学習に残りを評価に使い、順にグループを入れ替えて学習と評価を繰り返す。」が正解です。",
          "sourceTitle": "©2024 IPA / 出典：令和6年度 秋期 応用情報技術者試験 午前 問2（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2024-fall-q3",
          "prompt": "式 A + B × C の逆ポーランド表記法による表現として、適切なものはどれか。",
          "options": [
            "+ × C B A",
            "× + A B C",
            "A B C × +",
            "C B A + ×"
          ],
          "answer": 2,
          "explanation": "IPA公式解答例では「A B C × +」が正解です。",
          "sourceTitle": "©2024 IPA / 出典：令和6年度 秋期 応用情報技術者試験 午前 問3（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2024-fall-q4",
          "prompt": "自動車の先進運転支援システムで使用されるセンサーの説明のうち、適切なものはどれか。",
          "options": [
            "可視光カメラは、天候などの影響を受けやすいが、交通標識の認識に使用できる。",
            "超音波センサーは、天候などの影響を受けやすいが、測定可能距離が500メートル以上と長い。",
            "ミリ波レーダーは、天候などの影響を受けにくく、交通信号機の灯色の判別に使用できる。",
            "レーザーレーダーは、天候などの影響を受けにくく、建物の後ろにある物体を検知できる。"
          ],
          "answer": 0,
          "explanation": "IPA公式解答例では「可視光カメラは、天候などの影響を受けやすいが、交通標識の認識に使用できる。」が正解です。",
          "sourceTitle": "©2024 IPA / 出典：令和6年度 秋期 応用情報技術者試験 午前 問4（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2024-fall-q6",
          "prompt": "自然数をキーとするデータを、ハッシュ表を用いて管理する。キーxのハッシュ関数h(x)を h(x) = x mod n とすると、任意のキーaとbが衝突する条件はどれか。ここで、nはハッシュ表の大きさであり、x mod nはxをnで割った余りを表す。",
          "options": [
            "a + bがnの倍数",
            "a - bがnの倍数",
            "nがa + bの倍数",
            "nがa - bの倍数"
          ],
          "answer": 1,
          "explanation": "IPA公式解答例では「a - bがnの倍数」が正解です。",
          "sourceTitle": "©2024 IPA / 出典：令和6年度 秋期 応用情報技術者試験 午前 問6（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2024-fall-q7",
          "prompt": "次の特徴をもつプログラム言語及び実行環境であって、オープンソースソフトウェアとして提供されているものはどれか。\n\n- 統計解析や機械学習に適している。\n- データ分析、グラフ描画などの、多数のソフトウェアパッケージが提供されている。\n- 変数自体には型がなく、変数に代入されるオブジェクトの型は実行時に決まる。",
          "options": [
            "Go",
            "Kotlin",
            "R",
            "Scala"
          ],
          "answer": 2,
          "explanation": "IPA公式解答例では「R」が正解です。",
          "sourceTitle": "©2024 IPA / 出典：令和6年度 秋期 応用情報技術者試験 午前 問7（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2024-fall-q8",
          "prompt": "RISCプロセッサの5段パイプラインの命令実行制御の順序はどれか。ステージは、①書込み、②実行とアドレス生成、③命令デコードとレジスタファイル読出し、④命令フェッチ、⑤メモリアクセスの五つとする。",
          "options": [
            "③、④、②、⑤、①",
            "③、⑤、②、④、①",
            "④、③、②、⑤、①",
            "④、⑤、③、②、①"
          ],
          "answer": 2,
          "explanation": "IPA公式解答例では「④、③、②、⑤、①」が正解です。",
          "sourceTitle": "©2024 IPA / 出典：令和6年度 秋期 応用情報技術者試験 午前 問8（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2024-fall-q9",
          "prompt": "量子超越性（Quantum Supremacy）の説明として、適切なものはどれか。",
          "options": [
            "重ね合わせという現象を用いた量子暗号が、現在の暗号化方式よりもはるかに安全であること",
            "従来のコンピュータが古典物理学に依拠する段階にとどまっているのに比べて、量子コンピュータが量子力学に依拠して作られていること",
            "従来のコンピュータでは実用的な時間で処理することができない計算を、量子コンピュータでは高速に実行できること",
            "同一の性能を実現した従来のコンピュータに比べて、量子コンピュータの物理的な大きさを圧倒的に小さくできること"
          ],
          "answer": 2,
          "explanation": "IPA公式解答例では「従来のコンピュータでは実用的な時間で処理することができない計算を、量子コンピュータでは高速に実行できること」が正解です。",
          "sourceTitle": "©2024 IPA / 出典：令和6年度 秋期 応用情報技術者試験 午前 問9（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2024-fall-q10",
          "prompt": "キャッシュメモリのアクセス時間が主記憶のアクセス時間の1/30で、ヒット率が95%のとき、実効メモリアクセス時間は、主記憶のアクセス時間の約何倍になるか。",
          "options": [
            "0.03",
            "0.08",
            "0.37",
            "0.95"
          ],
          "answer": 1,
          "explanation": "IPA公式解答例では「0.08」が正解です。",
          "sourceTitle": "©2024 IPA / 出典：令和6年度 秋期 応用情報技術者試験 午前 問10（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_ap_am_qs.pdf"
        },
        {
          "id": "ipa-practice-ap-2024-fall-q11",
          "prompt": "ストレージのインタフェースとして用いられるFC（ファイバチャネル）の特徴として、適切なものはどれか。",
          "options": [
            "TCP/IPの上位層として作られた規格である。",
            "接続形態は、スイッチを用いたn対n接続に限られる。",
            "伝送媒体には電気ケーブル又は光ケーブルを用いることができる。",
            "物理層としてパラレルSCSIを用いることができる。"
          ],
          "answer": 2,
          "explanation": "IPA公式解答例では「伝送媒体には電気ケーブル又は光ケーブルを用いることができる。」が正解です。",
          "sourceTitle": "©2024 IPA / 出典：令和6年度 秋期 応用情報技術者試験 午前 問11（アプリ表示用に改変：改行・表記を調整）",
          "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_ap_am_qs.pdf"
        }
      ]
    }
  ]
};
