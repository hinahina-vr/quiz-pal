/**
 * 保存された教材キャッシュは外部入力。編集画面が出力するテキスト項目だけを採用し、
 * HTML・スクリプトの読込先・表示用の派生フィールドを持ち込ませません。
 * バックアップの検証時と起動時に同じ境界を通し、以前の保存データにも適用します。
 */
(() => {
  const fail = () => { throw new Error("教材キャッシュの形式が正しくありません。"); };
  const text = (value, limit, fallback = "") => {
    if (value === undefined) return fallback;
    if (typeof value !== "string" || value.length > limit) return fail();
    return value;
  };
  const id = value => {
    const result = text(value, 120);
    if (!result || /[\u0000-\u001f\u007f]/.test(result)) return fail();
    return result;
  };
  const list = (value, limit) => {
    if (!Array.isArray(value) || value.length > limit) return fail();
    return value;
  };
  const safeUrl = value => {
    if (!value) return undefined;
    const url = new URL(text(value, 2000));
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return fail();
    return url.href;
  };
  window.quizPalValidateLegacyDataset = value => {
    if (!value || !Array.isArray(value.manifest?.courses)) return fail();
    const courseIds = new Set(), sectionIds = new Set(), questionIds = new Set();
    const unique = (value, ids) => { const key = id(value); if (ids.has(key)) return fail(); ids.add(key); return key; };
    const courses = list(value.courses, 1000).map(course => ({
      id: unique(course.id, courseIds), name: text(course.name, 120),
      accent: /^#[0-9a-f]{6}$/i.test(course.accent) ? course.accent : "#147d73",
      completed: course.completed === true,
      chapters: list(course.chapters, 10000).map((chapter, index) => {
        const questions = list(chapter.questions, 100000).map(question => {
          const options = list(question.options, 6).map(option => text(option, 10000));
          if (!options.length || !Number.isInteger(question.answer) || question.answer < 0 || question.answer >= options.length) return fail();
          return {
            id: unique(question.id, questionIds), prompt: text(question.prompt, 21000), options,
            answer: question.answer, explanation: text(question.explanation, 20000),
            sourceTitle: text(question.sourceTitle, 2000), sourceUrl: safeUrl(question.sourceUrl),
            ...(question.format === "typing" ? { format: "typing", answerText: text(question.answerText, 1000) } : {}),
          };
        });
        return { id: unique(chapter.id, sectionIds), number: index + 1, title: text(chapter.title, 120), sourceQuestionCount: questions.length, questions };
      }),
    }));
    const manifests = courses.map(course => {
      const questionCount = course.chapters.reduce((sum, chapter) => sum + chapter.questions.length, 0);
      return { id: course.id, name: course.name, accent: course.accent, completed: course.completed,
        chapterCount: course.chapters.length, questionCount, visibleQuestionCount: questionCount, asset: "" };
    });
    return { manifest: { generatedFrom: ["Local Quiz Studio"], sampleContentVersion: Number(value.manifest.sampleContentVersion) >= 6 ? 6 : 0,
      chapterCount: manifests.reduce((sum, course) => sum + course.chapterCount, 0), questionsPerChapter: 20,
      totalQuestions: manifests.reduce((sum, course) => sum + course.questionCount, 0), courses: manifests }, courses };
  };
})();

