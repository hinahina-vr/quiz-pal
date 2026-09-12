window.QUIZ_COURSE_DATA = window.QUIZ_COURSE_DATA || {};
window.QUIZ_COURSE_DATA["sample-web-safety"] = {
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
};
