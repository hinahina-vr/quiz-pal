window.QUIZ_COURSE_DATA = window.QUIZ_COURSE_DATA || {};
window.QUIZ_COURSE_DATA["sample-math"] = {
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
};
