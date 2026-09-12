/* Non-modal reading windows. The image window follows the image's aspect ratio. */
(() => {
  const localStudyImageUrl = item => item.dataUrl;
  const llm = document.querySelector('#llmExplanationPanel');
  const body = document.querySelector('#llmExplanationBody');
  if (!llm || !body) return;
  const button = document.querySelector('#explanationImagesButton');
  const galleryCount = document.createElement('span');
  galleryCount.className = 'study-image-count';
  galleryCount.hidden = true;
  galleryCount.setAttribute('aria-hidden','true');
  button?.append(galleryCount);
  const workspace = document.createElement('div');
  workspace.className = 'study-content-workspace';
  body.before(workspace);
  workspace.innerHTML = '<nav class="study-content-tabs" aria-label="解説の表示"><button type="button" data-content="text">解説</button><button type="button" data-content="image">解説図</button></nav>';
  workspace.append(body);
  workspace.dataset.view = 'text';

  const viewer = document.createElement('section');
  viewer.className = 'study-image-panel study-floating-panel';
  viewer.hidden = true;
  viewer.setAttribute('role', 'region');
  viewer.setAttribute('aria-label', '解説図');
  viewer.innerHTML = `
    <header class="study-window-header"><div class="study-move-handle" tabindex="0" aria-label="解説図の位置を移動"><span aria-hidden="true">⠿</span><strong>解説図</strong></div><button type="button" data-action="register" title="この問題の解説図を登録">＋ 画像登録</button><button type="button" data-action="close" aria-label="解説図を閉じる">×</button></header>
    <p class="study-image-save-status" role="status" aria-live="polite" hidden></p>
    <div class="study-image-toolbar"><div class="study-placement" role="group" aria-label="画像の表示位置"><button type="button" data-placement="left">解説の左</button><button type="button" data-placement="inside">解説内</button><button type="button" data-placement="float">自由配置</button></div><button type="button" data-action="question">問題文</button></div>
    <div class="study-image-controls"><div class="study-image-zoom" role="group" aria-label="画像とウィンドウの大きさ"><button type="button" data-action="fit" title="全体を表示（×1）" aria-label="全体を表示（1倍）" aria-pressed="false">×1</button><button type="button" data-window-scale="2" aria-label="画像とウィンドウを2倍に拡大" aria-pressed="false">×2</button><button type="button" data-window-scale="3" aria-label="画像とウィンドウを3倍に拡大" aria-pressed="false">×3</button><button type="button" data-window-scale="4" aria-label="画像とウィンドウを4倍に拡大" aria-pressed="false">×4</button><button type="button" data-action="out" aria-label="画像を縮小">−</button><button type="button" data-action="in" aria-label="画像を拡大">＋</button><output aria-live="polite"></output></div><div class="study-image-gallery" hidden><div class="study-image-navigation"><button type="button" data-action="previous-image" aria-label="前の解説図">‹</button><span class="study-image-position" role="status" aria-live="polite"></span><button type="button" data-action="next-image" aria-label="次の解説図">›</button><select aria-label="表示する解説図"></select></div><div class="study-image-thumbnails" role="group" aria-label="解説図の一覧"></div></div></div>
    <div class="study-image-viewport"><div class="study-image-canvas"><div class="study-image-object" hidden><img alt="" draggable="false"></div></div><p class="study-image-message" role="status"></p></div>
    <footer class="study-image-help">画像をドラッグで移動 · 2本指で拡縮 · ×1で全体表示</footer>`;
  document.body.append(viewer);
  const viewport = viewer.querySelector('.study-image-viewport');
  const object = viewer.querySelector('.study-image-object');
  const image = object.querySelector('img');
  let scaleHandle;
  const selector = viewer.querySelector('select');
  const gallery = viewer.querySelector('.study-image-gallery');
  const thumbnails = viewer.querySelector('.study-image-thumbnails');
  const position = viewer.querySelector('.study-image-position');
  const previousImage = viewer.querySelector('[data-action="previous-image"]');
  const nextImage = viewer.querySelector('[data-action="next-image"]');
  const message = viewer.querySelector('.study-image-message');
  const output = viewer.querySelector('output');
  const registerButton = viewer.querySelector('[data-action="register"]');
  const saveStatus = viewer.querySelector('.study-image-save-status');
  let registrationIds = null;
  const imagePointers = new Map();
  let imageGesture = null;
  let placement = 'left', selectedId = '', selectedUrl = '', items = [], galleryMode = false;
  let currentId = '', width = 360, fitWidth = 360, layer = 1450;
  let reader, explanationCompact = false, expandedImageWindow = false, needsInitialScale = false;
  let gallerySignature = '';
  const phoneReading = matchMedia('(max-width:600px), (max-width:980px) and (max-height:600px) and (pointer:coarse)');
  let readingAnswer, readingSuspended = false, readingTap;
  try { const saved = localStorage.getItem('quiz-zen-diagram-placement'); if (['left','inside','float'].includes(saved)) placement = saved; } catch {}

  function setReadingControls(hidden) {
    llm.classList.toggle('study-controls-hidden', hidden);
    if (hidden && llm.contains(document.activeElement) && !body.contains(document.activeElement)) {
      document.activeElement.blur();
      body.focus({preventScroll:true});
    }
  }
  function syncMobileReading({hideControls = false} = {}) {
    const enabled = phoneReading.matches && !llm.hidden && llm.classList.contains('answer-mode') && viewer.hidden && !readingSuspended;
    const entering = enabled && !llm.classList.contains('study-mobile-reading');
    llm.classList.toggle('study-mobile-reading', enabled);
    document.documentElement.classList.toggle('study-answer-fullscreen', enabled);
    if (!enabled) setReadingControls(false);
    else if (entering || hideControls) setReadingControls(true);
  }
  body.tabIndex = 0;
  body.setAttribute('aria-label','LLM回答。スマホではタップで操作ボタンを表示・非表示');
  body.addEventListener('pointerdown', event => {
    readingTap = null;
    if (!llm.classList.contains('study-mobile-reading') || !event.isPrimary || event.button !== 0 || event.target.closest('a,button,input,textarea,select,summary,[contenteditable="true"],img')) return;
    readingTap = {id:event.pointerId,x:event.clientX,y:event.clientY,time:event.timeStamp,scroll:body.scrollTop};
  }, {passive:true});
  body.addEventListener('pointermove', event => {
    if (readingTap && (event.pointerId !== readingTap.id || Math.hypot(event.clientX-readingTap.x,event.clientY-readingTap.y)>8)) readingTap=null;
  }, {passive:true});
  body.addEventListener('pointercancel', () => {readingTap=null;}, {passive:true});
  body.addEventListener('pointerup', event => {
    const tap=readingTap;readingTap=null;
    if (!tap || event.pointerId!==tap.id || event.timeStamp-tap.time>500 || Math.abs(body.scrollTop-tap.scroll)>2 || Math.hypot(event.clientX-tap.x,event.clientY-tap.y)>8 || !window.getSelection()?.isCollapsed) return;
    setReadingControls(!llm.classList.contains('study-controls-hidden'));
  }, {passive:true});
  body.addEventListener('keydown', event => {
    if (!llm.classList.contains('study-mobile-reading')) return;
    if (event.key==='Tab') setReadingControls(false);
    if (event.key==='Enter' && event.target===body) {event.preventDefault();setReadingControls(!llm.classList.contains('study-controls-hidden'));}
  });
  phoneReading.addEventListener('change', () => syncMobileReading());

  function front(panel) { if (!panel.classList.contains('study-embedded')) panel.style.zIndex = String(++layer); }
  function updateDiagramButton() {
    if (!button) return;
    const count=items.filter(item=>String(item.questionId)===currentId).length;
    const hasImages=count>0;
    button.classList.toggle('has-saved-images',hasImages);
    galleryCount.hidden = !hasImages;
    galleryCount.textContent = `${count}枚`;
    button.title=hasImages ? `保存済みの解説図${count}枚を表示` : 'この問題の解説図を表示';
    button.setAttribute('aria-label',button.title);
  }
  function setRect(panel, rect, {preserveSize = false} = {}) {
    panel.classList.add('study-positioned');
    if(panel===llm && panel.classList.contains('loading-compact')) {
      // Move the compact notice without overwriting the expanded reading size.
      Object.assign(panel.style,{left:`${rect.left}px`,top:`${rect.top}px`});
      return;
    }
    const expanded = panel === viewer && expandedImageWindow;
    if (panel === viewer) {
      viewer.classList.toggle('study-window-expanded', expanded);
      viewer.style.setProperty('--study-window-controls-width', `${Math.max(140, innerWidth - Math.max(0, rect.left) - 8)}px`);
    }
    const w = preserveSize ? rect.width : Math.min(expanded ? Infinity : innerWidth - 16, Math.max(Math.min(panel===viewer ? 62 : 280, innerWidth - 16), rect.width));
    const h = preserveSize ? rect.height : Math.min(expanded ? Infinity : innerHeight - 16, Math.max(Math.min(panel===viewer ? 1 : panel===llm ? 560 : 220, innerHeight - 16), rect.height));
    Object.assign(panel.style, {left: `${rect.left}px`, top: `${rect.top}px`, width: `${w}px`, height: `${h}px`});
  }
  function bringIntoView(panel) {
    if (!panel.classList.contains('study-positioned')) return;
    const rect=panel.getBoundingClientRect();
    // Only an explicit reopen brings a window back. Dragging, zooming and response
    // updates preserve off-screen positions so the window never snaps back.
    setRect(panel,{...rect.toJSON(),left:Math.max(8,Math.min(innerWidth-rect.width-8,rect.left)),top:Math.max(8,Math.min(innerHeight-rect.height-8,rect.top))});
  }
  function floatImage() {
    viewer.classList.remove('study-embedded');
    document.body.append(viewer);
    workspace.classList.remove('has-diagram');
    setContent('text');
  }
  function initialImageRect() {
    return {left: 18, top: 70, width: Math.min(520, innerWidth - 36), height: Math.min(580, innerHeight * .68)};
  }
  function ensureExplanation() {
    if (!llm.hidden) return;
    const question = currentQuestion();
    if (!question) return;
    // Opening a diagram must not generate a paid LLM answer.
    if (localLlmExplanation(question)) openLlmTutor();
    else { state.llmPanelQuestionId = question.id; setLlmPanelOpen(true); }
  }
  function setContent(view) {
    workspace.dataset.view = view;
    llm.classList.toggle('study-embedded-diagram',view==='image' && viewer.classList.contains('study-embedded'));
    workspace.querySelectorAll('[data-content]').forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.content === view)));
  }
  function arrange(next, {openExplanation = true, fit = false} = {}) {
    placement = next;
    try { localStorage.setItem('quiz-zen-diagram-placement', next); } catch {}
    if (next === 'inside') {
      if (openExplanation) ensureExplanation();
      setLlmImageLibraryOpen(false,{refresh:false});
      if(phoneReading.matches) setRect(llm,{left:8,top:8,width:innerWidth-16,height:innerHeight-16});
      viewer.classList.add('study-embedded');
      workspace.append(viewer);
      workspace.classList.add('has-diagram');
      setContent('image');
    } else {
      floatImage();
      if (next === 'left' && !llm.hidden) {
        if (innerWidth >= 760) {
          const leftWidth = Math.min(560, Math.round(innerWidth * .38));
          setRect(viewer, {left:16, top:24, width:leftWidth, height:innerHeight-48});
          setRect(llm, {left:leftWidth+28, top:24, width:innerWidth-leftWidth-44, height:innerHeight-48});
        } else {
          // A phone keeps both regions readable by stacking them.
          const topHeight = Math.round(innerHeight * .43);
          setRect(viewer, {left:8, top:8, width:innerWidth-16, height:topHeight});
          setRect(llm, {left:8, top:topHeight+16, width:innerWidth-16, height:innerHeight-topHeight-24});
        }
      } else if (!viewer.classList.contains('study-positioned')) setRect(viewer, initialImageRect());
    }
    viewer.querySelectorAll('[data-placement]').forEach(control => control.setAttribute('aria-pressed', String(control.dataset.placement === next)));
    front(viewer);
    if (fit) fitImage();
    else sizeImageWindow();
  }
  function show() {
    viewer.hidden = false;
    document.documentElement.classList.add('study-diagram-open');
    syncMobileReading();
    llm.classList.add('study-diagram-reading');
    button?.setAttribute('aria-expanded','true');
    button?.classList.add('active');
    arrange(placement, {openExplanation:placement === 'inside'});
    if (placement !== 'inside') bringIntoView(viewer);
  }
  function close() {
    clearImageGesture();
    registrationIds = null;
    viewer.hidden = true;
    document.documentElement.classList.remove('study-diagram-open');
    syncMobileReading();
    llm.classList.remove('study-diagram-reading');
    floatImage();
    button?.setAttribute('aria-expanded','false');
    button?.classList.remove('active');
  }
  function scale(value) {
    const maxWidth = expandedImageWindow ? Math.max(6000, Math.round(fitWidth * 4)) : 6000;
    width = Math.round(Math.max(60, Math.min(maxWidth, value)));
    object.style.width = `${width}px`;
    scaleHandle.setAttribute('aria-valuemax',String(maxWidth));
    scaleHandle.setAttribute('aria-valuenow',String(width));
    scaleHandle.setAttribute('aria-valuetext',`${Math.round(width / fitWidth * 100)}%`);
    output.textContent = `${Math.round(width / fitWidth * 100)}%`;
    viewer.querySelectorAll('[data-window-scale]').forEach(control => control.setAttribute('aria-pressed', String(Math.abs(width / fitWidth - Number(control.dataset.windowScale)) < .01)));
    viewer.querySelector('[data-action="fit"]').setAttribute('aria-pressed',String(Math.abs(width / fitWidth - 1) < .01));
    sizeImageWindow();
    renderGalleryPosition(true);
  }
  function scaleImageWindow(factor) {
    if (!image.naturalWidth || object.hidden || viewer.hidden) return;
    // A preset enlarges the frame along with the image, including beyond the screen.
    // Detach an embedded/side-by-side image so the explanation cannot constrain it.
    freeForDrag(viewer);
    expandedImageWindow = true;
    scale(fitWidth * factor);
    viewport.scrollTo(0,0);
  }
  function initializeImageSize() {
    if (!needsInitialScale || !image.complete || !image.naturalWidth || viewer.hidden) return;
    needsInitialScale = false;
    fitImage();
    if (!phoneReading.matches) scaleImageWindow(3);
  }
  function imageChromeHeight() {
    return [...viewer.children].filter(child=>child!==viewport && !child.classList.contains('study-window-resize')).reduce((total,child)=>total+child.getBoundingClientRect().height,0);
  }
  function sizeImageWindow() {
    if (viewer.hidden || object.hidden || !image.naturalWidth || viewer.classList.contains('study-embedded')) return;
    // Size the controls first, then measure them at the new width. Only the image
    // may scroll when zoomed beyond the screen; there is no separate blank canvas.
    const rect=viewer.getBoundingClientRect();
    // Fitted portrait images still need room for the phone's registration controls.
    const frameWidth=phoneReading.matches ? Math.max(width+2,Math.min(280,innerWidth-16)) : width+2;
    setRect(viewer,{...rect.toJSON(),width:frameWidth});
    const scrollbar=viewport.offsetHeight-viewport.clientHeight;
    const availableHeight=placement==='left' && !llm.hidden ? (innerWidth>=760 ? innerHeight-48 : Math.round(innerHeight*.43)) : Infinity;
    setRect(viewer,{...rect.toJSON(),width:frameWidth,height:Math.min(availableHeight,imageChromeHeight()+image.getBoundingClientRect().height+scrollbar+2)});
  }
  function fitImage() {
    if (!image.naturalWidth || viewer.hidden || !viewport.clientWidth) return;
    const wasExpanded = expandedImageWindow;
    expandedImageWindow = false;
    viewer.classList.remove('study-window-expanded');
    let bounds=initialImageRect();
    if (viewer.classList.contains('study-embedded')) bounds={width:workspace.clientWidth,height:workspace.clientHeight-workspace.querySelector('nav').offsetHeight};
    else if (placement==='left' && !llm.hidden) bounds=innerWidth>=760
      ? {width:Math.min(560,Math.round(innerWidth*.38)),height:innerHeight-48}
      : {width:innerWidth-16,height:Math.round(innerHeight*.43)};
    // The controls can wrap or acquire a scrollbar as the image window narrows.
    // Re-measure after fitting so the gallery still fits in the allotted reading area.
    for (let pass=0;pass<5;pass++) {
      const chromeHeight=imageChromeHeight();
      const nextWidth=Math.max(60,Math.min(image.naturalWidth,bounds.width-2,Math.max(0,bounds.height-chromeHeight-2)*image.naturalWidth/image.naturalHeight));
      fitWidth=nextWidth;
      scale(fitWidth);
      if (Math.abs(imageChromeHeight()-chromeHeight)<.5) break;
    }
    viewport.scrollTo(0,0);
    if (wasExpanded) bringIntoView(viewer);
  }
  function selectImage(src, title, id = '', {scroll = false} = {}) {
    selectedId = id;
    message.textContent = '';
    object.hidden = false;
    image.alt = title || '解説図';
    // Thumbnails expose an absolute currentSrc, while gallery metadata may use a
    // relative URL. Treat both as the same image so an explanation close/refresh
    // does not reload it and reset the user's zoom via the load handler.
    const url = new URL(src, document.baseURI).href;
    if (url !== selectedUrl) {
      clearImageGesture();
      selectedUrl = url;
      needsInitialScale = true;
      image.onload = initializeImageSize;
      image.onerror = () => { object.hidden=true; message.textContent='画像を開けませんでした。画像資料を更新してください。'; };
      image.src = url;
    }
    selector.value = id;
    renderGalleryPosition(scroll);
    initializeImageSize();
  }
  function renderGalleryPosition(scroll = false) {
    gallery.hidden = !galleryMode || !items.length;
    const multiple = items.length > 1;
    thumbnails.hidden = previousImage.hidden = nextImage.hidden = position.hidden = !multiple;
    const index = items.findIndex(item=>String(item.id)===selectedId);
    position.textContent = `${Math.max(0,index+1)} / ${items.length}`;
    position.setAttribute('aria-label',`${Math.max(0,index+1)}枚目、全${items.length}枚`);
    previousImage.disabled = index <= 0;
    nextImage.disabled = index < 0 || index >= items.length-1;
    for (const thumbnail of thumbnails.children) {
      const active = thumbnail.dataset.galleryImageId === selectedId;
      thumbnail.setAttribute('aria-pressed',String(active));
      thumbnail.tabIndex = active ? 0 : -1;
    }
    if (scroll && !gallery.hidden && multiple) {
      const id = selectedId;
      requestAnimationFrame(()=>{
        if (selectedId !== id || viewer.hidden) return;
        const active = [...thumbnails.children].find(node=>node.dataset.galleryImageId===id);
        if (!active) return;
        const row=thumbnails.getBoundingClientRect(), tile=active.getBoundingClientRect();
        if (tile.left<row.left) thumbnails.scrollLeft += tile.left-row.left;
        else if (tile.right>row.right) thumbnails.scrollLeft += tile.right-row.right;
      });
    }
  }
  function selectGalleryImage(id, {focus = false} = {}) {
    const item = items.find(item=>String(item.id)===String(id));
    if (!galleryMode || !item) return;
    selectImage(localStudyImageUrl(item),item.name,String(item.id),{scroll:true});
    if (focus) [...thumbnails.children].find(node=>node.dataset.galleryImageId===selectedId)?.focus({preventScroll:true});
  }
  function stepGallery(direction) {
    const index = items.findIndex(item=>String(item.id)===selectedId);
    if (index >= 0 && items[index+direction]) selectGalleryImage(items[index+direction].id);
  }
  function updateGallery() {
    const signature = JSON.stringify(items.map(item=>[String(item.id),item.name,localStudyImageUrl(item)]));
    if (signature !== gallerySignature) {
      gallerySignature = signature;
      selector.replaceChildren(...items.map((item,index) => {const option=document.createElement('option');option.value=String(item.id);option.textContent=`${index+1}. ${item.name || '解説図'}`;return option;}));
      thumbnails.replaceChildren(...items.map((item,index)=>{
        const tile=document.createElement('button');tile.type='button';tile.className='study-image-thumbnail';tile.dataset.galleryImageId=String(item.id);
        tile.setAttribute('aria-label',`${index+1}枚目：${item.name || '解説図'}`);tile.title=`${index+1}. ${item.name || '解説図'}`;
        const preview=document.createElement('img');preview.src=localStudyImageUrl(item);preview.alt='';preview.loading='lazy';preview.decoding='async';preview.referrerPolicy='no-referrer';
        const number=document.createElement('span');number.className='study-image-thumbnail-number';number.textContent=String(index+1);
        const name=document.createElement('span');name.className='study-image-thumbnail-name';name.textContent=item.name || '解説図';
        tile.append(preview,number,name);return tile;
      }));
    }
    if (!galleryMode) {renderGalleryPosition();return;}
    const chosen = items.find(item => String(item.id) === selectedId) || items[0];
    if (chosen) selectImage(localStudyImageUrl(chosen), chosen.name, String(chosen.id));
    else {selectedId='';selectedUrl='';needsInitialScale=false;image.removeAttribute('src');object.hidden=true;renderGalleryPosition();}
    sizeImageWindow();
  }
  function openImage(source) {
    currentId = String(currentQuestion()?.id || '');
    galleryMode = Boolean(source.dataset.studyImageId);
    items = llmImageItems;
    selectedId = source.dataset.studyImageId || '';
    show();
    updateGallery();
    selectImage(source.currentSrc || source.src, source.alt, selectedId);
    viewer.querySelector('.study-move-handle').focus({preventScroll:true});
  }
  async function openGallery() {
    const question = currentQuestion(); if (!question) return;
    currentId = String(question.id); galleryMode = true;
    items = llmImageItems;
    show(); updateGallery();
    message.textContent = items.length ? '' : '画像資料を読み込み中…';
    await refreshLlmImages();
  }
  function readerText() {
    const question=currentQuestion(); if(!question) return '';
    const view=currentViewQuestion();
    return [course().name+' / '+chapter().title, normalizeClipboardText(view.prompt)||htmlToClipboardText(view.promptHtml), ...(view.options||[]).map((option,i)=>optionClipboardText(question,view,option,i))].join('\n\n');
  }
  function openReader() {
    if (!reader) {
      reader=document.createElement('section'); reader.className='study-reader-panel study-floating-panel'; reader.setAttribute('role','region'); reader.setAttribute('aria-label','問題文');
      reader.innerHTML='<header class="study-window-header"><div class="study-move-handle" tabindex="0" aria-label="問題文の位置を移動"><span aria-hidden="true">⠿</span><strong>問題文</strong></div><button type="button" aria-label="問題文を閉じる">×</button></header><div class="study-reader-text" tabindex="0"></div>';
      reader.querySelector('button').onclick=()=>{reader.hidden=true;};document.body.append(reader);makeMovable(reader,reader.querySelector('.study-move-handle'));makeResizable(reader);
      setRect(reader,{left:Math.max(16,innerWidth*.2),top:90,width:Math.min(550,innerWidth-32),height:innerHeight*.64});
    }
    reader.querySelector('.study-reader-text').textContent=readerText(); reader.hidden=false;bringIntoView(reader);front(reader);
  }
  function pointerGesture(handle, start) {
    handle.addEventListener('pointerdown',event=>{
      if(event.button!==0 || event.target.closest('button,select,input,textarea,a') && event.target !== handle) return;
      const move=start(event); if(!move)return;
      event.preventDefault();event.stopPropagation();handle.setPointerCapture(event.pointerId);
      const motion=e=>{if(e.pointerId===event.pointerId)move(e);};
      const end=e=>{if(e.pointerId!==event.pointerId)return;handle.removeEventListener('pointermove',motion);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',end);handle.removeEventListener('lostpointercapture',end);};
      handle.addEventListener('pointermove',motion);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);handle.addEventListener('lostpointercapture',end);
    });
  }
  function freeForDrag(panel) {
    if (panel===llm && llm.classList.contains('study-mobile-reading')) {
      const rect=llm.getBoundingClientRect();
      readingSuspended=true;syncMobileReading();setRect(llm,rect,{preserveSize:true});
    }
    if(panel===viewer && placement!=='float') {
      const rect=viewer.getBoundingClientRect();floatImage();setRect(viewer,rect);arrange('float');
    }
    if(panel===llm && !viewer.hidden && placement==='left') arrange('float');
    front(panel);
  }
  function makeMovable(panel,handle) {
    handle.classList.add('study-move-handle');handle.title='ドラッグで移動 / 矢印キーで調整';
    if(!handle.hasAttribute('tabindex'))handle.tabIndex=0;
    pointerGesture(handle,event=>{freeForDrag(panel);const r=panel.getBoundingClientRect(),x=event.clientX,y=event.clientY;return e=>setRect(panel,{...r.toJSON(),left:r.left+e.clientX-x,top:r.top+e.clientY-y},{preserveSize:true});});
    handle.addEventListener('keydown',event=>{
      if(event.target!==handle || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
      event.preventDefault();event.stopPropagation();freeForDrag(panel);const r=panel.getBoundingClientRect(),step=event.shiftKey?40:10;
      setRect(panel,{...r.toJSON(),left:r.left+(event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0),top:r.top+(event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0)},{preserveSize:true});
    });
    panel.addEventListener('pointerdown',()=>front(panel),true);
  }
  function makeResizable(panel) {
    const grip=document.createElement('button');grip.type='button';grip.className='study-window-resize';grip.textContent='◢';grip.setAttribute('aria-label','ウィンドウの大きさを変更');grip.title='枠の大きさを変更';panel.append(grip);
    if(panel===viewer){scaleHandle=grip;grip.setAttribute('role','slider');grip.setAttribute('aria-valuemin','60');grip.setAttribute('aria-valuemax','6000');grip.setAttribute('aria-label','画像の比率を保って拡大縮小');grip.title='画像の比率を保って拡大縮小';makeImageScalable(grip);return;}
    pointerGesture(grip,event=>{freeForDrag(panel);const r=panel.getBoundingClientRect(),x=event.clientX,y=event.clientY;return e=>setRect(panel,{...r.toJSON(),width:r.width+e.clientX-x,height:r.height+e.clientY-y});});
    grip.addEventListener('keydown',event=>{if(!event.key.startsWith('Arrow'))return;event.preventDefault();event.stopPropagation();freeForDrag(panel);const r=panel.getBoundingClientRect();setRect(panel,{...r.toJSON(),width:r.width+(event.key==='ArrowRight'?20:event.key==='ArrowLeft'?-20:0),height:r.height+(event.key==='ArrowDown'?20:event.key==='ArrowUp'?-20:0)});});
    if (panel === llm) makeEdgeResizable(panel);
  }
  function makeEdgeResizable(panel) {
    const resize = (rect, edge, dx, dy) => {
      const maxWidth=innerWidth-16, maxHeight=innerHeight-16;
      const nextWidth=Math.max(Math.min(280,maxWidth),Math.min(maxWidth,rect.width+(edge.includes('w')?-dx:edge.includes('e')?dx:0)));
      const nextHeight=Math.max(Math.min(220,maxHeight),Math.min(maxHeight,rect.height+(edge.includes('n')?-dy:edge.includes('s')?dy:0)));
      setRect(panel,{left:edge.includes('w')?rect.right-nextWidth:rect.left,top:edge.includes('n')?rect.bottom-nextHeight:rect.top,width:nextWidth,height:nextHeight});
    };
    // The existing bottom-right grip remains; add the other corners and all four edges.
    for (const [edge,label] of Object.entries({n:'上',s:'下',w:'左',e:'右',nw:'左上',ne:'右上',sw:'左下'})) {
      const handle=document.createElement('button');handle.type='button';handle.className='study-window-edge-resize';handle.dataset.resizeEdge=edge;
      handle.setAttribute('aria-label',`${label}の境界から解説ウィンドウを拡縮`);handle.title='ドラッグで拡縮 / 矢印キーで調整';panel.append(handle);
      pointerGesture(handle,event=>{freeForDrag(panel);const rect=panel.getBoundingClientRect(),x=event.clientX,y=event.clientY;return next=>resize(rect,edge,next.clientX-x,next.clientY-y);});
      handle.addEventListener('keydown',event=>{
        if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
        event.preventDefault();event.stopPropagation();freeForDrag(panel);
        const step=event.shiftKey?40:20;
        resize(panel.getBoundingClientRect(),edge,event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0,event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0);
      });
    }
  }
  function makeImageScalable(handle) {
    pointerGesture(handle,event=>{const initial=width,x=event.clientX,y=event.clientY,ratio=image.naturalWidth/image.naturalHeight||1;return e=>scale(initial+((e.clientX-x)+(e.clientY-y)*ratio)/2);});
    handle.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowDown','ArrowRight','ArrowUp'].includes(event.key))return;event.preventDefault();event.stopPropagation();scale(width+(['ArrowLeft','ArrowDown'].includes(event.key)?-24:24));});
  }
  makeMovable(viewer,viewer.querySelector('.study-move-handle'));makeResizable(viewer);
  const llmHeader = llm.querySelector('.llm-panel-header');
  llmHeader.setAttribute('aria-label','LLM解説の位置を移動');
  makeMovable(llm,llmHeader);makeResizable(llm);
  function clearImageGesture() {
    const ids=[...imagePointers.keys()];
    imagePointers.clear();imageGesture=null;
    for(const id of ids) if(viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id);
  }
  function imageGestureStart() {
    const points=[...imagePointers.values()];
    if(!points.length){imageGesture=null;return;}
    if(points.length===1) {
      imageGesture={point:points[0],rect:viewer.getBoundingClientRect(),left:viewport.scrollLeft,top:viewport.scrollTop};
      return;
    }
    const center={x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2};
    const original=image.getBoundingClientRect();
    const embedded=viewer.classList.contains('study-embedded');
    if(!embedded) {
      expandedImageWindow=true;
      freeForDrag(viewer);
      const moved=image.getBoundingClientRect(),rect=viewer.getBoundingClientRect();
      setRect(viewer,{...rect.toJSON(),left:rect.left+original.left-moved.left,top:rect.top+original.top-moved.top},{preserveSize:true});
    }
    imageGesture={embedded,width,distance:Math.max(1,Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y)),anchorX:(center.x-original.left)/original.width,anchorY:(center.y-original.top)/original.height};
  }
  viewport.addEventListener('pointerdown',event=>{
    if(event.button!==0 || object.hidden || !image.naturalWidth || imagePointers.size>=2) return;
    event.preventDefault();event.stopPropagation();
    imagePointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    imageGestureStart();
    for(const id of imagePointers.keys()) viewport.setPointerCapture(id);
  });
  viewport.addEventListener('pointermove',event=>{
    if(!imagePointers.has(event.pointerId) || !imageGesture) return;
    event.preventDefault();event.stopPropagation();
    imagePointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    const points=[...imagePointers.values()];
    if(points.length===2) {
      const center={x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2};
      const distance=Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y);
      scale(imageGesture.width*distance/imageGesture.distance);
      const now=image.getBoundingClientRect();
      const dx=center.x-imageGesture.anchorX*now.width-now.left,dy=center.y-imageGesture.anchorY*now.height-now.top;
      if(imageGesture.embedded) viewport.scrollTo(viewport.scrollLeft-dx,viewport.scrollTop-dy);
      else {const rect=viewer.getBoundingClientRect();setRect(viewer,{...rect.toJSON(),left:rect.left+dx,top:rect.top+dy},{preserveSize:true});}
    } else if(expandedImageWindow && !viewer.classList.contains('study-embedded')) {
      const start=imageGesture;
      setRect(viewer,{...start.rect.toJSON(),left:start.rect.left+points[0].x-start.point.x,top:start.rect.top+points[0].y-start.point.y},{preserveSize:true});
    } else viewport.scrollTo(imageGesture.left+imageGesture.point.x-points[0].x,imageGesture.top+imageGesture.point.y-points[0].y);
  });
  const endImagePointer=event=>{
    if(!imagePointers.has(event.pointerId)) return;
    imagePointers.delete(event.pointerId);
    imageGestureStart();
  };
  viewport.addEventListener('pointerup',endImagePointer);
  viewport.addEventListener('pointercancel',clearImageGesture);
  viewport.addEventListener('lostpointercapture',event=>{if(!viewport.hasPointerCapture(event.pointerId))endImagePointer(event);});
  selector.addEventListener('change',()=>selectGalleryImage(selector.value));
  thumbnails.addEventListener('keydown',event=>{
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();event.stopPropagation();
    const index=items.findIndex(item=>String(item.id)===selectedId);
    const next=event.key==='Home' ? 0 : event.key==='End' ? items.length-1 : Math.max(0,Math.min(items.length-1,index+(event.key==='ArrowRight'?1:-1)));
    if (items[next]) selectGalleryImage(items[next].id,{focus:true});
  });
  viewer.addEventListener('click',event=>{
    const target=event.target.closest('button');if(!target)return;
    if(target.dataset.placement){if(target.dataset.placement==='left')ensureExplanation();arrange(target.dataset.placement,{fit:true});}
    if(target.dataset.windowScale)scaleImageWindow(Number(target.dataset.windowScale));
    if(target.dataset.galleryImageId)selectGalleryImage(target.dataset.galleryImageId);
    const action=target.dataset.action;
    if(action==='register' && !registerButton.disabled) {
      registrationIds=new Set(items.map(item=>String(item.id)));
      document.querySelector('#llmImageInput')?.click();
    }
    if(action==='previous-image')stepGallery(-1);if(action==='next-image')stepGallery(1);
    if(action==='close')close();if(action==='question')openReader();if(action==='fit')fitImage();if(action==='in')scale(width*1.2);if(action==='out')scale(width/1.2);
  });
  workspace.querySelector('nav').addEventListener('click',event=>{const tab=event.target.closest('[data-content]');if(tab){setContent(tab.dataset.content);if(tab.dataset.content==='image')requestAnimationFrame(fitImage);}});
  button?.addEventListener('click',event=>{event.stopPropagation();openGallery().catch(()=>{message.textContent='画像資料を開けませんでした';});});
  window.addEventListener('resize',()=>{if(!viewer.hidden && placement==='left' && !llm.hidden)arrange('left',{fit:true});else {for(const panel of [llm,reader])if(panel&&!panel.hidden&&panel.classList.contains('study-positioned'))setRect(panel,panel.getBoundingClientRect());sizeImageWindow();}});
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    if(reader&&!reader.hidden&&reader.contains(event.target)){reader.hidden=true;event.stopImmediatePropagation();}
    else if(!viewer.hidden&&viewer.contains(event.target)){close();button?.focus({preventScroll:true});event.stopImmediatePropagation();}
  },true);
  window.QuizStudyPanels={openImage,openGallery,isImageOpen:()=>!viewer.hidden,
    closeTopWindow(){const top=[reader,viewer,llm].filter(panel=>panel&&!panel.hidden).sort((a,b)=>(Number(b.style.zIndex)||1400)-(Number(a.style.zIndex)||1400))[0];if(top===reader){reader.hidden=true;return true;}if(top===viewer){close();return true;}return false;},
    questionChanged(id){
      if(currentId&&id!==currentId){close();selectedUrl='';image.removeAttribute('src');if(reader&&!reader.hidden)reader.querySelector('.study-reader-text').textContent=readerText();}
      currentId=id;items=[];registrationIds=null;saveStatus.hidden=true;updateDiagramButton();
      // Check saved-image metadata as soon as a question is shown, without opening
      // a reading window. The Android build reads its local image store here.
      if(id)queueMicrotask(()=>{if(currentId===id)refreshLlmImages().catch(()=>{});});
    },
    imageStatusChanged(status,kind,uploading){
      registerButton.disabled=Boolean(uploading);
      registerButton.textContent=uploading?'保存中…':'＋ 画像登録';
      if(registrationIds) {
        saveStatus.hidden=!status;
        saveStatus.textContent=status||'';
        saveStatus.dataset.kind=kind||'';
        sizeImageWindow();
      }
    },
    imagesChanged(next,loading,status,kind,uploading=false){
      items=next;updateDiagramButton();
      window.QuizStudyPanels.imageStatusChanged(status,kind,uploading);
      if(!viewer.hidden) {
        if(registrationIds) {
          const added=items.find(item=>!registrationIds.has(String(item.id)));
          if(added){galleryMode=true;selectedId=String(added.id);for(const item of items)registrationIds.add(String(item.id));}
        }
        if(galleryMode){updateGallery();message.textContent=items.length?'':loading?'画像資料を読み込み中…':(kind==='error'?status:'この問題の解説図はまだありません。「画像登録」から追加できます。');}
      }
    },
    explanationVisibilityChanged(open){
      readingSuspended=false;
      if(!open&&!viewer.hidden&&placement==='inside'){floatImage();arrange('float');}else if(open&&!viewer.hidden&&placement==='left')requestAnimationFrame(()=>arrange('left'));else if(open)bringIntoView(llm);
      syncMobileReading({hideControls:open});
    },
    explanationAnswerChanged(answer){
      const received=Boolean(answer && answer!==readingAnswer);
      readingAnswer=answer;
      if(received)readingSuspended=false;
      syncMobileReading({hideControls:received});
    },
    explanationCompactChanged(compact){
      if(explanationCompact===compact)return;
      explanationCompact=compact;
      if(llm.hidden)return;
      if(!compact && !viewer.hidden && placement==='left')arrange('left');
      else if(llm.classList.contains('study-positioned'))setRect(llm,llm.getBoundingClientRect());
    }
  };
  window.QuizStudyPanels.questionChanged(String(currentQuestion()?.id || ""));
})();
