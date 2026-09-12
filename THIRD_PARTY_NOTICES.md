# Third-party notices

## Browser runtime

Quiz Pal does not use a third-party JavaScript runtime library. The
application shipped to browsers is implemented with repository-owned HTML,
CSS, JavaScript, and browser-standard APIs. In particular, React, React DOM,
Dexie, Papa Parse, Zod, Lucide, marked, DOMPurify, KaTeX, and Three.js are not
included in the current runtime or generated distribution.

## Kaisei Opti font

The locally hosted Kaisei Opti font files under `public/assets/fonts/` are
provided by the Google Fonts project under the SIL Open Font License 1.1. The fonts are converted to WOFF2 and split by Unicode range for loading; all original character outlines and horizontal metrics are retained. The
license text is included at `public/assets/fonts/OFL.txt`.

Upstream source:
https://github.com/google/fonts/tree/main/ofl/kaiseiopti

## M PLUS Rounded 1c / Quiz Pal Rounded

Copyright 2016 The Rounded M+ Project Authors.
The Medium (500) and Bold (700) fonts are licensed under the SIL Open Font License 1.1, as recorded in the original font name tables and Google Fonts metadata. They are bundled as WOFF2 subsets with the distinct family name Quiz Pal Rounded. Both subsets together retain all 8,201 original Unicode characters and their horizontal metrics. License: public/assets/fonts/OFL-Rounded.txt.

Source: https://github.com/google/fonts/tree/main/ofl/mplusrounded1c

## Actual guide screenshots

The three AI screenshots in public/guide-captures/ were captured from Quiz Pal on 2026-09-12 and show real OpenRouter / deepseek/deepseek-v4-flash responses, including two follow-up questions. No response was fabricated or substituted. The binary-study-note.png diagram was supplied and selected by the user on 2026-09-12 and is included unchanged. The image-library.png screenshot was captured after importing that original image through the actual file picker and expanding it. This update did not generate a new image or AI response. No API key is included.

## Development-only tools

Packages in `devDependencies` are used only to build, type-check, and test the project. They are not application runtime libraries. Exact versions
and transitive licenses are recorded in `package-lock.json`.

- Vite and TypeScript: build and type checking
- Vitest, jsdom, Testing Library, and fake-indexeddb: automated tests

## Visual assets

The theme, background, and introduction raster images were created with AI assistance specifically for this project under the repository owner's direction. No stock-asset or third-party
icon pack is used by the browser runtime. UI icons are rendered by the
repository-owned `public/native-runtime.js` implementation.

## IPA official examination questions and syllabuses

The bundled questions marked with `origin: ipa-official-past-question` are
based only on official materials published by the Information-technology
Promotion Agency, Japan (IPA). Copyright in the official questions has not
been waived and is not covered by this repository's CC0 content dedication.
Each question displays its copyright holder, examination, year, question
number, adaptation notice, the official IPA conditions URL, and a reminder to
retain attribution and identify modifications when reusing the question.

Official question sources:

- 2024–2026 IT Passport public questions and answers:
  https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/questions.html
- 2026 Fundamental Information Technology Engineer, Subject A public
  questions and answers:
  https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/2026r08.html
- 2025 Fundamental Information Technology Engineer, Subject A public
  questions and answers:
  https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/2025r07.html
- 2024 Fundamental Information Technology Engineer, Subject A public
  questions and answers:
  https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/2024r06.html
- 2025 spring and autumn Applied Information Technology Engineer questions
  and answers:
  https://www.ipa.go.jp/shiken/mondai-kaiotu/2025r07.html
- 2024 autumn Applied Information Technology Engineer questions and answers:
  https://www.ipa.go.jp/shiken/mondai-kaiotu/2024r06.html

Section classification is based on these official syllabus versions:

- IT Passport Examination Syllabus Ver. 6.5
- Fundamental Information Technology Engineer Examination Syllabus Ver. 9.2
- Applied Information Technology Engineer Examination Syllabus Ver. 7.2

Official syllabus index:
https://www.ipa.go.jp/shiken/syllabus/gaiyou.html

IPA states the conditions for using publicly released past examination
questions on the following official pages. Users redistributing or modifying
the content must review and comply with the current conditions, retain source
attribution, and identify modifications:

- https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html
- https://www.ipa.go.jp/shiken/faq.html

## Original mascot illustrations

`public/intro-art/mascot-before-after-v2.webp` and `public/intro-art/quizpal-teacher.webp` were generated with OpenAI imagegen on 2026-09-12 using the author's original mascot and Quiz Pal logo references with explicit permission. The learner mascot belongs to the author, ひなひな; the teacher uses the Quiz Pal logo motif. Source images and prompts are in `assets/mascot-before-after-v2-*` and `assets/quizpal-teacher-*`. The comparison illustrates the learning concept; it is not a screenshot of an AI service. Labels are separate accessible HTML. Source images are encoded as WebP for delivery without an external runtime.