{
  const defaultPayload = {
  "manifest": {
    "generatedFrom": [
      "CC0-1.0 書き下ろし例題",
      "IPA公式公開問題（各問に出典・改変表示）"
    ],
    "sampleContentVersion": 6,
    "chapterCount": 30,
    "questionsPerChapter": 20,
    "totalQuestions": 183,
    "courses": [
      {
        "id": "sample-math",
        "name": "算数の基礎",
        "accent": "#2563eb",
        "chapterCount": 2,
        "questionCount": 6,
        "visibleQuestionCount": 6,
        "asset": "./data/courses/sample-math.js"
      },
      {
        "id": "sample-web-safety",
        "name": "Web安全の基礎",
        "accent": "#0f766e",
        "chapterCount": 2,
        "questionCount": 6,
        "visibleQuestionCount": 6,
        "asset": "./data/courses/sample-web-safety.js"
      },
      {
        "id": "sample-it-passport",
        "name": "ITパスポート",
        "accent": "#7c3aed",
        "chapterCount": 8,
        "questionCount": 46,
        "visibleQuestionCount": 46,
        "asset": "./data/courses/sample-it-passport.js"
      },
      {
        "id": "sample-fe",
        "name": "基本情報技術者",
        "accent": "#0369a1",
        "chapterCount": 8,
        "questionCount": 75,
        "visibleQuestionCount": 75,
        "asset": "./data/courses/sample-fe.js"
      },
      {
        "id": "sample-ap",
        "name": "応用情報技術者",
        "accent": "#b45309",
        "chapterCount": 8,
        "questionCount": 46,
        "visibleQuestionCount": 46,
        "asset": "./data/courses/sample-ap.js"
      },
      {
        "id": "sample-electrician-2",
        "name": "第二種電気工事士",
        "accent": "#b91c1c",
        "chapterCount": 2,
        "questionCount": 4,
        "visibleQuestionCount": 4,
        "asset": "./data/courses/sample-electrician-2.js"
      }
    ]
  },
  "courses": [
    {
      "id": "sample-math",
      "name": "算数の基礎",
      "accent": "#2563eb",
      "chapters": [
        {
          "id": "sample-arithmetic",
          "number": 1,
          "title": "四則演算",
          "sourceQuestionCount": 3,
          "questions": [
            {
              "id": "sample-math-1",
              "prompt": "8 + 4 × 2 の答えはどれですか。",
              "options": [
                "16",
                "24",
                "20",
                "12"
              ],
              "answer": 0,
              "explanation": "掛け算を先に計算するので、8 + 8 = 16 です。",
              "sourceTitle": "CC0 書き下ろし例題"
            },
            {
              "id": "sample-math-2",
              "prompt": "45 ÷ 5 の答えを入力してください。",
              "options": [
                "9"
              ],
              "answer": 0,
              "answerText": "9",
              "format": "typing",
              "explanation": "5を9回足すと45になるため、答えは9です。",
              "sourceTitle": "CC0 書き下ろし例題"
            },
            {
              "id": "sample-math-3",
              "prompt": "7 × 6 = 42 である。",
              "options": [
                "正しい",
                "誤り"
              ],
              "answer": 0,
              "explanation": "7を6回足すと42です。",
              "sourceTitle": "CC0 書き下ろし例題"
            }
          ]
        },
        {
          "id": "sample-ratio",
          "number": 2,
          "title": "割合",
          "sourceQuestionCount": 3,
          "questions": [
            {
              "id": "sample-ratio-1",
              "prompt": "200円の25%はいくらですか。",
              "options": [
                "25円",
                "50円",
                "75円",
                "100円"
              ],
              "answer": 1,
              "explanation": "200 × 0.25 = 50 です。",
              "sourceTitle": "CC0 書き下ろし例題"
            },
            {
              "id": "sample-ratio-2",
              "prompt": "値が50%を表すものをすべて選んでください。\n\nア：1/2\nイ：0.5\nウ：5\nエ：50/100\n\n該当するものをすべて含む組合せを選んでください。",
              "options": [
                "ア・イ・エ",
                "イ・エ",
                "ア・エ",
                "ア・イ・ウ・エ",
                "ア・イ"
              ],
              "answer": 0,
              "explanation": "1/2、0.5、50/100はいずれも同じ割合です。",
              "sourceTitle": "CC0 書き下ろし例題"
            },
            {
              "id": "sample-ratio-3",
              "prompt": "3対2の比で、前の数が12なら後ろの数はいくつですか。",
              "options": [
                "8"
              ],
              "answer": 0,
              "answerText": "8",
              "format": "typing",
              "explanation": "3から12は4倍なので、2も4倍して8です。",
              "sourceTitle": "CC0 書き下ろし例題"
            }
          ]
        }
      ]
    },
    {
      "id": "sample-web-safety",
      "name": "Web安全の基礎",
      "accent": "#0f766e",
      "chapters": [
        {
          "id": "sample-passwords",
          "number": 1,
          "title": "パスワード",
          "sourceQuestionCount": 3,
          "questions": [
            {
              "id": "sample-password-1",
              "prompt": "複数のサービスでパスワードを管理する方法として最も安全なのはどれですか。",
              "options": [
                "すべて同じ短いパスワードにする",
                "サービスごとに異なる長いパスワードを使う",
                "パスワードを公開プロフィールに書く",
                "友人全員と共有する"
              ],
              "answer": 1,
              "explanation": "使い回しを避けると、1件の漏えいが他のサービスへ広がる危険を減らせます。",
              "sourceTitle": "CC0 書き下ろし例題"
            },
            {
              "id": "sample-password-2",
              "prompt": "多要素認証を有効にすると、パスワードだけが漏れた場合の被害を減らせる。",
              "options": [
                "正しい",
                "誤り"
              ],
              "answer": 0,
              "explanation": "異なる種類の確認を組み合わせるため、パスワードだけではログインしにくくなります。",
              "sourceTitle": "CC0 書き下ろし例題"
            },
            {
              "id": "sample-password-3",
              "prompt": "パスワード管理ツールを使うときに適切な行動を選んでください。\n\nア：強いマスターパスワードを使う\nイ：利用可能なら多要素認証を有効にする\nウ：マスターパスワードをSNSへ投稿する\nエ：復旧方法を確認しておく\n\n該当するものをすべて含む組合せを選んでください。",
              "options": [
                "ア・イ・エ",
                "イ・エ",
                "ア・エ",
                "ア・イ・ウ・エ",
                "ア・イ"
              ],
              "answer": 0,
              "explanation": "保護、追加認証、復旧手段の確認を組み合わせます。",
              "sourceTitle": "CC0 書き下ろし例題"
            }
          ]
        },
        {
          "id": "sample-phishing",
          "number": 2,
          "title": "不審なメッセージ",
          "sourceQuestionCount": 3,
          "questions": [
            {
              "id": "sample-phishing-1",
              "prompt": "突然届いた『今すぐログインしないと利用停止』というメッセージへの対応として適切なのはどれですか。",
              "options": [
                "本文のリンクからすぐログインする",
                "返信でパスワードを送る",
                "公式アプリや自分で入力した公式URLから状況を確認する",
                "全員へ転送する"
              ],
              "answer": 2,
              "explanation": "メッセージ中のリンクを避け、既知の正規経路から確認します。",
              "sourceTitle": "CC0 書き下ろし例題"
            },
            {
              "id": "sample-phishing-2",
              "prompt": "送信者名が有名企業なら、本文中のリンクは必ず安全である。",
              "options": [
                "正しい",
                "誤り"
              ],
              "answer": 1,
              "explanation": "表示名は偽装できるため、送信元やURLを別の方法でも確認する必要があります。",
              "sourceTitle": "CC0 書き下ろし例題"
            },
            {
              "id": "sample-phishing-3",
              "prompt": "不審なリンクを開く前に、リンク先の何を確認しますか。漢字2文字で答えてください。",
              "options": [
                "URL"
              ],
              "answer": 0,
              "answerText": "URL",
              "format": "typing",
              "explanation": "リンク先のURLやドメインが正規のものか確認します。",
              "sourceTitle": "CC0 書き下ろし例題"
            }
          ]
        }
      ]
    },
    {
      "id": "sample-it-passport",
      "name": "ITパスポート",
      "accent": "#7c3aed",
      "chapters": [
        {
          "id": "sample-ip-strategy",
          "number": 1,
          "title": "ストラテジとマネジメント",
          "sourceQuestionCount": 2,
          "questions": [
            {
              "id": "sample-ip-1",
              "prompt": "SWOT分析で、組織の内部環境にある好ましい要因に分類されるものはどれですか。",
              "options": [
                "強み",
                "機会",
                "脅威",
                "市場規模"
              ],
              "answer": 0,
              "explanation": "SWOT分析では内部環境を強み・弱み、外部環境を機会・脅威に分類します。",
              "sourceTitle": "CC0 書き下ろし例題"
            },
            {
              "id": "sample-ip-2",
              "prompt": "業務目標の達成度を継続的に測るために設定する重要な評価指標はどれですか。",
              "options": [
                "KPI",
                "NDA",
                "DNS",
                "GUI"
              ],
              "answer": 0,
              "explanation": "KPI（重要業績評価指標）は、目標に向けた業務の進捗や達成度を測る指標です。",
              "sourceTitle": "CC0 書き下ろし例題"
            }
          ]
        },
        {
          "id": "sample-ip-technology",
          "number": 2,
          "title": "テクノロジ",
          "sourceQuestionCount": 2,
          "questions": [
            {
              "id": "sample-ip-3",
              "prompt": "利用者がブラウザからメールや表計算などの完成したアプリケーションを使うクラウドサービス形態はどれですか。",
              "options": [
                "SaaS",
                "IaaS",
                "LAN",
                "BIOS"
              ],
              "answer": 0,
              "explanation": "SaaSは、提供者が運用するアプリケーション機能をネットワーク経由で利用する形態です。",
              "sourceTitle": "CC0 書き下ろし例題"
            },
            {
              "id": "sample-ip-4",
              "prompt": "フィッシング対策として適切な行動をすべて選んでください。\n\nア：メールのリンク先を確認する\nイ：公式サイトをブックマークから開く\nウ：パスワードを返信で送る\nエ：多要素認証を利用する\n\n該当するものをすべて含む組合せを選んでください。",
              "options": [
                "ア・イ・エ",
                "イ・エ",
                "ア・エ",
                "ア・イ・ウ・エ",
                "ア・イ"
              ],
              "answer": 0,
              "explanation": "リンク先の確認、既知の正規経路、多要素認証は被害の予防に役立ちます。認証情報を返信してはいけません。",
              "sourceTitle": "CC0 書き下ろし例題"
            }
          ]
        },
        {
          "id": "ipa-ip-syllabus-strategy",
          "number": 3,
          "title": "ストラテジ系（シラバスVer.6.5）",
          "sourceQuestionCount": 4,
          "questions": [
            {
              "id": "ipa-ip-2026-q1",
              "prompt": "生成AIを用いた生成物の取扱いに関して，既存の著作物の著作権者から許諾を得ることが必要となる可能性のあるものだけを，全て挙げたものはどれか。\n\n- a：好みのアーティストの楽曲に似た音楽が得られるように生成AIを用いて楽曲を生成し，その楽曲をインターネット上にアップロードし，無料で公開した。\n- b：好みのアーティストの楽曲に似た音楽が得られるように生成AIを用いて楽曲を生成し，その楽曲を自分のPC上に保管し，個人で視聴した。\n- c：生成AIで音楽を生成したところ，偶然好みのアーティストの楽曲に似た音楽が生成できたので，自分のPC上に保管し，個人で視聴した。",
              "options": [
                "a",
                "a，b",
                "a，b，c",
                "b，c"
              ],
              "answer": 0,
              "explanation": "公開を伴うaは，既存著作物との類似性・依拠性によって著作権者の許諾が必要となる可能性があります。bとcは設問の条件では個人的な視聴です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問1（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            },
            {
              "id": "ipa-ip-2026-q2",
              "prompt": "BYODに関する記述として，適切なものはどれか。",
              "options": [
                "従業員が私物のスマートフォンなどの端末を会社の許可を得た上で持ち込み，業務で使用する。",
                "ソフトウェアで自動化することによって，定型的な業務を作業者に代わって処理する。",
                "業務プロセスを継続的に分析して改善する。",
                "業務プロセスを根本的に考え直し，抜本的にデザインし直す。"
              ],
              "answer": 0,
              "explanation": "BYODはBring Your Own Deviceの略で，個人所有の端末を許可の下で業務に利用する形態です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問2（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            },
            {
              "id": "ipa-ip-2026-q3",
              "prompt": "A社がマクシミン戦略を採り，かつ，市況が好転した場合の利益はどれか。戦略aの利益は，市況好転時20億円・市況悪化時－15億円，戦略bの利益は，市況好転時5億円・市況悪化時0億円とする。",
              "options": [
                "－15億円",
                "0億円",
                "5億円",
                "20億円"
              ],
              "answer": 2,
              "explanation": "各戦略の最小利益はaが－15億円，bが0億円なので，マクシミン戦略ではbを選びます。市況が好転したときのbの利益は5億円です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問3（アプリ表示用に改変：表をテキスト化）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            },
            {
              "id": "ipa-ip-2026-q4",
              "prompt": "ハッカソンに関する記述として，適切なものはどれか。",
              "options": [
                "企業や組織が，製品やサービスを展示して説明することによって，その効用や価値を広く消費者にアピールするイベント",
                "ソフトウェア開発者や企画者などが，短期間に集中してアイデアを出したり，ソフトウェアなどの成果物を開発したりする共同作業のイベント",
                "テーマに沿って司会者がパネリストに対し質問し，その回答を基に討論を進めるイベント",
                "幅広い分野の専門家を招き，講演や討論を行うイベント"
              ],
              "answer": 1,
              "explanation": "ハッカソンは参加者が短期間に集中的な共同作業を行い，アイデアやソフトウェアなどを形にするイベントです。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問4（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            }
          ]
        },
        {
          "id": "ipa-ip-syllabus-management",
          "number": 4,
          "title": "マネジメント系（シラバスVer.6.5）",
          "sourceQuestionCount": 4,
          "questions": [
            {
              "id": "ipa-ip-2026-q39",
              "prompt": "WBSに関する記述として，適切なものはどれか。",
              "options": [
                "プロジェクトで行う作業のうち，最も長い時間を要する作業の経路を示す。",
                "プロジェクトの主要な成果物の開始日と終了日を予定表に示す。",
                "プロジェクトで成果物を作成するために必要な作業を階層的に分解する。",
                "プロジェクトで使用するツールを体系的に整理する。"
              ],
              "answer": 2,
              "explanation": "WBSは，プロジェクトの成果物と必要な作業を管理可能な単位へ階層的に分解したものです。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問39（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            },
            {
              "id": "ipa-ip-2026-q40",
              "prompt": "内部統制における統制活動の例として，適切なものはどれか。",
              "options": [
                "財務諸表に重要な誤りがあった場合，速やかに社外へ公表する。",
                "伝票の起票者が自ら内容を点検し，最終承認まで行う。",
                "リスクを評価し，全てのリスクに対して回避策を採用する。",
                "社内の全ての報告を直属の上司だけを経由して行う。"
              ],
              "answer": 0,
              "explanation": "適正な財務報告を確保するため，重要な誤りを把握して是正・公表する活動は内部統制の統制活動に該当します。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問40（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            },
            {
              "id": "ipa-ip-2026-q41",
              "prompt": "ITガバナンスにおいて，取締役会がリーダーシップを発揮して実施すべき活動として，適切なものはどれか。",
              "options": [
                "IT部門の個々の担当者の日常業務を直接指揮する。",
                "個別システムのプログラム仕様を決定する。",
                "ITの利活用によって生じるリスクを把握し，受容可能な水準に管理する。",
                "全てのIT投資案件の開発作業を取締役が担当する。"
              ],
              "answer": 2,
              "explanation": "ITガバナンスでは，経営陣がITの利活用を評価・指示・モニタリングし，リスクを適切な水準へ管理します。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問41（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            },
            {
              "id": "ipa-ip-2026-q42",
              "prompt": "サービスデスクの業務として，適切なものはどれか。",
              "options": [
                "システムの受入れテスト段階で発見された不具合に対応する。",
                "システム稼働後に利用者から寄せられる問合せに対応する。",
                "プログラム開発者からの技術的な質問だけに対応する。",
                "要件定義で利用者の要求を収集する。"
              ],
              "answer": 1,
              "explanation": "サービスデスクは利用者との単一窓口として，問合せやインシデントなどを受け付けて対応します。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問42（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            }
          ]
        },
        {
          "id": "ipa-ip-syllabus-technology",
          "number": 5,
          "title": "テクノロジ系（シラバスVer.6.5）",
          "sourceQuestionCount": 4,
          "questions": [
            {
              "id": "ipa-ip-2026-q60",
              "prompt": "レスポンシブWebデザインに関する記述として，適切なものはどれか。",
              "options": [
                "PC，スマートフォンなど，多くの種類の端末で，見やすく，かつ操作しやすくなるように，表示する端末の画面サイズなどに応じてWebサイトの画面レイアウトが変化する。",
                "動画をストリーミング再生するとき，複数の配信サーバのうち利用者に適したサーバに接続させる。",
                "端末に内蔵された加速度センサーやジャイロセンサーのデータを使用する。",
                "マウスポインタをWebコンテンツに重ねたとき，ポップアップで機能の説明などを表示する。"
              ],
              "answer": 0,
              "explanation": "レスポンシブWebデザインは，画面サイズなどに応じてレイアウトを調整し，多様な端末での見やすさと操作性を保つ設計です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問60（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            },
            {
              "id": "ipa-ip-2026-q61",
              "prompt": "PCの画面表示に必要なデータを保持するのに使われる，画面表示専用メモリはどれか。",
              "options": [
                "EEPROM",
                "VRAM",
                "キャッシュメモリ",
                "フラッシュメモリ"
              ],
              "answer": 1,
              "explanation": "VRAMは画面に表示する画像データを保持するためのビデオメモリです。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問61（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            },
            {
              "id": "ipa-ip-2026-q62",
              "prompt": "システムの性能評価におけるベンチマークテストに関する記述として，適切なものはどれか。",
              "options": [
                "評価対象で使われるものと同じデータ，同じプログラムを，ほかの疑似システム上で実行させる。",
                "評価対象の動作特性をモデル化したものを，ほかの疑似システム上で実行させる。",
                "プログラムステップ数，ハードウェア性能，I/O回数の机上計算値から処理時間を積算する。",
                "標準的な処理を設定した評価用プログラムを，評価対象のシステム上で実際に実行させる。"
              ],
              "answer": 3,
              "explanation": "ベンチマークテストは，標準化した処理やプログラムを実機で動かし，結果を比較して性能を評価します。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問62（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            },
            {
              "id": "ipa-ip-2026-q63",
              "prompt": "PCに保存されたファイルを使用できなくするランサムウェアによる被害を低減させるための対策として，適切なものはどれか。",
              "options": [
                "UPSの導入",
                "データの暗号化",
                "データのバックアップ",
                "ログインパスワードの変更"
              ],
              "answer": 2,
              "explanation": "端末から切り離した世代管理付きバックアップがあれば，暗号化・破壊されたデータを復元でき，被害を低減できます。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問63（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            }
          ]
        },
        {
          "id": "ipa-practice-ip-2026",
          "number": 6,
          "title": "令和8年度 公開問題 実践10問",
          "sourceQuestionCount": 10,
          "questions": [
            {
              "id": "ipa-practice-ip-2026-q1",
              "prompt": "生成AIを用いた生成物の取扱いに関して、既存の著作物の著作権者から許諾を得ることが必要となる可能性のあるものだけを、全て挙げたものはどれか。\n\n- a：好みのアーティストの楽曲に似た音楽が得られるように生成AIを用いて楽曲を生成し、その楽曲をインターネット上にアップロードし、無料で公開した。\n- b：好みのアーティストの楽曲に似た音楽が得られるように生成AIを用いて楽曲を生成し、その楽曲を自分のPC上に保管し、個人で視聴した。\n- c：生成AIで音楽を生成したところ、偶然好みのアーティストの楽曲に似た音楽が生成できたので、自分のPC上に保管し、個人で視聴した。",
              "options": [
                "aだけ",
                "a、b",
                "a、b、c",
                "b、c"
              ],
              "answer": 0,
              "explanation": "IPA公式解答例では「aだけ」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問1（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2026r08_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2026-q2",
              "prompt": "BYODに関する記述として、適切なものはどれか。",
              "options": [
                "企業の業務に、従業員が私物の携帯情報端末を許可を得た上で利用すること",
                "企業の業務の定型的な作業をソフトウェアのロボットで効率化すること",
                "企業の業務の流れを分析し、継続的に改善、最適化していくこと",
                "企業の業務の流れを見直し、抜本的にデザインし直すこと"
              ],
              "answer": 0,
              "explanation": "IPA公式解答例では「企業の業務に、従業員が私物の携帯情報端末を許可を得た上で利用すること」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問2（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2026r08_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2026-q3",
              "prompt": "投資会社であるA社が、それぞれの投資戦略を採る場合の利益は次のように予想される。A社がマクシミン戦略を採り、かつ、市況が好転した場合の利益はどれか。マクシミン戦略とは、戦略ごとに予想される利益の最小値が最も大きくなるように戦略を採用する理論である。\n\n- 投資戦略a：市況好転時20億円、市況悪化時-15億円\n- 投資戦略b：市況好転時5億円、市況悪化時0億円",
              "options": [
                "-15億円",
                "0億円",
                "5億円（利益）",
                "20億円"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「5億円（利益）」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問3（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2026r08_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2026-q4",
              "prompt": "特定の目的の達成や課題の解決をテーマとして、ソフトウェアの開発者や企画者などが短期集中的にアイデアを出し合い、ソフトウェアの開発などの共同作業を行い、成果を競い合うイベントはどれか。",
              "options": [
                "トレードフェア",
                "ハッカソン",
                "パネルディスカッション",
                "レセプション"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「ハッカソン」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問4（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2026r08_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2026-q5",
              "prompt": "インターネットを利用した企業広告に関する新たなビジネスモデルを知的財産として出願し、コンピュータシステムとして実現した。このビジネスモデルを知的財産として保護する法律はどれか。",
              "options": [
                "意匠法",
                "実用新案法",
                "著作権法",
                "特許法"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「特許法」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問5（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2026r08_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2026-q6",
              "prompt": "デジタルトランスフォーメーションに関する説明として、最も適切なものはどれか。",
              "options": [
                "PCやスマートフォンなどのデジタル製品を使いこなせる人と、使いこなせない人の間で様々な機会に差が生じて、社会的な格差につながること",
                "生まれた時からインターネット、PCやスマートフォンなどのデジタル製品が身近にあり、それらを利用しながら育った世代のこと",
                "音声を収集するマイクロフォンなどからのアナログ信号を、電子ファイルとして保存するためにデジタル信号に変換すること",
                "デジタル技術が、人間の生活やビジネスなどのあらゆる面に影響を与え、変革をもたらしていくこと"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「デジタル技術が、人間の生活やビジネスなどのあらゆる面に影響を与え、変革をもたらしていくこと」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問6（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2026r08_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2026-q7",
              "prompt": "製品やサービスの価値を機能とコストの関係で把握し、価値の向上を図るバリューエンジニアリングという手法がある。バリューエンジニアリングにおける価値、機能、コストの関係性を示すものとして、適切なものはどれか。",
              "options": [
                "価値 = 機能 /（コスト + 機能）",
                "価値 = 機能 / コスト",
                "価値 = 機能 × コスト",
                "価値 = コスト / 機能"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「価値 = 機能 / コスト」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問7（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2026r08_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2026-q8",
              "prompt": "IoTを利用したシステムの事例として、最も適切なものはどれか。",
              "options": [
                "資金調達において、不特定多数の借り手と貸し手をインターネット上で仲介するサービスを行う。",
                "ソーシャルメディアへの書込みや、コールセンターの通話内容などから、商品やサービスに対する利用者の感情を分析する。",
                "店舗や工場などの設備に設置したセンサーの情報をインターネット経由で集め、設備の状況について、従業員がスマートフォンを用いて監視する。",
                "文書や画像などの電子ファイルを保存するためのインターネット上のストレージを、サービスとして提供する。"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「店舗や工場などの設備に設置したセンサーの情報をインターネット経由で集め、設備の状況について、従業員がスマートフォンを用いて監視する。」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問8（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2026r08_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2026-q9",
              "prompt": "製品の製造に関連して発生する次の費用のうち、間接費だけを全て挙げたものはどれか。\n\n- a：完成した製品を検査する労務費\n- b：工場の電気供給設備を保守する労務費\n- c：製品の外注加工費",
              "options": [
                "a、b",
                "bだけ",
                "b、c",
                "c"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「bだけ」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問9（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2026r08_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2026-q10",
              "prompt": "会議に関する記述のうち、ブレーンストーミングの進め方として、適切なものだけを全て挙げたものはどれか。\n\n- a：自由奔放なアイデアは控え、実現可能なアイデアの提出を求める。\n- b：ほかのメンバーのアイデアに便乗した案であっても、とがめずに進める。\n- c：メンバーから出されるアイデアの中で、テーマに適したものを選択しながら進める。",
              "options": [
                "aだけ",
                "a、b",
                "a、b、c",
                "bだけ"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「bだけ」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 ITパスポート試験 公開問題 問10（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2026r08_ip_qs.pdf"
            }
          ]
        },
        {
          "id": "ipa-practice-ip-2025",
          "number": 7,
          "title": "令和7年度 公開問題 実践10問",
          "sourceQuestionCount": 10,
          "questions": [
            {
              "id": "ipa-practice-ip-2025-q1",
              "prompt": "A社がB社に作業の一部を請負契約で委託している。作業形態a〜cのうち、いわゆる偽装請負とみなされる状態だけを全て挙げたものはどれか。\n\n- a：B社の従業員が、A社内において、A社の責任者の指揮命令の下で、請負契約で取り決めた作業を行っている。\n- b：B社の従業員が、A社内において、B社の責任者の指揮命令の下で、請負契約で取り決めた作業を行っている。\n- c：B社の従業員が、B社内において、A社の責任者の指揮命令の下で、請負契約で取り決めた作業を行っている。",
              "options": [
                "a",
                "a、b",
                "a、c",
                "b、c"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「a、c」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 ITパスポート試験 公開問題 問1（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2025r07_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2025-q2",
              "prompt": "従来の情報セキュリティマネジメントシステム規格を基礎に追加で制定されたもので、クラウドサービスに対応した情報セキュリティ管理体制を構築するためのガイドライン規格として、最も適切なものはどれか。",
              "options": [
                "ISO 14001",
                "JIS Q 15001",
                "ISO/IEC 27017",
                "ISO 9001"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「ISO/IEC 27017」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 ITパスポート試験 公開問題 問2（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2025r07_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2025-q3",
              "prompt": "政府は、官民データ活用推進基本法に定められた官民データ活用推進基本計画を策定し、官民データの公開や活用の促進に取り組んでいる。次の組織体のうち、官民データを所有しているものだけを全て挙げたものはどれか。\n\n- a：県庁\n- b：大学\n- c：電力事業者\n- d：独立行政法人",
              "options": [
                "a、b、c",
                "a、b、c、d",
                "a、b、d",
                "a、c、d"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「a、b、c、d」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 ITパスポート試験 公開問題 問3（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2025r07_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2025-q4",
              "prompt": "投資の優先度などの経営の戦略を策定するために、経済価値、希少性、模倣困難性及び組織の四つの要素で評価することによって、自社のもつ資源を分析する手法として、最も適切なものはどれか。",
              "options": [
                "4P",
                "PPM",
                "SWOT分析",
                "VRIO分析"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「VRIO分析」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 ITパスポート試験 公開問題 問4（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2025r07_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2025-q5",
              "prompt": "A社ではB商品の仕入れと販売を行っている。ある期のB商品の仕入単価は期首から上昇し続け、期末が最も高くなった。当該期の売上原価を「期首棚卸高 + 当期商品仕入高 - 期末棚卸高」で計算するとき、期末棚卸高の計算に期末の仕入単価を用いると、B商品の期末棚卸高及び売上原価は、期中の仕入単価の平均値を用いる場合に比べてどのようになるか。",
              "options": [
                "期末棚卸高、売上原価ともに上がる。",
                "期末棚卸高、売上原価ともに変わらない。",
                "期末棚卸高は上がり、売上原価は下がる。",
                "期末棚卸高は下がり、売上原価は上がる。"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「期末棚卸高は上がり、売上原価は下がる。」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 ITパスポート試験 公開問題 問5（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2025r07_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2025-q6",
              "prompt": "特定電子メール法は、電子メールによる一方的な広告宣伝メールの送信を規制する法律である。企業担当者が行った次の電子メールの送信事例のうち、特定電子メール法の規制対象となり得るものはどれか。",
              "options": [
                "広告宣伝メールの受信を拒否する旨の意思表示がないことを確認した後、公表されている企業のメールアドレス宛てに広告宣伝メールを送信した。",
                "受信者から拒否通知があった場合には、それ以降の送信を禁止すればよいと考え、広告宣伝メールを送信した。",
                "内容は事務連絡と料金請求なので問題ないと考え、受信者本人の同意なくメールを送信した。",
                "長年の取引関係にある企業担当者に対して、これまで納入してきた製品の新バージョンが完成したので、その製品に関する広告宣伝メールを送信した。"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「受信者から拒否通知があった場合には、それ以降の送信を禁止すればよいと考え、広告宣伝メールを送信した。」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 ITパスポート試験 公開問題 問6（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2025r07_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2025-q7",
              "prompt": "新しい概念やアイデアの実証を目的とした、開発の前段階における検証を表す用語はどれか。",
              "options": [
                "CRM",
                "PoC",
                "RAS",
                "SLA"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「PoC」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 ITパスポート試験 公開問題 問7（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2025r07_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2025-q8",
              "prompt": "AIの機械学習で利用するデータの取扱いに関する記述のうち、バイアスの低減やデータの品質を確保するために考えられる対策として、適切なものだけを全て挙げたものはどれか。\n\n- a：学習の目的に適したデータであることを確認する。\n- b：データの入手元・作成来歴を確認する。\n- c：データへのアノテーションの付与は学習目的に合わせて実施する。\n- d：人間の目でも同定が困難と考えられる画像認識用のデータは除外する。",
              "options": [
                "a、b",
                "a、b、c、d",
                "a、d",
                "b、c、d"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「a、b、c、d」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 ITパスポート試験 公開問題 問8（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2025r07_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2025-q9",
              "prompt": "ハッカソンに関する記述として、最も適切なものはどれか。",
              "options": [
                "定められたルールの下、ある主題について、肯定派と否定派といった異なる立場に分かれて議論する。",
                "情報セキュリティ分野で活躍したいという意志をもった若者が、合宿形式で情報セキュリティに関する実践的な知識を学ぶ。",
                "プログラマーやデザイナーなどから成る複数の参加チームが、与えられたテーマに関するプロトタイプを短期間で作成し、その成果を発表して競い合う。",
                "問題解決や利用者獲得などゲーム的な要素のない分野に、デジタル技術を活用したゲームの要素を取り入れることによって、利用者の参加を動機づける。"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「プログラマーやデザイナーなどから成る複数の参加チームが、与えられたテーマに関するプロトタイプを短期間で作成し、その成果を発表して競い合う。」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 ITパスポート試験 公開問題 問9（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2025r07_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2025-q10",
              "prompt": "生成AIにおいて、もっともらしいが事実とは異なる内容が出力されることを表す用語として、最も適切なものはどれか。",
              "options": [
                "エコーチェンバー",
                "シンギュラリティ",
                "ディープフェイク",
                "ハルシネーション"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「ハルシネーション」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 ITパスポート試験 公開問題 問10（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2025r07_ip_qs.pdf"
            }
          ]
        },
        {
          "id": "ipa-practice-ip-2024",
          "number": 8,
          "title": "令和6年度 公開問題 実践10問",
          "sourceQuestionCount": 10,
          "questions": [
            {
              "id": "ipa-practice-ip-2024-q1",
              "prompt": "マーケティングオートメーション（MA）に関する記述として、最も適切なものはどれか。",
              "options": [
                "企業内に蓄積された大量のデータを分析して、事業戦略などに有効活用する。",
                "小売業やサービス業において、販売した商品単位の情報の収集・蓄積及び分析を行う。",
                "これまで人間が手作業で行っていた定型業務を、AIや機械学習などを取り入れたソフトウェアのロボットが代行することによって自動化や効率化を図る。",
                "見込み顧客の抽出、獲得、育成などの営業活動を効率化する。"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「見込み顧客の抽出、獲得、育成などの営業活動を効率化する。」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 ITパスポート試験 公開問題 問1（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2024r06_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2024-q2",
              "prompt": "情報システムに不正に侵入し、サービスを停止させて社会的混乱を生じさせるような行為に対して、国全体で体系的に防御施策を講じるための基本理念を定め、国の責務などを明らかにした法律はどれか。",
              "options": [
                "公益通報者保護法",
                "サイバーセキュリティ基本法",
                "不正アクセス禁止法",
                "プロバイダ責任制限法"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「サイバーセキュリティ基本法」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 ITパスポート試験 公開問題 問2（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2024r06_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2024-q3",
              "prompt": "未来のある時点に目標を設定し、そこを起点に現在を振り返り、目標実現のために現在すべきことを考える方法を表す用語として、最も適切なものはどれか。",
              "options": [
                "PoC（Proof of Concept）",
                "PoV（Proof of Value）",
                "バックキャスティング",
                "フォアキャスティング"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「バックキャスティング」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 ITパスポート試験 公開問題 問3（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2024r06_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2024-q4",
              "prompt": "従来の金融情報システムは堅ろう性が高い一方、柔軟性に欠け、モバイル技術などの情報革新に追従したサービスの迅速な提供が難しかった。これを踏まえて、インターネット関連技術の取込みやそれらを活用するベンチャー企業と組むなどして、新たな価値や革新的なサービスを提供していく潮流を表す用語として、最も適切なものはどれか。",
              "options": [
                "オムニチャネル",
                "フィンテック",
                "ブロックチェーン",
                "ワントゥワンマーケティング"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「フィンテック」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 ITパスポート試験 公開問題 問4（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2024r06_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2024-q5",
              "prompt": "ベンチャーキャピタルに関する記述として、最も適切なものはどれか。",
              "options": [
                "新しい技術の獲得や、規模の経済性の追求などを目的に、他の企業と共同出資会社を設立する手法",
                "株式売却による利益獲得などを目的に、新しい製品やサービスを武器に市場に参入しようとする企業に対して出資などを行う企業",
                "新サービスや技術革新などの創出を目的に、国や学術機関、他の企業など外部の組織と共創関係を結び、積極的に技術や資源を交換し、自社に取り込む手法",
                "特定された課題の解決を目的に、一定の期間を定めて企業内に立ち上げられ、構成員を関連部門から招集し、目的が達成された時点で解散する組織"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「株式売却による利益獲得などを目的に、新しい製品やサービスを武器に市場に参入しようとする企業に対して出資などを行う企業」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 ITパスポート試験 公開問題 問5（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2024r06_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2024-q6",
              "prompt": "技術戦略の策定や技術開発の推進といった技術経営に直接の責任をもつ役職はどれか。",
              "options": [
                "CEO",
                "CFO",
                "COO",
                "CTO"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「CTO」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 ITパスポート試験 公開問題 問6（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2024r06_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2024-q7",
              "prompt": "システム開発の上流工程において、業務プロセスのモデリングを行う目的として、最も適切なものはどれか。",
              "options": [
                "業務プロセスで取り扱う大量のデータを、統計的手法やAI手法などを用いて分析し、データ間の相関関係や隠れたパターンなどを見いだすため",
                "業務プロセスを可視化することによって、適切なシステム設計のベースとなる情報を整備し、関係者間で解釈を共有できるようにするため",
                "個々の従業員がもっている業務に関する知識・経験やノウハウを社内全体で共有し、創造的なアイデアを生み出すため",
                "プロジェクトに必要な要員を調達し、チームとして組織化して、プロジェクトの目的の達成に向けて一致団結させるため"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「業務プロセスを可視化することによって、適切なシステム設計のベースとなる情報を整備し、関係者間で解釈を共有できるようにするため」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 ITパスポート試験 公開問題 問7（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2024r06_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2024-q8",
              "prompt": "次はA社の期末の損益計算書から抜粋した資料である。当期純利益が800百万円であるとき、販売費及び一般管理費は何百万円か。\n\n- 売上高：8,000百万円\n- 売上原価：6,000百万円\n- 営業外収益：150百万円\n- 営業外費用：50百万円\n- 特別利益：60百万円\n- 特別損失：10百万円\n- 法人税等：350百万円",
              "options": [
                "850",
                "900",
                "1,000",
                "1,200"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「1,000」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 ITパスポート試験 公開問題 問8（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2024r06_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2024-q9",
              "prompt": "企業の戦略立案やマーケティングなどで使用されるフェルミ推定に関する記述として、最も適切なものはどれか。",
              "options": [
                "正確に算出することが極めて難しい数量に対して、把握している情報と論理的な思考プロセスによって概数を求める手法である。",
                "特定の集団と活動を共にしたり、人々の動きを観察したりすることによって、慣習や嗜好、地域や組織を取り巻く文化を類推する手法である。",
                "入力データと出力データから、その因果関係を統計的に推定する手法である。",
                "有識者のグループに繰り返し同一のアンケート調査とその結果のフィードバックを行うことによって、ある分野の将来予測に関する総意を得る手法である。"
              ],
              "answer": 0,
              "explanation": "IPA公式解答例では「正確に算出することが極めて難しい数量に対して、把握している情報と論理的な思考プロセスによって概数を求める手法である。」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 ITパスポート試験 公開問題 問9（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2024r06_ip_qs.pdf"
            },
            {
              "id": "ipa-practice-ip-2024-q10",
              "prompt": "不正競争防止法で規定されている限定提供データに関する記述として、最も適切なものはどれか。",
              "options": [
                "特定の第三者に対し、1回に限定して提供する前提で保管されている技術上又は営業上の情報は限定提供データである。",
                "特定の第三者に提供する情報として電磁的方法によって相当量蓄積され管理されている技術上又は営業上の情報（秘密として管理されているものを除く）は限定提供データである。",
                "特定の第三者に提供するために、金庫などで物理的に管理されている技術上又は営業上の情報は限定提供データである。",
                "不正競争防止法に定めのある営業秘密は限定提供データである。"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「特定の第三者に提供する情報として電磁的方法によって相当量蓄積され管理されている技術上又は営業上の情報（秘密として管理されているものを除く）は限定提供データである。」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 ITパスポート試験 公開問題 問10（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2024r06_ip_qs.pdf"
            }
          ]
        }
      ]
    },
    {
      "id": "sample-fe",
      "name": "基本情報技術者",
      "accent": "#0369a1",
      "chapters": [
        {
          "id": "sample-fe-computer",
          "number": 1,
          "title": "コンピュータとアルゴリズム",
          "sourceQuestionCount": 3,
          "questions": [
            {
              "id": "sample-fe-1",
              "prompt": "2進数 101101 を10進数で表した値はどれですか。",
              "options": [
                "43",
                "44",
                "45",
                "46"
              ],
              "answer": 2,
              "explanation": "32 + 8 + 4 + 1 = 45 です。",
              "sourceTitle": "CC0 書き下ろし例題"
            },
            {
              "id": "sample-fe-2",
              "prompt": "データを追加した順序とは逆の順序で取り出すデータ構造はどれですか。",
              "options": [
                "キュー",
                "スタック",
                "ハッシュ表",
                "二分木"
              ],
              "answer": 1,
              "explanation": "スタックは後入れ先出し（LIFO）のデータ構造です。",
              "sourceTitle": "CC0 書き下ろし例題"
            },
            {
              "id": "sample-fe-3",
              "prompt": "要素数を n とするとき、一般的なマージソートの時間計算量は O(n log n) である。",
              "options": [
                "正しい",
                "誤り"
              ],
              "answer": 0,
              "explanation": "マージソートは分割と併合を繰り返し、平均・最悪とも一般に O(n log n) です。",
              "sourceTitle": "CC0 書き下ろし例題"
            }
          ]
        },
        {
          "id": "sample-fe-database",
          "number": 2,
          "title": "データベース",
          "sourceQuestionCount": 1,
          "questions": [
            {
              "id": "sample-fe-4",
              "prompt": "関係データベースの主キーに求められる性質として最も適切なものはどれですか。",
              "options": [
                "行ごとに値が一意である",
                "必ず文字列型である",
                "同じ値を複数行で共有する",
                "検索に利用できない"
              ],
              "answer": 0,
              "explanation": "主キーは表の各行を一意に識別し、NULLを取りません。",
              "sourceTitle": "CC0 書き下ろし例題"
            }
          ]
        },
        {
          "id": "ipa-fe-syllabus-strategy",
          "number": 3,
          "title": "ストラテジ系（シラバスVer.9.2）",
          "sourceQuestionCount": 4,
          "questions": [
            {
              "id": "ipa-fe-2026-q16",
              "prompt": "小売事業者が，オムニチャネル戦略を実現するためのIT活用事例はどれか。",
              "options": [
                "実店舗，オンライン店舗，コールセンタなど複数の顧客接点で，顧客情報や在庫情報などを一元的に管理・共有して接客することによって，顧客の利便性を高める。",
                "複数店舗からネットワークを経由して，受発注，出荷，請求，支払などの取引情報を電子的に交換することによって，卸売業者とメーカとの間の受発注業務の効率を高める。",
                "複数店舗に設置した監視カメラの画像データを本部に集め，本部が各店舗の状況をリアルタイムに把握することによって，店舗運営業務の効率を高める。",
                "複数店舗のPOSデータを本部に集め，本部が日次で売れ筋商品の抽出，複数の商品の併売率の分析を行うことによって，商品計画や棚割計画を最適化する。"
              ],
              "answer": 0,
              "explanation": "オムニチャネルは実店舗やECなど複数チャネルを統合し，一貫した顧客体験と利便性を提供します。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問16（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            },
            {
              "id": "ipa-fe-2026-q17",
              "prompt": "サービスA～Dの中で会員のリテンション率が最も高いものはどれか。リテンションの対象は前月末から当月末まで継続して在籍した会員とし，当月新規会員は月末までの退会はないものとする。前月末会員数／当月新規会員数／当月末会員数は，A：1,000／500／800，B：1,000／200／800，C：1,500／500／1,100，D：1,500／1,000／1,800である。",
              "options": [
                "サービスA",
                "サービスB",
                "サービスC",
                "サービスD"
              ],
              "answer": 1,
              "explanation": "継続会員は当月末会員数から新規会員数を引いて求めます。前月末会員数で割るとA 30%，B 60%，C 40%，D 約53.3%で，Bが最大です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問17（アプリ表示用に改変：表をテキスト化）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            },
            {
              "id": "ipa-fe-2026-q18",
              "prompt": "AIの事例として，適切でないものはどれか。",
              "options": [
                "制御量を目標値側へフィードバックすることによって両者を比較し，その差によって両者を一致させるような修正動作を行うPID制御のモーターコントローラー",
                "部屋の広さや形，家具の位置などを学習し，移動のルートを決めて掃除をするロボット",
                "ヘルプデスク及びコールセンターに代わって，自然言語による質問の意味を推測して返事をするチャットボット",
                "ボードゲームでプロの人間に勝つような，多数の統計データを処理することによって人間に勝るソフトウェア"
              ],
              "answer": 0,
              "explanation": "PID制御は偏差に基づく古典制御であり，この設問ではAIの事例には該当しません。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問18（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            },
            {
              "id": "ipa-fe-2026-q19",
              "prompt": "ブレーンストーミングの説明はどれか。",
              "options": [
                "あるテーマの検討において，複数のメンバーで，各自が思いつくままに自由奔放にできるだけ多くのアイデアを出し合うことによって，創造的思考を喚起し，アイデアを開発しようとする会議方法",
                "研修を始める前に行う簡単なゲームや，商談や面接の本題に入る前に行う雑談など，参加者の緊張をほぐすためのコミュニケーション方法",
                "情報を，決められた枠組みに従って整理・分析するスキルや方法を利用し，複雑なものごとを明快に把握したり，問題に対する解決策を導き出したりするような思考方法",
                "ポイントを繰り返したり，言い換えたりすることによって，お互いの理解する意味合いが一致していることを確認したり，意見・評価を伝えたりする方法"
              ],
              "answer": 0,
              "explanation": "ブレーンストーミングでは批判を避け，自由奔放に多数のアイデアを出し，結合・発展させます。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問19（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            }
          ]
        },
        {
          "id": "ipa-fe-syllabus-management",
          "number": 4,
          "title": "マネジメント系（シラバスVer.9.2）",
          "sourceQuestionCount": 4,
          "questions": [
            {
              "id": "ipa-fe-2026-q11",
              "prompt": "あるシステムにおいて，“プログラムの記述方法が統一されていないので保守がしづらい”という問題が発生している。今後の新規開発プロジェクトにおけるこの問題の低減策として，最も適切なものはどれか。",
              "options": [
                "コーディング規約を見直し，教育する。",
                "セキュアプログラミングを採用する。",
                "単体テストでの命令網羅度を上げる。",
                "プロジェクト管理レビューに全プログラマーが参加する。"
              ],
              "answer": 0,
              "explanation": "記述方法の不統一には，明確なコーディング規約を整備し，開発者へ教育して適用を徹底する対策が直接有効です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問11（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            },
            {
              "id": "ipa-fe-2026-q12",
              "prompt": "バーンダウンチャートの使い方として，適切なものはどれか。",
              "options": [
                "縦軸を完成した成果物の総量，横軸を時間とし，プロジェクトが進むに従って完成した成果物の総量が増加する様子を確認する。",
                "縦軸を残課題の総数，横軸を時間とし，プロジェクトが進むに従って残課題の総量が増減する様子を確認する。",
                "縦軸を残作業の量，横軸を時間とし，プロジェクトが進むに従って残作業の量が減少する様子を確認する。",
                "縦軸を延べ工数，横軸を時間とし，プロジェクトが進むに従って延べ工数が増加する様子を確認する。"
              ],
              "answer": 2,
              "explanation": "バーンダウンチャートは横軸に時間，縦軸に残作業量をとり，完了へ向けた減少を可視化します。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問12（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            },
            {
              "id": "ipa-fe-2026-q13",
              "prompt": "あるシステム開発プロジェクトの進捗が遅延したので，クリティカルパス上の作業への投入工数を増やすことによって遅延の解消を図った。このとき適用した，所要期間を短縮するための手法を何と呼ぶか。",
              "options": [
                "クラッシング",
                "コーチング",
                "ファストトラッキング",
                "メンタリング"
              ],
              "answer": 0,
              "explanation": "クラッシングはクリティカルパス上の作業へ資源を追加し，コストを増やして所要期間を短縮する手法です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問13（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            },
            {
              "id": "ipa-fe-2026-q14",
              "prompt": "A社は，自社のデータセンタでアプリケーションシステムを運用し，顧客にサービスを提供している。現在，実行環境をクラウドサービスに移行して，サービス可用性を向上させることを検討している。サービス提供時間は移行前後とも年間5,000時間，移行前の停止時間は年間100時間，移行後は年間30分である。サービス可用性（%）は小数第3位を切り捨てるとき，移行後に何パーセントポイント向上するか。",
              "options": [
                "0.01",
                "0.19",
                "1.40",
                "1.99"
              ],
              "answer": 3,
              "explanation": "移行前は98.00%，移行後は99.99%なので，向上幅は1.99パーセントポイントです。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問14（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            }
          ]
        },
        {
          "id": "ipa-fe-syllabus-technology",
          "number": 5,
          "title": "テクノロジ系（シラバスVer.9.2）",
          "sourceQuestionCount": 4,
          "questions": [
            {
              "id": "ipa-fe-2026-q1",
              "prompt": "入力されたビットに対して出力されるビットが0か1のいずれかである確率を遷移確率という。遷移確率を表にしたとき，入力0に対する出力0，1の確率をそれぞれa，b，入力1に対する出力0，1の確率をそれぞれc，dとする。a，b，c，dの関係はどれか。",
              "options": [
                "a＋b＋c＋d＝1",
                "a＋b＝1，c＋d＝1",
                "a＋c＝1，b＋d＝1",
                "a＋d＝1，b＋c＝1"
              ],
              "answer": 1,
              "explanation": "同じ入力に対する出力0と出力1は排反で全事象を構成するので，それぞれの確率の和は1です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問1（アプリ表示用に改変：表をテキスト化）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            },
            {
              "id": "ipa-fe-2026-q2",
              "prompt": "クイックソートの処理方法を説明したものはどれか。",
              "options": [
                "既に整列済みのデータ列の正しい位置に，データを追加する操作を繰り返していく方法である。",
                "データ中の最小値を求め，次にそれを除いた部分の中から最小値を求める。この操作を繰り返していく方法である。",
                "適当な基準値を選び，それよりも小さな値のグループと大きな値のグループにデータを分割する。同様にして，グループの中で基準値を選び，それぞれのグループを分割する。この操作を繰り返していく方法である。",
                "隣り合ったデータの比較と入替えを繰り返すことによって，小さな値のデータを次第に端の方に移していく方法である。"
              ],
              "answer": 2,
              "explanation": "クイックソートは基準値（ピボット）で大小のグループに分割し，各グループへ同じ処理を再帰的に適用します。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問2（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            },
            {
              "id": "ipa-fe-2026-q3",
              "prompt": "プロセッサの一つであるGPUの特徴として，適切なものはどれか。",
              "options": [
                "OS及び他のハードウェアから独立して機能し，暗号キーなどの情報を安全に管理する。",
                "並列に動作する多数の浮動小数点演算ユニットによって，高速な3D演算ができる。",
                "目的に応じて半導体デバイス内部の論理回路を再構成できる。",
                "量子ビットによって0と1を重ね合わせた状態を計算に使うことができる。"
              ],
              "answer": 1,
              "explanation": "GPUは多数の演算ユニットによる並列処理を得意とし，画像処理や3D演算などを高速に実行します。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問3（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            },
            {
              "id": "ipa-fe-2026-q4",
              "prompt": "クラウドコンピューティングのサービスモデルとしてのPaaSの説明はどれか。",
              "options": [
                "OSやアプリケーションを含む任意のソフトウェアを実行可能にするリソースが利用者に提供される。OSなどのプラットフォームへの限定的な設定や制御を行うことができる。",
                "アプリケーションの開発や運用に必要となるミドルウェアなどが利用者に提供されるので，これらを利用して，アプリケーションを開発して運用することができる。利用者は，プラットフォームを直接変更することはできない。",
                "利用者は，ハードウェア，OSなどのプラットフォームとアプリケーションを自ら準備して，それらの運用を依頼する。利用者は，プラットフォームの構成を決めることができるなど，環境構築の自由度が高い。",
                "利用者は，用意されたアプリケーションをそのまま又はカスタマイズして利用するが，OSなどのプラットフォームからアプリケーションまで全てを自ら準備する必要はない。利用者は，プラットフォームを直接変更することはできない。"
              ],
              "answer": 1,
              "explanation": "PaaSはアプリケーションの開発・実行に必要なプラットフォームをサービスとして提供します。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問4（アプリ表示用に一部改変）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html"
            }
          ]
        },
        {
          "id": "ipa-practice-fe-2026",
          "number": 6,
          "title": "令和8年度 科目A 公開問題 実践19問",
          "sourceQuestionCount": 19,
          "questions": [
            {
              "id": "ipa-practice-fe-2026-q1",
              "prompt": "入力されたビットに対して出力されるビットが0か1のいずれかである確率を遷移 確率という。遷移確率を表にしたとき，a，b，c，dの関係はどれか。 出力 0 1 入力 0 a b 1 c d",
              "options": [
                "a ＋b ＋c ＋ d ＝1",
                "a ＋b ＝1，c ＋ d ＝ 1",
                "a ＋c ＝1， b ＋d ＝ 1",
                "a ＋d ＝1，b ＋ c ＝ 1"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「a ＋b ＝1，c ＋ d ＝ 1」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問1（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2026-q2",
              "prompt": "クイックソートの処理方法を説明したものはどれか。",
              "options": [
                "既に整列済みのデータ列の正しい位置に，データを追加する操作を繰り返してい く方法である。",
                "データ中の最小値を求め，次にそれを除いた部分の中から最小値を求める。この 操作を繰り返していく方法である。",
                "適当な基準値を選び，それよりも小さな値のグループと大きな値のグループにデ ータを分割する。同様にして，グループの中で基準値を選び，それぞれのグループ を分割する。この操作を繰り返していく方法である。",
                "隣り合ったデータの比較と入替えを繰り返すことによって，小さな値のデータを 次第に端の方に移していく方法である。"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「適当な基準値を選び，それよりも小さな値のグループと大きな値のグループにデ ータを分割する。同様にして，グループの中で基準値を選び，それぞれのグループ を分割する。この操作を繰り返していく方法である。」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問2（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2026-q3",
              "prompt": "プロセッサの一つであるGPUの特徴として，適切なものはどれか。",
              "options": [
                "OS 及び他のハードウェアから独立して機能し，暗号キーなどの情報を安全に管 理する。",
                "並列に動作する多数の浮動小数点演算ユニットによって，高速な 3D 演算ができ る。",
                "目的に応じて半導体デバイス内部の論理回路を再構成できる。",
                "量子ビットによって 0と1を重ね合わせた状態を計算に使うことができる。"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「並列に動作する多数の浮動小数点演算ユニットによって，高速な 3D 演算ができ る。」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問3（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2026-q4",
              "prompt": "クラウドコンピューティングのサービスモデルとしてのPaaSの説明はどれか。",
              "options": [
                "OS やアプリケーションを含む任意のソフトウェアを実行可能にするリソースが， 利用者に提供される。OS などのプラットフォームへの限定的な設定や制御を行う ことができる。",
                "アプリケーションの開発や運用に必要となるミドルウェアなどが利用者に提供さ れるので，これらを利用して，アプリケーションを開発して運用することができる。 利用者は，プラットフォームを直接変更することはできない。",
                "利用者は，ハードウェア，OS などのプラットフォームとアプリケーションを自 ら準備して，それらの運用を依頼する。利用者は，プラットフォームの構成を決め ることができるなど，環境構築の自由度が高い。",
                "利用者は，用意されたアプリケーションをそのまま又はカスタマイズして利用す るが，OS などのプラットフォームからアプリケーションまで全てを自ら準備する 必要はない。利用者は，プラットフォームを直接変更することはできない。"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「アプリケーションの開発や運用に必要となるミドルウェアなどが利用者に提供さ れるので，これらを利用して，アプリケーションを開発して運用することができる。 利用者は，プラットフォームを直接変更することはできない。」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問4（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2026-q5",
              "prompt": "仮想記憶方式のコンピュータシステムにおいて，処理の多重度を増やしたところ， ページイン，ページアウトが多発して，システムの応答速度が急激に遅くなった。こ のような現象を何というか。",
              "options": [
                "オーバレイ",
                "スラッシング",
                "メモリコンパクション",
                "ロールアウト"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「スラッシング」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問5（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2026-q7",
              "prompt": "次のSQL文によって定義され，値が格納されている“商品”表に対して，制約違反 で実行エラーとなるSQL文はどれか。 〔SQL文〕 CREATE TABLE 商品 (商品コード CHAR(4) PRIMARY KEY, 商品名 VARCHAR(21), 仕入先コード CHAR(4), 仕入単価 INT, 在庫数 INT) 商品 商品コード 商品名 仕入先コード 仕入単価 在庫数 A111 テレビ S001 75,000 0 A222 デジタルカメラ S002 50,000 50 A333 DVDプレーヤ NULL NULL NULL A444 洗濯機 S004 45,000 20",
              "options": [
                "DELETE FROM 商品 WHERE 仕入先コード IS NULL",
                "INSERT INTO 商品 VALUES ('A555', '空気清浄機', 'S005', 60000, 50)",
                "UPDATE 商品 SET 商品コード = 'A666' WHERE 商品コード = 'A444'",
                "UPDATE 商品 SET 商品コード = 'A777' WHERE 在庫数 >= 20"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「UPDATE 商品 SET 商品コード = 'A777' WHERE 在庫数 >= 20」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問7（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2026-q8",
              "prompt": "無線LANでは，複数の端末から送信された同じ周波数の電波が衝突した場合，電波 が干渉するのでそれらを受信すると信号を復調できないことがある。この問題を回避 するためのものはどれか。",
              "options": [
                "CSMA/CA",
                "SSID",
                "キャリアアグリゲーション",
                "テザリング"
              ],
              "answer": 0,
              "explanation": "IPA公式解答例では「CSMA/CA」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問8（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2026-q9",
              "prompt": "2要素認証に該当する組みはどれか。",
              "options": [
                "クライアント証明書，ハードウェアトークン",
                "静脈認証，指紋認証",
                "パスワード認証，静脈認証",
                "パスワード認証，秘密の質問の答え"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「パスワード認証，静脈認証」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問9（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2026-q10",
              "prompt": "情報セキュリティに関する専門組織の説明のうち，CSIRT の説明として，最も適切 なものはどれか。",
              "options": [
                "自社が顧客に提供する製品又はサービスの脆弱性に起因するリスクに対応する組 織",
                "セキュリティインシデント検知のために，システム監視，ログ分析などのセキュ リティ運用を担う組織",
                "発生したセキュリティインシデントに対し，インシデント対応を行う組織",
                "標的型サイバー攻撃特別相談窓口をもち，相談をもち込んだ組織の被害の低減と 攻撃の連鎖の遮断を支援する組織"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「発生したセキュリティインシデントに対し，インシデント対応を行う組織」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問10（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2026-q11",
              "prompt": "あるシステムにおいて，“プログラムの記述方法が統一されていないので保守がし づらい”という問題が発生している。今後の新規開発プロジェクトにおけるこの問題 の低減策として，最も適切なものはどれか。",
              "options": [
                "コーディング規約を見直し，教育する。",
                "セキュアプログラミングを採用する。",
                "単体テストでの命令網羅度を上げる。",
                "プロジェクト管理レビューに全プログラマーが参加する。"
              ],
              "answer": 0,
              "explanation": "IPA公式解答例では「コーディング規約を見直し，教育する。」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問11（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2026-q12",
              "prompt": "バーンダウンチャートの使い方として，適切なものはどれか。",
              "options": [
                "縦軸を完成した成果物の総量，横軸を時間とし，プロジェクトが進むに従って完 成した成果物の総量が増加する様子を確認する。",
                "縦軸を残課題の総数，横軸を時間とし，プロジェクトが進むに従って残課題の総 量が増減する様子を確認する。",
                "縦軸を残作業の量，横軸を時間とし，プロジェクトが進むに従って残作業の量が 減少する様子を確認する。",
                "縦軸を延べ工数，横軸を時間とし，プロジェクトが進むに従って延べ工数が増加 する様子を確認する。"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「縦軸を残作業の量，横軸を時間とし，プロジェクトが進むに従って残作業の量が 減少する様子を確認する。」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問12（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2026-q13",
              "prompt": "あるシステム開発プロジェクトの進捗が遅延したので，クリティカルパス上の作業 への投入工数を増やすことによって遅延の解消を図った。このとき適用した，所要期 間を短縮するための手法を何と呼ぶか。",
              "options": [
                "クラッシング",
                "コーチング",
                "ファストトラッキング",
                "メンタリング"
              ],
              "answer": 0,
              "explanation": "IPA公式解答例では「クラッシング」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問13（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2026-q14",
              "prompt": "A 社は，自社のデータセンタでアプリケーションシステムを運用し，顧客にサービ スを提供している。現在，アプリケーションシステムの実行環境をクラウドサービス に移行して，サービス可用性を向上させることを検討している。次の条件のとき，サ ービス可用性は移行後に何パーセントポイント向上するか。ここで，サービス可用性 （％）は小数第3位を切り捨てるものとする。 〔条件〕 ・サービス提供時間は，移行前も移行後も同じで，計画された保守の時間を除き，年 間5,000時間である。 ・移行前は，サービス提供時間内の停止時間が，年間100時間である。 ・移行後は，サービス提供時間内の停止時間が，年間30分となる。",
              "options": [
                "0.01",
                "0.19",
                "1.40",
                "1.99"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「1.99」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問14（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2026-q15",
              "prompt": "内部監査部門が，情報システム部門に対するシステム監査を経営者から指示された とき，システム監査人の行為として，適切なものはどれか。",
              "options": [
                "監査報告書に記載した改善提案に対して改善計画を策定した上で，実行する。",
                "基幹システムを開発し，保守を行っている外部事業者に，当該システム監査を委 託する。",
                "経営者がどのようなニーズを有しているかを十分に把握した上で，システム監査 の目的と対象範囲を決定する。",
                "情報システム部門の在籍者を監査メンバとして選定する。"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「経営者がどのようなニーズを有しているかを十分に把握した上で，システム監査 の目的と対象範囲を決定する。」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問15（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2026-q16",
              "prompt": "小売事業者が，オムニチャネル戦略を実現するためのIT活用事例はどれか。",
              "options": [
                "実店舗，オンライン店舗，コールセンタなど複数の顧客接点で，顧客情報や在庫 情報などを一元的に管理・共有して接客することによって，顧客の利便性を高める。",
                "複数店舗からネットワークを経由して，受発注，出荷，請求，支払などの取引情 報を電子的に交換することによって，卸売業者とメーカとの間の受発注業務の効率 を高める。",
                "複数店舗に設置した監視カメラの画像データを本部に集め，本部が各店舗の状況 をリアルタイムに把握することによって，店舗運営業務の効率を高める。",
                "複数店舗のPOSデータを本部に集め，本部が日次で売れ筋商品の抽出，複数の商 品の併売率の分析を行うことによって，商品計画や棚割計画を最適化する。"
              ],
              "answer": 0,
              "explanation": "IPA公式解答例では「実店舗，オンライン店舗，コールセンタなど複数の顧客接点で，顧客情報や在庫 情報などを一元的に管理・共有して接客することによって，顧客の利便性を高める。」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問16（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2026-q17",
              "prompt": "サービスA～Dの中で会員のリテンション率が最も高いものはどれか。 なお，リテンションの対象は前月末から当月末まで継続して在籍した会員とし，当 月新規会員は月末までの退会はないものとする。 単位 人 サービス 前月末会員数 当月新規会員数 当月末会員数 A 1,000 500 800 B 1,000 200 800 C 1,500 500 1,100 D 1,500 1,000 1,800",
              "options": [
                "サービスA",
                "サービスB",
                "サービスC",
                "サービスD"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「サービスB」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問17（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2026-q18",
              "prompt": "AIの事例として，適切でないものはどれか。",
              "options": [
                "制御量を目標値側へフィードバックすることによって両者を比較し，その差によ って両者を一致させるような修正動作を行うPID制御のモーターコントローラー",
                "部屋の広さや形，家具の位置などを学習し，移動のルートを決めて掃除をするロ ボット",
                "ヘルプデスク及びコールセンターに代わって，自然言語による質問の意味を推測 して返事をするチャットボット",
                "ボードゲームでプロの人間に勝つような，多数の統計データを処理することによ って人間に勝るソフトウェア"
              ],
              "answer": 0,
              "explanation": "IPA公式解答例では「制御量を目標値側へフィードバックすることによって両者を比較し，その差によ って両者を一致させるような修正動作を行うPID制御のモーターコントローラー」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問18（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2026-q19",
              "prompt": "ブレーンストーミングの説明はどれか。",
              "options": [
                "あるテーマの検討において，複数のメンバーで，各自が思いつくままに自由奔放 にできるだけ多くのアイディアを出し合うことによって，創造的思考を喚起し，ア イディアを開発しようとする会議方法",
                "研修を始める前に行う簡単なゲームや，商談や面接の本題に入る前に行う雑談な ど，参加者の緊張をほぐすためのコミュニケーション方法",
                "情報を，決められた枠組みに従って整理・分析するスキルや方法を利用し，複雑 なものごとを明快に把握したり，問題に対する解決策を導き出したりするような思 考方法",
                "ポイントを繰り返したり，言い換えたりすることによって，お互いの理解する意 味合いが一致していることを確認したり，意見・評価を伝えたりする方法"
              ],
              "answer": 0,
              "explanation": "IPA公式解答例では「あるテーマの検討において，複数のメンバーで，各自が思いつくままに自由奔放 にできるだけ多くのアイディアを出し合うことによって，創造的思考を喚起し，ア イディアを開発しようとする会議方法」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問19（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2026-q20",
              "prompt": "A 社は，自社の業務可視化を B 社に委託しその成果物として納品された業務フロー 図をC社に提示することによって，業務システムの開発をC社に委託することを検討 している。A 社がこの業務フロー図を使用する上で生じる制約として，適切なものは どれか。 なお，B 社への委託に当たって締結された契約には，著作権は全て A 社に譲渡する 旨の記述があり，著作者人格権については特段の記述はない。",
              "options": [
                "C 社と守秘義務契約を締結したとしても，C 社に対して，納品された業務フロー 図の電子データを提供することはできない。",
                "納品された業務フロー図の各ページに作成者名として記されているB社の企業名 をA社の企業名に変更し，C社に提示することはできない。",
                "納品された業務フロー図を印刷し，社内資料としてA社の社員に配布することは できない。",
                "バックアップの目的で，納品された業務フロー図の電子データを複製し，A 社だ けがアクセス可能なクラウドストレージに保管することはできない。"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「納品された業務フロー図の各ページに作成者名として記されているB社の企業名 をA社の企業名に変更し，C社に提示することはできない。」が正解です。",
              "sourceTitle": "©2026 IPA / 出典：令和8年度 基本情報技術者試験 科目A 公開問題 問20（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/rcu1hd0000012qj6-att/2026r08_fe_kamoku_a_qs.pdf"
            }
          ]
        },
        {
          "id": "ipa-practice-fe-2025",
          "number": 7,
          "title": "令和7年度 科目A 公開問題 実践20問",
          "sourceQuestionCount": 20,
          "questions": [
            {
              "id": "ipa-practice-fe-2025-q1",
              "prompt": "大規模言語モデルを用いた自然言語処理において，事前学習済みのモデルに対して 行う，ファインチューニングに関する記述として，最も適切なものはどれか。",
              "options": [
                "強化学習を行い，最適な結果が得られるようにする。",
                "事前学習と同じデータを繰り返し用いて学習を行い，モデルの精度を高めるよう にする。",
                "大量のテキストデータを用いて学習を行い，モデルの精度を高めるようにする。",
                "特定のデータを用いて追加で学習を行い，目的とするタスクに適用できるように する。"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「特定のデータを用いて追加で学習を行い，目的とするタスクに適用できるように する。」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 基本情報技術者試験 科目A 公開問題 問1（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2025-q2",
              "prompt": "浮動小数点形式で表現された数値の演算結果における丸め誤差の説明はどれか。",
              "options": [
                "演算結果がコンピュータの扱える最大値を超えることによって生じる誤差である。",
                "数表現のけた数に限度があるので，最下位けたより小さい部分について四捨五入 や切上げ，切捨てを行うことによって生じる誤差である。",
                "乗除算において，指数部が小さい方の数値の仮数部の下位部分が失われることに よって生じる誤差である。",
                "絶対値がほぼ等しい数値の加減算において，上位の有効数字が失われることによ って生じる誤差である。"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「数表現のけた数に限度があるので，最下位けたより小さい部分について四捨五入 や切上げ，切捨てを行うことによって生じる誤差である。」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 基本情報技術者試験 科目A 公開問題 問2（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2025-q3",
              "prompt": "次の木構造は2分探索木である。a〜gの値の大小関係として適切なものはどれか。根はa、aの左の子はb、右の子はcであり、bの左の子はd、右の子はe、cの左の子はf、右の子はgである。a〜gの値は重複しないものとする。",
              "options": [
                "a＜b＜d＜e＜c＜f＜g",
                "d＜b＜e＜a＜f＜c＜g",
                "d＜e＜f＜g＜b＜c＜a",
                "g＜f＜c＜e＜d＜b＜a"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「d＜b＜e＜a＜f＜c＜g」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 基本情報技術者試験 科目A 公開問題 問3（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2025-q4",
              "prompt": "MTBF は 4,000 時間，MTTR は 1,000 時間の装置がある。今後の 6 年間は，予防保守 によってMTBFを前年に比べて毎年100時間ずつ改善し，遠隔保守によってMTTRを前 年に比べて毎年 100 時間ずつ改善していく計画である。6 年経過後の稼働率は幾らか。",
              "options": [
                "0.88",
                "0.90",
                "0.92",
                "0.94"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「0.92」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 基本情報技術者試験 科目A 公開問題 問4（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2025-q5",
              "prompt": "ローコード開発ツールを用いたソフトウェア開発の説明はどれか。",
              "options": [
                "アプリケーションソフトウェアの開発基盤の上で，用意された部品やテンプレー トをGUIを用いた操作で組み合わせたり，必要に応じて一部の処理のソースコード を記述したりすることによって，アプリケーションソフトウェアを作成する。",
                "アプリケーションソフトウェアの開発基盤の上で，用意された部品やテンプレー トをGUIを用いた操作で組み合わせるだけで，ソースコードを記述せずに，アプリ ケーションソフトウェアを作成する。",
                "アプリケーションソフトウェアの定型的な枠組みを参照して，独自の処理のソー スコードを記述することによって，アプリケーションソフトウェアを作成する。",
                "利用者がシステムを利用して行う作業を自動化ツールに代行させるために，利用 者によるシステムの操作手順をツールに登録する。"
              ],
              "answer": 0,
              "explanation": "IPA公式解答例では「アプリケーションソフトウェアの開発基盤の上で，用意された部品やテンプレー トをGUIを用いた操作で組み合わせたり，必要に応じて一部の処理のソースコード を記述したりすることによって，アプリケーションソフトウェアを作成する。」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 基本情報技術者試験 科目A 公開問題 問5（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2025-q6",
              "prompt": "“商品”表に対するSQL文と同じ結果が得られるSELECT文はどれか。 商品 商品ID 商品名称 仕入先ID 単価 S001 冷蔵庫 M001 155,000 S002 食器洗い機 M002 85,000 S003 電子レンジ M003 78,000 S004 炊飯器 M003 32,000 S005 コーヒーメーカー M004 15,000 S006 ホットプレート M004 12,000 〔SQL文〕 SELECT * FROM 商品 WHERE 仕入先ID IN ('M002', 'M004')",
              "options": [
                "SELECT * FROM 商品 WHERE 仕入先ID = 'M002' AND 仕入先ID = 'M004'",
                "SELECT * FROM 商品 WHERE 仕入先ID = 'M002' INTERSECT SELECT * FROM 商品 WHERE 仕入先ID = 'M004'",
                "SELECT * FROM 商品 WHERE 仕入先ID = 'M002' OR 仕入先ID = 'M004'",
                "SELECT * FROM 商品 WHERE 仕入先ID BETWEEN 'M002' AND 'M004'"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「SELECT * FROM 商品 WHERE 仕入先ID = 'M002' OR 仕入先ID = 'M004'」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 基本情報技術者試験 科目A 公開問題 問6（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2025-q7",
              "prompt": "1G バイトの動画データを 40M ビット／秒の回線を使用してダウンロードしたとこ ろ，5 分掛かった。このときの回線利用率はおよそ何％か。ここで，ダウンロード時 には動画データに20％の制御情報が付加されるものとする。",
              "options": [
                "10",
                "53",
                "67",
                "80"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「80」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 基本情報技術者試験 科目A 公開問題 問7（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2025-q8",
              "prompt": "HTTPとHTTPSを比較した場合において，HTTPSだけがもつ特徴を示したものはどれ か。",
              "options": [
                "cookieに保存されている情報を用いたセッション管理が可能である。",
                "IDとパスワードによって利用者の認証を行うことが可能である。",
                "Web ブラウザでキャッシュさせることによって通信量を減らすことが可能である。",
                "通信相手先サーバをサーバ証明書によって確認することが可能である。"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「通信相手先サーバをサーバ証明書によって確認することが可能である。」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 基本情報技術者試験 科目A 公開問題 問8（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2025-q9",
              "prompt": "暗号の危殆化に該当するものはどれか。",
              "options": [
                "ある CA でデジタル証明書の署名に使っている公開鍵のデジタル証明書の有効期 限が切れた。",
                "ある暗号アルゴリズムの秘密鍵が不正アクセスによって漏えいした。",
                "あるハッシュ関数においてハッシュ値が同じになるデータの組みを現実的な時間 内で発見する方法が見つかった。",
                "あるランサムウェアの一種で暗号化されたファイルの復号鍵が公開された。"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「あるハッシュ関数においてハッシュ値が同じになるデータの組みを現実的な時間 内で発見する方法が見つかった。」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 基本情報技術者試験 科目A 公開問題 問9（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2025-q10",
              "prompt": "WAFの説明はどれか。",
              "options": [
                "Web サイトに対するアクセス内容を監視し，攻撃とみなされるパターンを検知し たときに当該アクセスを遮断する。",
                "Wi-Fi アライアンスが認定した無線 LAN の暗号化方式の規格であり，AES 暗号に 対応している。",
                "様々なシステムの動作ログを一元的に蓄積，管理し，セキュリティ上の脅威とな る事象をいち早く検知，分析する。",
                "ファイアウォール機能を有し，マルウェア対策機能，侵入検知機能などの複数の セキュリティ機能を連携させ，統合的に管理する。"
              ],
              "answer": 0,
              "explanation": "IPA公式解答例では「Web サイトに対するアクセス内容を監視し，攻撃とみなされるパターンを検知し たときに当該アクセスを遮断する。」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 基本情報技術者試験 科目A 公開問題 問10（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2025-q11",
              "prompt": "E-Rモデルにおけるエンティティの特徴はどれか。",
              "options": [
                "エンティティとインスタンスとは，1対1の対応関係をとる。",
                "エンティティとなり得るものは，物的に実現するものである。",
                "エンティティは，特性を表すための属性（アトリビュート）をもつ。",
                "異なった種類のエンティティ間の関係は，主として状態遷移として表現される。"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「エンティティは，特性を表すための属性（アトリビュート）をもつ。」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 基本情報技術者試験 科目A 公開問題 問11（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2025-q12",
              "prompt": "オブジェクト指向プログラミングの特徴のうち，異なるクラスのオブジェクトを同 一のインタフェースで操作したときに，操作対象クラスに応じた異なる動作を可能に することを何と呼ぶか。",
              "options": [
                "委譲",
                "継承",
                "コンポジション",
                "多相性"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「多相性」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 基本情報技術者試験 科目A 公開問題 問12（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2025-q13",
              "prompt": "アジャイル開発手法の一つであるスクラムにおいて，プロダクトバックログアイテ ムの内容や並び順を決定する役割をもつのは誰か。",
              "options": [
                "開発者",
                "顧客",
                "スクラムマスタ",
                "プロダクトオーナ"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「プロダクトオーナ」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 基本情報技術者試験 科目A 公開問題 問13（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2025-q14",
              "prompt": "あるプロジェクトの作業A〜Iと作業日数から、最短所要日数を求めよ。開始からA(3日)の後、B(6日)、E(5日)、F(14日)へ分岐する。E完了点からB完了点へダミー作業がある。B完了点からC(8日)、G(11日)、H(15日)へ分岐し、G完了点からC完了点へダミー作業がある。FとCは同じ点へ合流してD(6日)へ進み、DとHは同じ点へ合流してI(5日)を経て終了する。",
              "options": [
                "27",
                "28",
                "29",
                "31"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「31」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 基本情報技術者試験 科目A 公開問題 問14（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2025-q15",
              "prompt": "サーバ室の物理的な安全対策の状況について，情報セキュリティ管理基準（平成 28 年）に照らして，情報セキュリティ監査を行って判明した状況のうち，監査人が， 指摘事項として監査報告書に記載すべきものはどれか。",
              "options": [
                "サーバが設置されている施設の無人領域では，営業時間中でも，警報装置が作動 するようになっている。",
                "サーバ室に非常口，避難器具，誘導灯などを設置している。",
                "社外からサーバ室へ直接出入りするドアを設置しているが，出入りを考慮して常 時施錠していない。",
                "場所が分からないように，サーバ室の所在を室外に表示していない。"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「社外からサーバ室へ直接出入りするドアを設置しているが，出入りを考慮して常 時施錠していない。」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 基本情報技術者試験 科目A 公開問題 問15（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2025-q16",
              "prompt": "データマイニングの手法の一つであって，POS などの蓄積データから“一緒に買わ れる商品”の組合せを発見する分析手法はどれか。",
              "options": [
                "3C分析",
                "ABC分析",
                "コンジョイント分析",
                "マーケットバスケット分析"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「マーケットバスケット分析」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 基本情報技術者試験 科目A 公開問題 問16（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2025-q17",
              "prompt": "インターネット上の生成 AI サービスを利用する際に，オプトアウトを設定するこ とはどのような場合に有効か。",
              "options": [
                "個々の利用者が，自身が生成 AI から得た情報に対して，著作権を主張したい場 合",
                "個々の利用者が入力した情報を，生成AIの学習に利用させたくない場合",
                "個々の利用者が入力した情報を，生成 AI を通じて，他の利用者にも知ってほし い場合",
                "生成AIから得た情報の信ぴょう性を高めたい場合"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「個々の利用者が入力した情報を，生成AIの学習に利用させたくない場合」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 基本情報技術者試験 科目A 公開問題 問17（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2025-q18",
              "prompt": "物販事業において，ロングテールをビジネスとして成功させるために必要な施策は どれか。",
              "options": [
                "多くの有名ブランド店が出店するショッピングモールの構築",
                "交通の利便性が高い地域に対する，生活必需品を広く浅く取りそろえた出店計画",
                "店舗で購入した商品を近隣地域に無償で配送するサービスの実施",
                "豊富な品ぞろえと，在庫コストや配送費用を抑えるための大規模な物流センタの 構築や活用"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「豊富な品ぞろえと，在庫コストや配送費用を抑えるための大規模な物流センタの 構築や活用」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 基本情報技術者試験 科目A 公開問題 問18（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2025-q19",
              "prompt": "表の条件で喫茶店を開業したい。月10万円の利益を出すためには，1客席当たり1 日平均何人の客が必要か。 客1人当たりの売上高 500円 客1人当たりの変動費 100円 固定費 300,000円／月 1か月の営業日数 20日 客席数 10席",
              "options": [
                "3.75",
                "4",
                "4.2",
                "5"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「5」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 基本情報技術者試験 科目A 公開問題 問19（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2025-q20",
              "prompt": "カーボンフットプリントの説明として，適切なものはどれか。",
              "options": [
                "温室効果ガスの排出量から吸収量と除去量を差し引いた合計をゼロにする取組",
                "原材料調達から廃棄・リサイクルに至るまでのライフサイクル全体を通して排出 される温室効果ガスの排出量を，CO 量に換算して，その値を商品やサービスに表 2 示すること",
                "自動車のエンジンから排出される一酸化炭素，窒素酸化物や炭化水素類などの大 気汚染物質の排出量の定め",
                "商品がどのような場所で作られて，流通し，販売されているかを把握するための 仕組み"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「原材料調達から廃棄・リサイクルに至るまでのライフサイクル全体を通して排出 される温室効果ガスの排出量を，CO 量に換算して，その値を商品やサービスに表 2 示すること」が正解です。",
              "sourceTitle": "©2025 IPA / 出典：令和7年度 基本情報技術者試験 科目A 公開問題 問20（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf"
            }
          ]
        },
        {
          "id": "ipa-practice-fe-2024",
          "number": 8,
          "title": "令和6年度 科目A 公開問題 実践20問",
          "sourceQuestionCount": 20,
          "questions": [
            {
              "id": "ipa-practice-fe-2024-q1",
              "prompt": "X及びYはそれぞれ0又は1の値をとる。X□YをXとYの論理演算としたとき、次の結果が得られた。X□Yの真理値表はどれか。与えられた結果は、(X,Y)=(0,0),(0,1),(1,0),(1,1)の順に、X AND (X□Y) が0,0,0,1、X OR (X□Y) が1,1,1,1である。",
              "options": [
                "X□Yは、(0,0),(0,1),(1,0),(1,1)の順に0,0,0,1",
                "X□Yは、(0,0),(0,1),(1,0),(1,1)の順に0,1,0,1",
                "X□Yは、(0,0),(0,1),(1,0),(1,1)の順に1,1,0,1",
                "X□Yは、(0,0),(0,1),(1,0),(1,1)の順に1,1,1,0"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「X□Yは、(0,0),(0,1),(1,0),(1,1)の順に1,1,0,1」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 基本情報技術者試験 科目A 公開問題 問1（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2024-q2",
              "prompt": "キーが小文字のアルファベット 1 文字（a，b，…，z のいずれか）であるデータを， 大きさが 10 のハッシュ表に格納する。ハッシュ関数として，アルファベットの ASCII コードを 10 進表記法で表したときの 1 の位の数を用いることにする。衝突が 起こるキーの組合せはどれか。ASCII コードでは，昇順に連続した 2 進数が，アルフ ァベット順にコードとして割り当てられている。",
              "options": [
                "aとi",
                "bとr",
                "cとl",
                "dとx"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「dとx」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 基本情報技術者試験 科目A 公開問題 問2（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2024-q3",
              "prompt": "図に示す構成で，表に示すようにキャッシュメモリと主記憶のアクセス時間だけが 異なり，他の条件は同じ2種類のCPU XとYがある。 あるプログラムを CPU X と Y とでそれぞれ実行したところ，両者の処理時間が等 しかった。このとき，キャッシュメモリのヒット率は幾らか。ここで，CPU 以外の処 理による影響はないものとする。 CPU 表 アクセス時間 キャッシュ 主記憶 単位 ナノ秒 メモリ CPU X CPU Y 256kバイト 256Mバイト キャッシュメモリ 40 20 主記憶 400 580 図 構成 構成はいずれもCPU内に256Kバイトのキャッシュメモリがあり、256Mバイトの主記憶に接続される。アクセス時間（ナノ秒）は、CPU Xがキャッシュ40・主記憶400、CPU Yがキャッシュ20・主記憶500である。",
              "options": [
                "0.75",
                "0.90",
                "0.95",
                "0.96"
              ],
              "answer": 1,
              "explanation": "IPA公式解答例では「0.90」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 基本情報技術者試験 科目A 公開問題 問3（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2024-q4",
              "prompt": "あるシステムの今年度のMTBFは3,000時間，MTTRは1,000時間である。翌年度は MTBFについて今年度の20％分の改善，MTTRについて今年度の10％分の改善を図ると， 翌年度の稼働率は何％になるか。",
              "options": [
                "69",
                "73",
                "77",
                "80"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「80」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 基本情報技術者試験 科目A 公開問題 問4（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2024-q5",
              "prompt": "複数のWebサービスの入出力処理を連結させて新たなサービスを提供する，“ロジ ックマッシュアップ”の例はどれか。",
              "options": [
                "利用者が選択した飲食店情報のページを表示する際に，他のWebサービスが提供 する地図コンテンツをアクセスマップとして表示する。",
                "利用者が選択した投資商品の情報を表示する際に，関連する経済指標のデータを 複数のWebサービスから取得し，グラフに加工して表示する。",
                "利用者が入力した予算の範囲で宿泊可能な施設のリストを他のWebサービスから 取得し，それらの宿泊施設の空室状況を別のWebサービスから取得して表示する。",
                "利用者がマウスのドラッグで地図を操作した際に，Web ページ全体ではなく一部 を読み直すことによって地図をスクロールして表示する。"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「利用者が入力した予算の範囲で宿泊可能な施設のリストを他のWebサービスから 取得し，それらの宿泊施設の空室状況を別のWebサービスから取得して表示する。」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 基本情報技術者試験 科目A 公開問題 問5（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2024-q6",
              "prompt": "液晶ディスプレイなどの表示装置において，傾いた直線の境界を滑らかに表示する 手法はどれか。",
              "options": [
                "アンチエイリアシング",
                "シェーディング",
                "テクスチャマッピング",
                "バンプマッピング"
              ],
              "answer": 0,
              "explanation": "IPA公式解答例では「アンチエイリアシング」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 基本情報技術者試験 科目A 公開問題 問6（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2024-q7",
              "prompt": "DBMSに実装すべき原子性（atomicity）を説明したものはどれか。",
              "options": [
                "同一データベースに対する同一処理は，何度実行しても結果は同じである。",
                "トランザクション完了後にハードウェア障害が発生しても，更新されたデータベ ースの内容は保証される。",
                "トランザクション内の処理は，全てが実行されるか，全てが取り消されるかのい ずれかである。",
                "一つのトランザクションの処理結果は，他のトランザクション処理の影響を受け ない。"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「トランザクション内の処理は，全てが実行されるか，全てが取り消されるかのい ずれかである。」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 基本情報技術者試験 科目A 公開問題 問7（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2024-q8",
              "prompt": "LAN間接続装置に関する記述のうち，適切なものはどれか。",
              "options": [
                "ゲートウェイは，OSI 基本参照モデルにおける第 1 ～3 層だけのプロトコルを変 換する。",
                "ブリッジは，IPアドレスを基にしてフレームを中継する。",
                "リピータは，同種のセグメント間で信号を増幅することによって伝送距離を延長 する。",
                "ルータは，MACアドレスを基にしてフレームを中継する。"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「リピータは，同種のセグメント間で信号を増幅することによって伝送距離を延長 する。」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 基本情報技術者試験 科目A 公開問題 問8（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2024-q9",
              "prompt": "ペネトレーションテストに該当するものはどれか。",
              "options": [
                "検査対象の実行プログラムの設計書，ソースコードに着目し，開発プロセスの各 工程にセキュリティ上の問題がないかどうかをツールや目視で確認する。",
                "公開Webサーバの各コンテンツファイルのハッシュ値を管理し，定期的に各ファ イルから生成したハッシュ値と一致するかどうかを確認する。",
                "公開Webサーバや組織のネットワークの脆弱性を探索し，サーバに実際に侵入で きるかどうかを確認する。",
                "内部ネットワークのサーバやネットワーク機器の IPFIX 情報から，各 PC の通信 に異常な振る舞いがないかどうかを確認する。"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「公開Webサーバや組織のネットワークの脆弱性を探索し，サーバに実際に侵入で きるかどうかを確認する。」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 基本情報技術者試験 科目A 公開問題 問9（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2024-q10",
              "prompt": "SQLインジェクションの対策として，有効なものはどれか。",
              "options": [
                "URL をWeb ページに出力するときは，“http://”や“https://”で始まる URL だ けを許可する。",
                "外部からのパラメータでWebサーバ内のファイル名を直接指定しない。",
                "スタイルシートを任意のWebサイトから取り込めるようにしない。",
                "プレースホルダを使って命令文を組み立てる。"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「プレースホルダを使って命令文を組み立てる。」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 基本情報技術者試験 科目A 公開問題 問10（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2024-q11",
              "prompt": "階層構造のモジュール群から成るソフトウェアの結合テストを，上位のモジュール から行う。この場合に使用する，下位のモジュールの代替となるテスト用のモジュー ルはどれか。",
              "options": [
                "エミュレータ",
                "シミュレータ",
                "スタブ",
                "ドライバ"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「スタブ」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 基本情報技術者試験 科目A 公開問題 問11（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2024-q12",
              "prompt": "アジャイル開発手法の一つであるスクラムで定義され，スプリントで実施するイベ ントのうち，毎日決まった時間に決まった場所で行い，開発チームの全員が前回から の進捗状況や今後の作業計画を共有するものはどれか。",
              "options": [
                "スプリントプランニング",
                "スプリントレトロスペクティブ",
                "スプリントレビュー",
                "デイリースクラム"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「デイリースクラム」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 基本情報技術者試験 科目A 公開問題 問12（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2024-q13",
              "prompt": "アローダイアグラムで表されるプロジェクトは、完了までに最少で何日を要するか。作業A(30日)の後にB(5日)、C(30日)、D(20日)が分岐する。B完了点からC完了点へ、C完了点からD完了点へ、それぞれダミー作業がある。その後、B完了点からE(40日)、C完了点からF(25日)、D完了点からG(30日)が同じ点へ合流し、最後にH(30日)を行う。",
              "options": [
                "105",
                "115",
                "120",
                "125"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「120」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 基本情報技術者試験 科目A 公開問題 問13（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2024-q14",
              "prompt": "システムの開発部門と運用部門が別々に組織化されているとき，システム開発を伴 う新規サービスの設計及び移行を円滑かつ効果的に進めるための方法のうち，適切な ものはどれか。",
              "options": [
                "運用テストの完了後に，開発部門がシステム仕様と運用方法を運用部門に説明す る。",
                "運用テストは，開発部門の支援を受けずに，運用部門だけで実施する。",
                "運用部門からもシステムの運用に関わる要件の抽出に積極的に参加する。",
                "開発部門は運用テストを実施して，運用マニュアルを作成し，運用部門に引き渡 す。"
              ],
              "answer": 2,
              "explanation": "IPA公式解答例では「運用部門からもシステムの運用に関わる要件の抽出に積極的に参加する。」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 基本情報技術者試験 科目A 公開問題 問14（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2024-q15",
              "prompt": "ビッグデータ分析の前段階として，非構造化データを構造化データに加工する処理 を記述している事例はどれか。",
              "options": [
                "関係データベースに蓄積された大量の財務データから必要な条件に合致するデー タを抽出し，利用者が扱いやすい表計算ソフトウェアデータに加工する。",
                "個人情報を含むビッグデータを更に利活用するために，特定の個人を識別するこ とができないように匿名化加工する。",
                "住所データ項目の中にある，“ヶ”と“が”の混在や，丁番地の表記不統一を， 標準化された表記へ統一するために加工する。",
                "ソーシャルメディアの口コミを機械学習によって単語ごとに分解し，要約を作り， 分析可能なデータに加工し，関係データベースに保管する。"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「ソーシャルメディアの口コミを機械学習によって単語ごとに分解し，要約を作り， 分析可能なデータに加工し，関係データベースに保管する。」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 基本情報技術者試験 科目A 公開問題 問15（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2024-q16",
              "prompt": "コアコンピタンスを説明したものはどれか。",
              "options": [
                "経営活動における基本精神や行動指針",
                "事業戦略の遂行によって達成すべき到達目標",
                "自社を取り巻く環境に関するビジネス上の機会と脅威",
                "他社との競争優位の源泉となる経営資源及び企業能力"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「他社との競争優位の源泉となる経営資源及び企業能力」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 基本情報技術者試験 科目A 公開問題 問16（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2024-q17",
              "prompt": "マーケティング戦略におけるブルーオーシャンの説明として，適切なものはどれか。",
              "options": [
                "競争が存在していない未知の市場",
                "コモディティ化が進んだ既存の市場",
                "新事業のアイディアを実際のビジネスに育成するまでの期間",
                "製品開発したものを市場化する過程に横たわっている障壁"
              ],
              "answer": 0,
              "explanation": "IPA公式解答例では「競争が存在していない未知の市場」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 基本情報技術者試験 科目A 公開問題 問17（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2024-q18",
              "prompt": "HRテックの説明はどれか。",
              "options": [
                "ICT を活用して，住宅内のエネルギー使用状況の監視，機器の遠隔操作や自動制 御などを可能にし，家庭におけるエネルギー管理を支援するソリューション",
                "既存のビジネスモデルによる業界秩序や既得権益を破壊してしまうほど大きな影 響を与える新しいICTやビジネスモデル",
                "個人の資金に関わる情報を統合的に管理するサービスやマーケットプレイス・レ ンディングなどの金融サービスを実現するための新しい情報技術",
                "採用，育成，評価，配属などの人事領域の業務を対象に，ビッグデータ解析や AIなどの最新ICTを活用して，業務改善と社員満足度向上を図るソリューション"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「採用，育成，評価，配属などの人事領域の業務を対象に，ビッグデータ解析や AIなどの最新ICTを活用して，業務改善と社員満足度向上を図るソリューション」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 基本情報技術者試験 科目A 公開問題 問18（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2024-q19",
              "prompt": "製品の製造上のある要因の値xと品質特性の値yとの関係を示す散布図では、xが大きくなるにつれてyがおおむね小さくなるように点が分布している。この図から読み取れることはどれか。",
              "options": [
                "xからyを推定するためには，2次回帰係数の計算が必要である。",
                "xからyを推定するための回帰式は，yからxを推定する回帰式と同じである。",
                "xとyの相関係数は正である。",
                "xとyの相関係数は負である。"
              ],
              "answer": 3,
              "explanation": "IPA公式解答例では「xとyの相関係数は負である。」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 基本情報技術者試験 科目A 公開問題 問19（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf"
            },
            {
              "id": "ipa-practice-fe-2024-q20",
              "prompt": "日本において，産業財産権と総称される四つの権利はどれか。",
              "options": [
                "意匠権，実用新案権，商標権，特許権",
                "意匠権，実用新案権，著作権，特許権",
                "意匠権，商標権，著作権，特許権",
                "実用新案権，商標権，著作権，特許権"
              ],
              "answer": 0,
              "explanation": "IPA公式解答例では「意匠権，実用新案権，商標権，特許権」が正解です。",
              "sourceTitle": "©2024 IPA / 出典：令和6年度 基本情報技術者試験 科目A 公開問題 問20（アプリ表示用に改変：改行・表記を調整）",
              "sourceUrl": "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/eid2eo0000007g1d-att/2024r06_fe_kamoku_a_qs.pdf"
            }
          ]
        }
      ]
    },
    {
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
    },
    {
      "id": "sample-electrician-2",
      "name": "第二種電気工事士",
      "accent": "#b91c1c",
      "chapters": [
        {
          "id": "sample-electric-theory",
          "number": 1,
          "title": "基礎理論と配線設計",
          "sourceQuestionCount": 2,
          "questions": [
            {
              "id": "sample-electric-1",
              "prompt": "電圧100 Vを抵抗20 Ωに加えたとき、流れる電流は何Aですか。",
              "options": [
                "0.2 A",
                "2 A",
                "5 A",
                "20 A"
              ],
              "answer": 2,
              "explanation": "オームの法則 I = V ÷ R より、100 ÷ 20 = 5 A です。",
              "sourceTitle": "CC0 書き下ろし例題"
            },
            {
              "id": "sample-electric-2",
              "prompt": "抵抗20 Ωを2本並列に接続したときの合成抵抗は何Ωですか。数値で答えてください。",
              "options": [
                "10"
              ],
              "answer": 0,
              "answerText": "10",
              "format": "typing",
              "explanation": "同じ抵抗値の抵抗を2本並列にすると合成抵抗は半分となり、10 Ωです。",
              "sourceTitle": "CC0 書き下ろし例題"
            }
          ]
        },
        {
          "id": "sample-electric-work",
          "number": 2,
          "title": "施工と保安",
          "sourceQuestionCount": 2,
          "questions": [
            {
              "id": "sample-electric-3",
              "prompt": "1灯の照明を廊下の両端など2か所から点滅させる基本回路で、2個組み合わせて使うスイッチはどれですか。",
              "options": [
                "単極スイッチ",
                "3路スイッチ",
                "調光器",
                "押しボタンスイッチ"
              ],
              "answer": 1,
              "explanation": "2か所から同じ照明を点滅する基本回路では、3路スイッチを2個使用します。",
              "sourceTitle": "CC0 書き下ろし例題"
            },
            {
              "id": "sample-electric-4",
              "prompt": "電気工事の安全確保に役立つものをすべて選んでください。\n\nア：作業前に電源を遮断する\nイ：検電器で無電圧を確認する\nウ：濡れた手で充電部に触れる\nエ：適切な保護具を使用する\n\n該当するものをすべて含む組合せを選んでください。",
              "options": [
                "ア・イ・エ",
                "イ・エ",
                "ア・エ",
                "ア・イ・ウ・エ",
                "ア・イ"
              ],
              "answer": 0,
              "explanation": "電源遮断、無電圧確認、適切な保護具は基本的な安全対策です。濡れた手で電気設備に触れてはいけません。",
              "sourceTitle": "CC0 書き下ろし例題"
            }
          ]
        }
      ]
    }
  ]
};
  let payload = defaultPayload;
  try {
    const saved = localStorage.getItem("local-quiz-studio-legacy-dataset-v1");
    const parsed = saved ? window.quizPalValidateLegacyDataset(JSON.parse(saved)) : null;
    if (Array.isArray(parsed?.manifest?.courses) && Array.isArray(parsed.courses)) {
      // Repair only unchanged, previously broken bundled combinations. Keep user edits and progress IDs.
      const bundledQuestions = new Map(defaultPayload.courses.flatMap(course => course.chapters.flatMap(chapter => chapter.questions)).map(question => [question.id, question]));
      parsed.courses.forEach(course => course.chapters.forEach(chapter => {
        chapter.questions = chapter.questions.map(question => {
          const fixed = bundledQuestions.get(question.id);
          return fixed && question.prompt.endsWith("（該当する選択肢の組合せ）") && question.options.some(option => option.includes("以外（")) ? { ...fixed } : question;
        });
      }));
      payload = parsed;
      if (Number(parsed.manifest.sampleContentVersion || 0) < 6) {
        const savedCourses = new Map(parsed.courses.map((course) => [String(course.id), course]));
        for (const defaultCourse of defaultPayload.courses) {
          const savedCourse = savedCourses.get(String(defaultCourse.id));
          if (!savedCourse) {
            parsed.courses.push(defaultCourse);
            continue;
          }
          const savedChapterIds = new Set((savedCourse.chapters || []).map((chapter) => String(chapter.id)));
          for (const chapter of defaultCourse.chapters) {
            if (String(chapter.id).startsWith("ipa-") && !savedChapterIds.has(String(chapter.id))) savedCourse.chapters.push(chapter);
          }
        }
        const migratedCourses = parsed.courses.map((course) => {
          const chapters = Array.isArray(course.chapters) ? course.chapters : [];
          chapters.forEach((chapter) => (chapter.questions || []).forEach((question) => {
            if (!String(question.sourceTitle || "").includes("IPA / 出典：")) return;
            const prompt = String(question.prompt || "");
            const markerIndex = prompt.indexOf("【出典・利用条件】");
            if (markerIndex >= 0) question.prompt = prompt.slice(0, markerIndex).trimEnd();
            question.sourceUrl ||= "https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html";
          }));
          return { ...course, chapters };
        });
        const migratedManifests = migratedCourses.map((course) => {
          const questionCount = course.chapters.reduce((sum, chapter) => sum + (chapter.questions || []).length, 0);
          return { id: course.id, name: course.name, accent: course.accent, chapterCount: course.chapters.length, questionCount, visibleQuestionCount: questionCount, asset: course.asset || "" };
        });
        parsed.manifest = { ...parsed.manifest, sampleContentVersion: 6, chapterCount: migratedManifests.reduce((sum, course) => sum + course.chapterCount, 0), totalQuestions: migratedManifests.reduce((sum, course) => sum + course.questionCount, 0), courses: migratedManifests };
        payload = { manifest: parsed.manifest, courses: migratedCourses };
        localStorage.setItem("local-quiz-studio-legacy-dataset-v1", JSON.stringify(payload));
      }
    }
  } catch {}
  window.QUIZ_DATA = payload.manifest;
  window.QUIZ_COURSE_DATA = Object.fromEntries(payload.courses.map((course) => [course.id, course]));
  const completedCount = document.querySelector(".completed-course-toggle small");
  if (completedCount) completedCount.textContent = String(payload.manifest.courses.filter(course => course.completed).length);
  const completedCourseSwitch = document.querySelector("#completedCourseSwitch");
  if (completedCourseSwitch) {
    completedCourseSwitch.replaceChildren();
    completedCourseSwitch.hidden = true;
  }
  const courseSwitch = document.querySelector(".course-switch");
  const makeTab = (course) => {
    const button = document.createElement("button");
    button.className = "course-tab";
    button.dataset.course = String(course.id);
    if (course.completed) { button.dataset.completedCourse = String(course.id); button.hidden = true; }
    button.type = "button";
    const name = String(course.name);
    const lines = { 'Web安全の基礎': ['Web安全', 'の基礎'], '基本情報技術者': ['基本情報', '技術者'], '応用情報技術者': ['応用情報', '技術者'], '第二種電気工事士': ['第二種', '電気工事士'] }[name] || [name];
    button.setAttribute('aria-label', name);
    const label = document.createElement('span');
    label.className = 'course-tab-label';
    label.setAttribute('aria-hidden', 'true');
    for (const line of lines) {
      const part = document.createElement('span');
      part.className = 'course-tab-line';
      part.textContent = line;
      label.append(part);
    }
    button.append(label);
    return button;
  };
  if (courseSwitch) courseSwitch.replaceChildren(...payload.manifest.courses.filter(course => !course.completed).map(makeTab));
  if (completedCourseSwitch) completedCourseSwitch.replaceChildren(...payload.manifest.courses.filter(course => course.completed).map(makeTab));
  // An empty runtime frame lets the user return to Studio without reseeding deleted subjects.
  // It is not a stored subject and is never included in the dataset backup.
  if (!payload.manifest.courses.length) {
    const empty = { id: "__empty_library__", name: "科目がありません", accent: "#147d73", chapterCount: 0, questionCount: 0, visibleQuestionCount: 0, asset: "", chapters: [{id:"__empty_section__",number:1,title:"教材管理から科目を追加してください",sourceQuestionCount:0,questions:[]}] };
    window.QUIZ_DATA = {...payload.manifest, courses:[empty]};
    window.QUIZ_COURSE_DATA = {[empty.id]:empty};
  }

}
