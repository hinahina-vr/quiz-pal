/**
 * はじめて使う人向けの機能紹介。会話・図解保存・AIの準備・持ち運びを一続きに案内します。
 * 本文のスクロール位置とタブを連動させ、接続手順は利用者がAIを選んだときに展開します。
 */
(() => {
  "use strict";

  const STORAGE_KEY = "quiz-zen-product-intro-do-not-show";
  const VERSION = 4;
  const htmlEdition = Boolean(window.quizPalStandalone);
  const localFileEdition = htmlEdition && location.protocol === "file:";
  const DOWNLOAD_URL = "./downloads/Quiz-Pal-HTML.zip";
  const providers = [
    {
      id: "openrouter", name: "OpenRouter", monogram: "OR", tag: "作者愛用 / PICK UP", color: "#087958",
      lead: "いろんなAIを使いたいなら。",
      description: "1つのAPIキーで、DeepSeek・GPT・Geminiなどを選べる窓口。",
      cost: "モデルごとの従量制。クレジット購入時の手数料あり。",
      keyUrl: "https://openrouter.ai/settings/keys", keyLabel: "OpenRouterでAPIキーを作る",
      priceUrl: "https://openrouter.ai/deepseek/deepseek-v4-flash", priceLabel: "DeepSeek V4 Flashの料金",
      docsUrl: "https://openrouter.ai/docs/quickstart",
      setup: "OpenRouterでアカウントを作成し、クレジットとAPIキーを用意します。",
      detail: "迷ったら、作者の愛用セットを候補に。下のボタンでDeepSeek V4 Flashを設定画面にセットできます。",
      model: "deepseek/deepseek-v4-flash", slot: "deepseek/deepseek-v4-flash",
      field: "接続先：OpenRouter ／ モデル：deepseek/deepseek-v4-flash",
    },
    {
      id: "openai", name: "GPT", monogram: "GPT", tag: "OpenAIのAPI", color: "#315eba",
      lead: "GPTで教わりたいなら。",
      description: "OpenAIのAPIキーで接続。いつもの学習画面からGPTに質問。",
      cost: "モデルと入出力の量に応じたAPI料金。",
      keyUrl: "https://platform.openai.com/api-keys", keyLabel: "OpenAIでAPIキーを作る",
      priceUrl: "https://developers.openai.com/api/docs/pricing", priceLabel: "OpenAIのAPI料金",
      docsUrl: "https://developers.openai.com/api/docs/quickstart",
      setup: "OpenAI PlatformでAPIキーを発行し、API側の請求設定・残高を確認します。",
      detail: "チャット画面へのログインだけでは接続できません。API用のキーを用意し、利用できるGPTのモデルを選びます。",
      slot: "deepseek/deepseek-v4-pro", field: "接続先：OpenAI ／ モデル：利用するGPTのモデルID",
    },
    {
      id: "gemini", name: "Gemini", monogram: "G", tag: "GoogleのAPI", color: "#7845b9",
      lead: "Geminiで始めたいなら。",
      description: "Google AI Studioでキーを作成。対象モデルには無料枠も。",
      cost: "対象モデルには無料枠あり。有料枠・上限・条件を確認。",
      keyUrl: "https://aistudio.google.com/app/apikey", keyLabel: "Google AI Studioでキーを作る",
      priceUrl: "https://ai.google.dev/gemini-api/docs/pricing", priceLabel: "GeminiのAPI料金・無料枠",
      docsUrl: "https://ai.google.dev/gemini-api/docs/api-key",
      setup: "Google AI Studioで新しいAPIキーを作成し、プロジェクトの利用枠を確認します。",
      detail: "無料枠の有無・回数制限・データの取扱いは、モデルや利用プランで変わります。選ぶ前に公式の条件を確認できます。",
      slot: "google/gemini-3.5-flash", field: "接続先：Google Gemini ／ モデル：利用するGeminiのモデルID",
    },
    {
      id: "grok", name: "Grok", monogram: "x", tag: "xAIのAPI", color: "#a45d15",
      lead: "Grokを使いたいなら。",
      description: "xAIのAPIキーで接続。設定ボタンで接続先を入力できます。",
      cost: "APIクレジットを購入。利用モデル・入出力量で課金。",
      keyUrl: "https://console.x.ai/", keyLabel: "xAI ConsoleでAPIキーを作る",
      priceUrl: "https://docs.x.ai/developers/models", priceLabel: "Grokのモデル・API料金",
      docsUrl: "https://docs.x.ai/developers/quickstart",
      setup: "xAI Consoleでアカウント・クレジット・APIキーを用意します。",
      detail: "設定画面にxAIの接続先とモデル例を入力します。アカウントで利用できるモデルを確認してください。このアプリからWeb検索やX検索は実行しません。",
      slot: "openai/gpt-5.4-mini", model: "grok-4.6", baseUrl: "https://api.x.ai/v1",
      field: "接続先：OpenAI互換API ／ URL：https://api.x.ai/v1 ／ モデル例：grok-4.6",
    },
  ];
  let dialog = null;
  let step = 0;
  let selected = "openrouter";
  let providerView = "choose";
  let featureView = "conversation";
  let previousFocus = null;
  let previousOverflow = "";

  const externalLink = (url, label, className = "") => `<a class="${className}" href="${url}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">${label}<span aria-hidden="true"> ↗</span></a>`;

  // Introduce the learning problem before the optional AI solution.
  const overview = () => `
    <section class="intro-overview" aria-labelledby="productIntroTitle">
      <header class="intro-overview-heading"><span class="product-intro-eyebrow">QUIZ PAL / 自分でつくって、学べるクイズアプリ</span><h2 id="productIntroTitle">問題を解く。<em>その先まで。</em></h2><p>問題・選択肢・正解・解説を自分で追加。解いて、間違いを見直し、画像も保存できます。</p><span class="intro-basic-label">基本機能はAPIキー不要</span><p class="intro-author-note"><b><button type="button" class="intro-author-link" data-author-profile>資格取得に挑戦し続けている作者</button>がつくる、学習の相棒。</b> 情報処理・電気・簿記・語学。分野をまたいで学んできた経験を、このアプリに。</p></header>
      <div class="intro-comparison" aria-label="これまでの学習とQuiz Palでの学習の比較">
        <section class="intro-flow-before"><header><span>AS IS / これまでの課題</span><h3>解説の先は、自分で調べ直す。</h3></header><div class="intro-flow-art"><img src="./intro-art/mascot-before-after-v2.webp" width="1774" height="887" alt="問題集を前に、いくつもの検索画面を行き来して困る学習者" fetchpriority="high"></div><ol class="intro-learning-flow"><li><span aria-hidden="true">01</span><strong>問題を解く</strong></li><li><span aria-hidden="true">02</span><strong>解説を読む</strong></li><li class="intro-detour"><span aria-hidden="true">?</span><strong>まだ分からない</strong><small>別のサイトやアプリで検索</small></li></ol><p>問題と解説のセットだけでは、残った疑問は自分で調べ直すことに。画面を行き来して情報を探すうちに、学習の流れが途切れてしまう。</p></section>
        <section class="intro-flow-after"><header><span>TO BE / Quiz Palが目指す学習</span><h3>疑問の続きも、同じ画面で。</h3></header><div class="intro-flow-art"><img src="./intro-art/mascot-before-after-v2.webp" width="1774" height="887" alt="同じ学習画面でAIに質問を重ね、図解とともに学びを深める学習者" fetchpriority="high"></div><ol class="intro-learning-flow"><li><span aria-hidden="true">01</span><strong>問題を解く</strong></li><li><span aria-hidden="true">02</span><strong>解説を読む</strong></li><li class="intro-follow-up"><span aria-hidden="true">03</span><strong>その場で聞き直す</strong><small>AIで、理解できるまで対話</small></li></ol><p>「なぜ？」「もっとやさしく」「別の例で」。問題と解説からそのまま質問できるので、疑問を持った場所から学びを続けられます。</p></section>
      </div>
      <section class="intro-authoring-pitch" aria-labelledby="introAuthoringTitle"><span>つくるところから、AIと。</span><h3 id="introAuthoringTitle"><span>問題も解説も、</span><span>AIに丸投げ。</span></h3><p>「ネットワークの基礎を、初心者向けに」など、学びたい内容を伝えるだけ。問題・選択肢・正解・解説の下書きを、AIとまとめて作れます。</p><ol><li>テーマを伝える</li><li>相談して、下書きを調整</li><li>内容を確認して保存</li></ol><p class="intro-authoring-note">「問題をつくる・なおす」→「AIに丸投げ」から。AIの内容は保存前に確認・修正できます。APIキーとネット接続が必要で、AIサービスの利用料がかかります。</p></section>
      <div class="intro-concept"><div><span>CONCEPT</span><strong>解く・聞く・残す。学びの続きを、ひとつの画面で。</strong></div><p><b>APIキーがなくても大丈夫！</b>「問題をつくる・なおす」→「手動で編集」で問題と答えを追加できます。<br>AIは、作問を任せたいとき・理解を深めたいときの追加機能です。利用する場合だけ、APIキーとネット接続が必要です。</p></div>
    </section>`;

  const hero = () => `
    <section class="product-intro-hero" aria-labelledby="introConversationTitle">
      <div class="product-intro-pitch">
        <span class="product-intro-eyebrow product-intro-pickup">ADVANCED <span>学びを深める、追加機能。</span></span>
        <h2 id="introConversationTitle"><span>わかるまで、</span><em>何度でも。</em></h2>
        <p class="product-intro-lead"><strong>「まだわからない」で、終わらせない。</strong>答えを見た、その続きからAIと会話。たとえ話も、もっとやさしい説明も。自分のペースで、何度でも聞き直せます。</p>
        <ol class="intro-mini-steps"><li><b>1</b>問題画面の「AIにきく」を押す</li><li><b>2</b>解説を読んで、下の欄から追加質問</li><li><b>3</b>わかるまで、そのまま続けて聞く</li></ol>
        <p class="product-intro-api-note"><span aria-hidden="true">OK</span><span><strong>APIキーがなくても大丈夫！</strong><br>問題・選択肢・正解・解説は、自分で追加できます。<br>「問題をつくる・なおす」→「手動で編集」からどうぞ。<br>AIへの質問・AIでの問題作成には、APIキーとネット接続が必要です。AIサービスの利用料がかかります。</span></p>
      </div>
      <figure class="intro-real-screen">
        <div class="intro-screen-bar"><span class="intro-live-dot" aria-hidden="true"></span><strong>実際のAIとの会話</strong><span>DeepSeek V4 Flash</span></div>
        <div class="intro-capture-tabs" role="group" aria-label="実際の会話の流れ"><button type="button" data-capture-step="ai-first-answer.png" aria-pressed="false">1 解説を読む</button><button type="button" data-capture-step="ai-follow-up.png" aria-pressed="false">2 聞き直す</button><button type="button" data-capture-step="ai-conversation.png" aria-pressed="true">3 別の例でも</button></div>
        <button class="intro-screenshot-button" type="button" data-screenshot="ai-conversation.png" data-caption="Quiz PalでDeepSeek V4 Flashに続けて質問した実際の画面。" aria-label="AIとの実際の会話画面を拡大"><img src="./guide-captures/ai-conversation-preview.webp" width="920" height="922" alt="解説の後に質問を重ね、AIが前の会話を踏まえて答えているQuiz Palの画面" fetchpriority="high"><span class="intro-zoom-label">実画面を拡大 ↗</span></button>
        <figcaption>OpenRouter × DeepSeek V4 Flashで実際に質問・撮影。<br>返答は例です。質問やモデルによって変わります。</figcaption>
      </figure>
    </section>
    <section class="intro-image-story" aria-labelledby="introImageTitle">
      <div><span class="product-intro-eyebrow">もうひとつの、おすすめ。</span><h3 id="introImageTitle"><span>図解も、</span><em>自分の学習ノートに。</em></h3><p>画像生成AIなど、外部で用意した画像を「解説画像」へ。<strong>保存して、広げて、何度でも見返せます。</strong></p><ol class="intro-mini-steps"><li><b>1</b>外部で作った画像をPCに保存</li><li><b>2</b>「解説画像」→「画像を追加」で選ぶ</li><li><b>3</b>セーブ／ロードで画像ごと持ち運ぶ</li></ol><p class="intro-image-note">画像の保存・閲覧はAPIキー不要。外部で作った画像を、自分の学習用に保存できます。</p></div>
      <figure class="intro-real-screen intro-image-screen"><div class="intro-screen-bar"><strong>図解を追加した実際の画面</strong></div><button class="intro-screenshot-button" type="button" data-screenshot="image-library.png" data-caption="外部で作成した図解を、実際に解説画像へ追加・保存した画面。" aria-label="画像保存の実画面を拡大"><img src="./guide-captures/image-library-preview.webp" width="960" height="822" loading="lazy" alt="二進数の図解を解説画像へ保存し、拡大して見ている画面"><span class="intro-zoom-label">実画面を拡大 ↗</span></button><figcaption>画像はこのブラウザー内に保存。移行前はセーブを。</figcaption></figure>
    </section>
    <div class="product-intro-benefits"><div><b>01</b><span><strong>何度でも、聞き直せる</strong><small>前の会話を踏まえて追加質問</small></span></div><div><b>02</b><span><strong>図解を、手元に残せる</strong><small>外部の画像も追加・拡大・保存</small></span></div><div><b>03</b><span><strong>サーバー知識は不要</strong><small>HTML版なら基本の学習はオフライン</small></span></div></div>`;

  const comparison = () => {
    if (providerView === "setup") {
      const provider = providers.find(item => item.id === selected) || providers[0];
      return `<section class="intro-connect-page" aria-labelledby="productIntroTitle"><button type="button" class="intro-return-link" data-action="choose-provider">← AIを選び直す</button><div class="intro-connect-heading"><span class="product-intro-eyebrow">AIとのつなぎ方</span><h2 id="productIntroTitle">${provider.name}を、<em>学習の相棒に。</em></h2></div><div id="productIntroProviderDetail" class="product-intro-provider-detail"></div></section>`;
    }
    const descriptions = { openrouter: "いろいろなAIを、ひとつのキーで。", openai: "いつものGPTと、学習の続きを。", gemini: "GoogleのAIを、学習の相棒に。", grok: "xAIのGrokと、一緒に考える。" };
    return `<section class="intro-partner-page" aria-labelledby="productIntroTitle">
      <div class="intro-partner-heading"><div><span class="product-intro-eyebrow">あなたの学習に、もうひとり。</span><h2 id="productIntroTitle">話してみたい<em>相棒</em>を選ぼう。</h2><p>いつものAIでも、気になるAIでも。<br>選ぶと、そのAIのつなぎ方をご案内します。</p></div><img loading="lazy" src="./intro-art/partners-flat.webp" width="1536" height="1024" alt="4つの小さな相棒たち"></div>
      <div class="product-intro-provider-grid" role="group" aria-label="AIを選んで接続手順を見る">${providers.map((provider, index) => `<button class="product-intro-provider" type="button" data-provider="${provider.id}" aria-label="${provider.name}のつなぎ方を見る"><span class="intro-provider-index" aria-hidden="true">0${index + 1}</span><span class="intro-provider-copy"><span class="intro-provider-name">${provider.name}${provider.id === "openrouter" ? '<small class="intro-personal-note">作者の愛用</small>' : ""}</span><span class="intro-provider-caption">${descriptions[provider.id]}</span><span class="intro-provider-company">${provider.id === "openrouter" ? "DeepSeek・GPT・Gemini など" : provider.tag}</span></span><span class="intro-provider-arrow" aria-hidden="true">↗</span></button>`).join("")}</div>
      <div class="intro-partner-afterword"><span>あとから変更できます。</span><p>接続には、ご自身のAPIキーが必要です。<br>キーの作り方と料金は、次の画面で確認できます。</p></div>
    </section>`;
  };

  const portable = () => `
    <section class="product-intro-portable" aria-labelledby="productIntroTitle">
      <div class="product-intro-pitch"><span class="product-intro-eyebrow product-intro-pickup">TAKE HOME <span>Windows・Mac・Linux 共通</span></span><h2 id="productIntroTitle">この学習環境、<br><em>まるごと持ち帰れる。</em></h2><p class="product-intro-lead"><strong>サーバー知識ゼロでOK。</strong><br>ZIPを展開して、HTMLを開く。<br>インストールもコマンド入力もいりません。</p><div class="product-intro-portable-tags"><span>サーバー契約不要</span><span>むずかしい設定不要</span><span>インストール不要</span></div>${localFileEdition ? externalLink("./README.html", "HTML版の使い方と保存", "product-intro-download") : `<a class="product-intro-download" href="${DOWNLOAD_URL}" download="Quiz-Pal-HTML.zip">HTML共通版をダウンロード <span aria-hidden="true">↓</span></a>`}<p class="product-intro-portable-sub">${localFileEdition ? "この画面は、サーバーを使わずに動いています。" : "Web版のままでも学習できます。持ち帰るとオフラインでも。"}</p></div>
      <div class="product-intro-install"><div class="product-intro-laptop"><img loading="lazy" src="./intro-art/quizpal-teacher.webp" width="1536" height="1024" alt="ノートPCから広がる、自分だけの小さな教室"></div><ol><li><b>1</b><span><strong>ダウンロード</strong><small>HTML共通版のZIPを保存</small></span></li><li><b>2</b><span><strong>すべて展開</strong><small>ZIPを右クリックして展開</small></span></li><li><b>3</b><span><strong>HTMLを開く</strong><small>index.html をブラウザで開く</small></span></li></ol></div>
    </section>
    <div class="product-intro-local-notes"><div><strong>基本の学習は、ネットなしでも！</strong><p>問題を解く・教材を編集する基本機能はAPIキー不要。AIに質問したり、問題を作ってもらうときだけ、ネット接続とAPIキーを使います。</p></div><div><strong>育てた問題集も、学習の記録も。</strong><p>データはこのブラウザ内に保存。フォルダーの移動・更新や別端末への引っ越しの前に、セーブ／ロードを使ってください。HTMLには自動保存されません。</p></div></div>`;


  function providerDetail() {
    const provider = providers.find(item => item.id === selected) || providers[0];
    const detail = dialog.querySelector("#productIntroProviderDetail");
    detail.innerHTML = `<aside class="product-intro-provider-summary"><span class="product-intro-eyebrow">はじめる前に</span><h3>${provider.id === "openrouter" ? "OpenRouter ×<br>DeepSeek V4 Flash" : provider.name + "を使う準備"}</h3><p>${provider.detail}</p><div class="intro-connect-cost"><strong>料金について</strong><p>${provider.cost}</p>${externalLink(provider.priceUrl, provider.priceLabel)}</div>${externalLink(provider.docsUrl, provider.name + "の公式ガイド", "intro-official-guide")}</aside><div class="product-intro-provider-setup"><ol><li><b>01</b><div><h3>APIキーを用意する</h3><p>${provider.setup}</p>${externalLink(provider.keyUrl, provider.keyLabel)}</div></li><li><b>02</b><div><h3>このアプリに貼り付ける</h3><p>設定を開き、キーを貼り付けて保存します。</p><small>${provider.field}</small><button type="button" class="product-intro-primary" data-action="setup">${provider.name}の設定へ <span aria-hidden="true">→</span></button></div></li><li><b>03</b><div><h3>問題画面の「AIにきく」から話しかける</h3><p>解説を読んだあとも、入力欄から続けて質問できます。</p></div></li></ol><p class="product-intro-draft-note">設定を開くだけでは、AIへの送信は行いません。<br>キーは通常このタブだけで保持します。ローカルHTML版は確認画面で許可すると次回も使えます。セーブデータには含めません。</p></div>`;
    detail.querySelector('[data-action="setup"]').addEventListener("click", () => {
      if (typeof window.quizZenOpenLlmSettings !== "function") {
        detail.querySelector(".product-intro-draft-note").textContent = "学習画面の準備中です。少し待ってから、もう一度お試しください。";
        return;
      }
      close();
      window.quizZenOpenLlmSettings({ slot: provider.slot, model: provider.model, baseUrl: provider.baseUrl });
    });
  }

  let resizeObserver = null;
  let activeSection = 'conversation';
  const sections = () => [...dialog.querySelectorAll('[data-reading-section]')];

  function syncTabs() {
    if (!dialog) return;
    const body = dialog.querySelector('.product-intro-body');
    const marker = body.getBoundingClientRect().top + Math.min(160, body.clientHeight * .3);
    const all = sections();
    const current = all.filter(section => section.getBoundingClientRect().top <= marker).at(-1) || all[0];
    activeSection = current.dataset.readingSection;
    step = Number(current.dataset.readingStep);
    featureView = activeSection === 'images' ? 'images' : 'conversation';
    dialog.dataset.introStep = String(step);
    dialog.dataset.readingSection = activeSection;
    dialog.dataset.providerView = activeSection === 'setup' ? 'setup' : 'choose';
    dialog.querySelector('.product-intro-count').textContent = String(step + 1).padStart(2, '0') + ' / 03';
    dialog.querySelectorAll('[data-step]').forEach(button => {
      const current = Number(button.dataset.step) === step;
      button.setAttribute('aria-current', current ? 'step' : 'false');
      button.classList.toggle('is-current', current);
    });
    dialog.querySelectorAll('[data-feature]').forEach(button => button.setAttribute('aria-pressed', String(activeSection === button.dataset.feature)));
    dialog.querySelector('[data-action=back]').disabled = current === all[0];
    dialog.querySelector('[data-action=back]').textContent = '戻る';
    dialog.querySelector('[data-action=next]').textContent = activeSection === 'portable' ? '画面の操作ガイドを始める →' : activeSection === 'overview' ? 'AIで学びを深める →' : activeSection === 'conversation' ? '図解の保存を見る →' : activeSection === 'images' ? 'AIのつなぎ方へ →' : activeSection === 'choose' && all.some(s => s.dataset.readingSection === 'setup') ? '選んだAIのつなぎ方へ →' : '手元で使う →';
  }

  function scrollToSection(id) {
    const body = dialog.querySelector('.product-intro-body');
    const target = sections().find(section => section.dataset.readingSection === id);
    if (!target) return;
    body.scrollTo({ top: body.scrollTop + target.getBoundingClientRect().top - body.getBoundingClientRect().top,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  function turnPage(direction) {
    const all = sections(), index = all.findIndex(section => section.dataset.readingSection === activeSection);
    const target = all[index + direction];
    if (target) scrollToSection(target.dataset.readingSection);
  }

  function returnToProviders() { scrollToSection('choose'); }

  function render() {
    const body = dialog.querySelector('.product-intro-body');
    const fragment = document.createElement('template'); fragment.innerHTML = hero();
    const wrap = (id, readingStep, content) => '<div class="intro-reading-section" data-reading-section="' + id + '" data-reading-step="' + readingStep + '">' + content + '</div>';
    providerView = 'choose';
    body.innerHTML = wrap('overview', 0, overview())
      + wrap('conversation', 1, fragment.content.querySelector('.product-intro-hero').outerHTML)
      + wrap('images', 1, fragment.content.querySelector('.intro-image-story').outerHTML)
      + wrap('choose', 1, comparison().replaceAll('productIntroTitle', 'introPartnerTitle'))
      + wrap('portable', 2, portable().replaceAll('productIntroTitle', 'introPortableTitle'));
    body.tabIndex = 0;
    body.setAttribute('aria-label', '紹介の内容。スクロールして続きを読む');
    dialog.querySelectorAll('[data-feature]').forEach(button => button.addEventListener('click', () => scrollToSection(button.dataset.feature)));
    body.querySelectorAll('[data-screenshot]').forEach(button => button.addEventListener('click', () => openScreenshot(button)));
    body.querySelectorAll('[data-capture-step]').forEach(button => button.addEventListener('click', () => {
      const figure = button.closest('figure');
      figure.querySelectorAll('[data-capture-step]').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
      const screenshot = figure.querySelector('[data-screenshot]');
      screenshot.dataset.screenshot = button.dataset.captureStep;
      screenshot.querySelector('img').src = './guide-captures/' + button.dataset.captureStep.replace('.png', '-preview.webp');
    }));
    body.querySelectorAll('[data-provider]').forEach(button => button.addEventListener('click', () => {
      selected = button.dataset.provider; providerView = 'setup';
      let detailSection = body.querySelector('[data-reading-section=setup]');
      if (!detailSection) {
        detailSection = document.createElement('div'); detailSection.className = 'intro-reading-section';
        detailSection.dataset.readingSection = 'setup'; detailSection.dataset.readingStep = '1';
        body.querySelector('[data-reading-section=choose]').after(detailSection);
      }
      detailSection.innerHTML = comparison().replaceAll('productIntroTitle', 'introConnectTitle');
      providerDetail();
      detailSection.querySelector('[data-action=choose-provider]').addEventListener('click', returnToProviders);
      scrollToSection('setup');
    }));
    body.addEventListener('scroll', syncTabs, { passive: true });
    resizeObserver = new ResizeObserver(() => {
      body.style.setProperty('--intro-reading-height', body.clientHeight + 'px');
      syncTabs();
    });
    resizeObserver.observe(body);
    syncTabs();
  }

  function remember() {
    const checked = dialog?.querySelector('#productIntroDoNotShow')?.checked;
    try { if (checked) localStorage.setItem(STORAGE_KEY, 'true'); else localStorage.removeItem(STORAGE_KEY); } catch { /* Still usable without persistent storage. */ }
  }

  function completed() {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
  }

  function finishClose() {
    if (!dialog) return;
    remember();
    resizeObserver?.disconnect();
    resizeObserver = null;
    const closingDialog = dialog;
    dialog = null;
    closingDialog.remove();
    document.body.style.overflow = previousOverflow;
    previousFocus?.focus?.({ preventScroll: true });
  }

  function close() {
    if (!dialog) return;
    document.querySelector('.intro-shot-viewer')?.close();
    dialog.close();
    finishClose();
  }

  function startGuide(manual = false) {
    close();
    if (manual) window.quizZenGuide?.open();
    else window.quizZenGuide?.openAutomatically();
  }

  function openScreenshot(button) {
    const viewer = document.createElement('dialog');
    viewer.className = 'intro-shot-viewer';
    viewer.setAttribute('aria-label', '実際の画面を拡大表示');
    const bar = document.createElement('header');
    const title = document.createElement('strong');
    title.textContent = 'Quiz Pal / 実際の操作画面';
    const dismiss = document.createElement('button');
    dismiss.type = 'button'; dismiss.textContent = '閉じる ×';
    dismiss.addEventListener('click', () => viewer.close());
    bar.append(title, dismiss);
    const picture = document.createElement('img');
    picture.src = './guide-captures/' + button.dataset.screenshot;
    picture.alt = button.dataset.caption;
    const caption = document.createElement('p'); caption.textContent = button.dataset.caption;
    viewer.append(bar, picture, caption);
    viewer.addEventListener('close', () => { viewer.remove(); if (dialog?.open) button.focus({ preventScroll: true }); }, { once: true });
    document.body.append(viewer); viewer.showModal(); dismiss.focus();
  }

  // Qualifications and personal difficulty ratings supplied by the author; not an objective ranking.
  const authorQualifications = [["第三種電気主任技術者", 2025, 5], ["基本情報技術者", 2007, 4], ["データベーススペシャリスト", 2011, 4], ["ネットワークスペシャリスト", 2017, 4], ["HSK（漢語水平考試）5級", 2021, 4], ["Oracle Master Gold DBA 10g", 2010, 3], ["情報セキュリティスペシャリスト", 2012, 3], ["第二種電気工事士", 2023, 3], ["宅地建物取引士", 2011, 3], ["日商簿記検定2級", 2013, 3], ["HSK（漢語水平考試）4級", 2020, 3], ["初級システムアドミニストレータ", 2003, 2], ["CCNA", 2009, 2], ["LPIC-1", 2010, 2], ["応用情報技術者", 2014, 2], ["統計検定3級", 2025, 2], ["工事担任者（総合通信）", 2023, 2], ["工事担任者（第一級デジタル通信）", 2023, 2], ["航空特殊無線技士", 2023, 2], ["第三級アマチュア無線技士", 2023, 2], ["ERE（経済学検定試験）A+", 2011, 2], ["HSK（漢語水平考試）3級", 2019, 2], ["情報セキュリティマネジメント", 2016, 1], ["Azure AI Fundamentals", 2023, 1], ["Azure Data Fundamentals", 2023, 1], ["第二級海上特殊無線技士", 2023, 1], ["第二級陸上特殊無線技士", 2023, 1], ["危険物取扱者 乙種第4類", 2023, 1]];
  function openAuthorProfile(trigger) {
    const profile = document.createElement('dialog');
    profile.className = 'intro-author-profile';
    profile.setAttribute('aria-labelledby', 'authorProfileTitle');
    profile.innerHTML = `<header><div><small>MEET THE CREATOR</small><h2 id="authorProfileTitle">ひなひな</h2></div><button type="button" aria-label="作者紹介を閉じる">×</button></header><div class="intro-author-profile-body"><figure class="author-portrait"><img src="./intro-art/hinahina-portrait.png" alt="立派な金の額縁で澄ました顔をする、ひなひなの肖像画" width="1254" height="1254"><figcaption>作者近影</figcaption></figure><article class="author-interview" aria-label="ひなひなの作者インタビュー"><p class="author-profile-lead">AIを自在に使うために、広く学ぶ。</p><p class="author-interview-intro">資格取得に挑戦し続けているQuiz Palの作者、ひなひな。独学で分野をまたいで学んできた経験と、このアプリに込めた思いを紹介します。</p><section><h3>――まず、ひなひなさんのことを教えてください。</h3><p><strong>ひなひな：</strong>ZEN大学 知能情報社会学部の1期生です。Quiz Palをつくっています。情報処理・通信・電気・簿記・語学など、いろいろな分野を学んできました。このあとに載せている資格・検定は、すべて独学で取得したものです。今も資格取得に挑戦し続けています。</p></section><section><h3>――Quiz Palは、どんな課題から生まれたんですか？</h3><p><strong>ひなひな：</strong>従来のクイズアプリは、問題と解説がセットになっていますよね。でも、解説を読んでも分からなかったら、その先は自分で検索して調べ直すことになる。問題を解く流れと、理解するために調べる流れが分かれてしまうんです。そこをつなげたいと思いました。</p></section><section><h3>――その「解説の先」を、AIと一緒に進める。</h3><p><strong>ひなひな：</strong>はい。同じ問題について、その場で「もっとかみ砕いて」「別の例でも」と聞き直せる。図解を残して、あとで見返すこともできます。問題と解説をつくるところからAIに任せて、下書きを確認・修正して保存することもできます。</p><p>もちろん、APIキーがなくても大丈夫です。問題・正解・解説を手で追加して、クイズを解く基本機能が使えます。AIは、そこから学びを深めたり、作問を手伝ってもらったりするための追加機能です。</p></section><section><h3>――AIが何でも知っている時代にも、勉強は必要ですか？</h3><p><strong>ひなひな：</strong>AIに聞けば、いろいろなことを教えてくれます。でも、何を聞くか、答えをどう受け止めるか、どこで使うかは自分で考える必要がある。広く知っているほど、質問の切り口も、知識のつなぎ方も増えていくと思うんです。</p><p>AIも間違えることはあります。答えを確かめる土台を持ちながら、分野に縛られず、融通無碍に使いこなしたい。そのためにも、学び続けたいですね。</p></section></article><h3>取得した資格・検定</h3><p class="author-rank-note">本人の「体感ムズさ」が高い順。同じ星の中では取得年順です。一般的な難易度や合格率を表すものではありません。名称・取得年は本人の一覧に基づきます。</p><div class="author-qualification-groups"></div><footer class="author-interview-closing"><p>AIを融通無碍に使いこなすために、広く知り、学び続けましょう。</p><p class="author-signature">ひなひな</p></footer></div>`;
    const groups = profile.querySelector('.author-qualification-groups');
    for (let stars = 5; stars >= 1; stars--) {
      const group = document.createElement('section');
      const title = document.createElement('h4'); title.textContent = '★'.repeat(stars); title.setAttribute('aria-label', '体感難易度 '+stars+' / 5');
      const list = document.createElement('ul');
      authorQualifications.filter(item => item[2] === stars).sort((a,b) => a[1]-b[1]).forEach(([name,year]) => {const item=document.createElement('li');const label=document.createElement('span');label.textContent=name;const date=document.createElement('small');date.textContent=year+'年取得';item.append(label,date);list.append(item);});
      group.append(title,list);groups.append(group);
    }
    profile.querySelector('header button').addEventListener('click',()=>profile.close());
    profile.addEventListener('close',()=>{profile.remove();trigger.focus({preventScroll:true});},{once:true});
    document.body.append(profile);profile.showModal();
  }

  function open() {
    if (dialog) return;
    previousFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    step = 0;
    selected = "openrouter";
    providerView = "choose";
    featureView = "conversation";
    dialog = document.createElement("dialog");
    dialog.className = "product-intro";
    dialog.setAttribute("aria-labelledby", "productIntroTitle");
    dialog.innerHTML = `<div class="product-intro-shell"><header class="product-intro-top"><span class="product-intro-wordmark"><img class="brand-symbol" src="./favicon.svg?v=20260907-quiz-pal" width="44" height="44" alt="" aria-hidden="true"><span><span class="brand-name">Quiz <em>Pal</em></span><small>解いて、聞いて、わかる。</small></span></span><span class="product-intro-count"></span><button type="button" class="product-intro-close" aria-label="紹介を閉じる" data-action="close"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M6 6L18 18M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg></button></header><nav class="product-intro-nav" aria-label="紹介のページ"><button type="button" data-step="0"><b>01</b> 教えて LLM</button><button type="button" data-step="1"><b>02</b> AIで学びを深める</button><button type="button" data-step="2"><b>03</b> 手元で使う</button></nav><div class="product-intro-body"></div><footer class="product-intro-footer"><button type="button" class="product-intro-text-button" data-action="guide">操作ガイド</button><div><button type="button" class="product-intro-back" data-action="back">戻る</button><button type="button" class="product-intro-primary" data-action="next"></button></div></footer></div>`;
    const guideLink = dialog.querySelector('[data-action="guide"]');
    const footerOptions = document.createElement('div'); footerOptions.className = 'intro-footer-options';
    const checkboxLabel = document.createElement('label'); checkboxLabel.className = 'intro-opt-out';
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.id = 'productIntroDoNotShow'; checkbox.checked = completed();
    checkboxLabel.append(checkbox, document.createTextNode('もう表示しない'));
    checkbox.addEventListener('change', remember);
    guideLink.replaceWith(footerOptions); footerOptions.append(checkboxLabel, guideLink);
    dialog.querySelector('[data-step="0"]').innerHTML = '<b>01</b> Quiz Palとは';
    document.body.append(dialog);
    dialog.addEventListener("click", event => { const trigger = event.target.closest("[data-author-profile]"); if (trigger) openAuthorProfile(trigger); });
    // Closing the introduction still hands the user over to the actual walkthrough.
    dialog.querySelector('[data-action="close"]').addEventListener("click", () => startGuide());
    dialog.querySelector('[data-action="guide"]').addEventListener("click", () => startGuide(true));
    dialog.querySelector('[data-action="back"]').addEventListener("click", () => { turnPage(-1); });
    dialog.querySelector('[data-action="next"]').addEventListener("click", () => { if (step === 2) startGuide(); else turnPage(1, { focus: true }); });
    dialog.querySelectorAll("[data-step]").forEach(button => button.addEventListener("click", () => { scrollToSection(['overview', 'conversation', 'portable'][Number(button.dataset.step)]); }));
    dialog.addEventListener("cancel", event => { event.preventDefault(); close(); });
    dialog.addEventListener("close", () => { if (dialog && !dialog.open) finishClose(); });
    dialog.querySelector('.product-intro-nav').insertAdjacentHTML('beforeend', '<div class="intro-feature-switch" role="group" aria-label="2つの使い方"><button type="button" data-feature="conversation">AIに聞き直す</button><button type="button" data-feature="images">図解を保存する</button></div>');
    render({ focus: false });
    document.body.style.overflow = "hidden";
    dialog.showModal();
    dialog.querySelector("#productIntroTitle").tabIndex = -1;
    dialog.querySelector("#productIntroTitle").focus({ preventScroll: true });
  }

  window.quizZenIntro = Object.freeze({ open, close, version: VERSION });
  function openWhenReady(attempt = 0) {
    if (completed()) return;
    if (document.querySelector("#questionText")?.textContent?.trim() || attempt >= 25) open();
    else window.setTimeout(() => openWhenReady(attempt + 1), 150);
  }
  if (document.readyState === "complete") window.setTimeout(openWhenReady, 350);
  else window.addEventListener("load", () => window.setTimeout(openWhenReady, 350), { once: true });
})();



