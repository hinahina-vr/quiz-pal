window.QUIZ_COURSE_DATA = window.QUIZ_COURSE_DATA || {};
window.QUIZ_COURSE_DATA["sample-electrician-2"] = {
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
          "prompt": "電気工事の安全確保に役立つものをすべて選んでください。（該当する選択肢の組合せ）",
          "options": [
            "A・B・D",
            "A・B・D以外（Cを含む）"
          ],
          "answer": 0,
          "explanation": "電源遮断、無電圧確認、適切な保護具は基本的な安全対策です。濡れた手で電気設備に触れてはいけません。",
          "sourceTitle": "CC0 書き下ろし例題"
        }
      ]
    }
  ]
};
