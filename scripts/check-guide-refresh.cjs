const {chromium,expect}=require(process.env.PLAYWRIGHT_TEST_MODULE||'playwright/test');
const fs=require('node:fs/promises'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {startServer}=require('./audit-release.cjs');
(async()=>{
 const out=path.resolve(process.env.QA_OUTPUT||'qa-local/guide-refresh');await fs.mkdir(out,{recursive:true});
 const hosted=process.env.QA_HTML?null:await startServer();
 const url=process.env.QA_HTML?pathToFileURL(path.resolve(process.env.QA_HTML)).href:hosted.url;
 const browser=await chromium.launch({executablePath:process.env.QA_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const checks=[],errors=[],failed=[];const mark=name=>{checks.push(name);console.log('PASS',name)};
 let page;
 try{
  if(process.env.QA_BASELINE_URL){const old=await browser.newContext();page=await old.newPage();await page.goto(process.env.QA_BASELINE_URL);await expect(page.locator('.product-intro')).toBeVisible();await expect(page.locator('.product-intro')).toHaveCSS('opacity','1');await expect(page.locator('#productIntroDoNotShow')).toHaveCount(0);const before=await page.locator('.product-intro-lead').evaluate(el=>({font:getComputedStyle(el).fontFamily,weight:getComputedStyle(el).fontWeight,color:getComputedStyle(el).color}));await page.screenshot({path:path.join(out,'before-introduction.png')});await page.locator('.product-intro-close').click();if(await page.locator('.quiz-tour-skip').isVisible())await page.locator('.quiz-tour-skip').click();await page.reload();await page.waitForTimeout(1000);await expect(page.locator('.product-intro')).toHaveCount(0);await fs.writeFile(path.join(out,'before.json'),JSON.stringify({oldDismissalSuppressesFutureVisits:true,noOptOutCheckbox:true,typography:before},null,2));await old.close();mark('Reproduced old thin typography and automatic permanent dismissal without a checkbox');}
  const context=await browser.newContext({viewport:{width:1440,height:960}});page=await context.newPage();
  if(process.env.QA_HTML)await context.setOffline(true);
  await page.addInitScript(()=>localStorage.setItem('quiz-zen-product-intro-version','2'));
  page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)failed.push({path:new URL(r.url()).pathname,status:r.status()})});
  await page.goto(url);const modal=page.locator('.product-intro');
  await expect(modal).toBeVisible();await expect(modal.locator('#productIntroDoNotShow')).not.toBeChecked();await expect(modal.locator('h2')).toContainText('何度でも');
  await page.evaluate(()=>document.fonts.ready);expect(await modal.evaluate(el=>getComputedStyle(el).fontFamily)).toContain('Quiz Pal Rounded');
  mark('Existing introduction completion migrates to visible-by-default with the new bundled font');
  for(const [width,height]of [[1440,960],[1920,1080],[980,900],[390,844],[320,640],[844,390]]){
   await page.setViewportSize({width,height});
   for(const step of [0,1,2]){
    await modal.locator(`[data-step="${step}"]`).click();await page.evaluate(()=>document.fonts.ready);
    await expect(modal).toHaveCSS('opacity','1');
    await expect.poll(()=>modal.locator('img').evaluateAll(images=>images.filter(i=>i.loading!=='lazy').every(i=>i.complete&&i.naturalWidth>0))).toBe(true);
    const box=await modal.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width+1);expect(box.y+box.height).toBeLessThanOrEqual(height+1);
    expect(await modal.locator('.product-intro-body').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    await expect(modal.locator('#productIntroDoNotShow')).toBeInViewport();await expect(modal.locator('[data-action="next"]')).toBeInViewport();
    await page.screenshot({path:path.join(out,`intro-${width}-step${step+1}.png`)});
   }
   mark(`All three introduction pages, checkbox and navigation fit ${width}x${height}`);
  }
  await page.setViewportSize({width:1440,height:960});await modal.locator('[data-step="0"]').click();
  for(const name of ['ai-first-answer.png','ai-follow-up.png','ai-conversation.png']){await modal.locator(`[data-capture-step="${name}"]`).click();await expect(modal.locator('.intro-real-screen').first().locator('img')).toHaveAttribute('src','./guide-captures/'+name);await expect.poll(()=>modal.locator('.intro-real-screen').first().locator('img').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);}
  await modal.locator('[data-screenshot]').first().click();await expect(page.locator('.intro-shot-viewer')).toBeVisible();await expect(page.locator('.intro-shot-viewer img')).toHaveJSProperty('complete',true);await page.keyboard.press('Escape');await expect(page.locator('.intro-shot-viewer')).toHaveCount(0);await expect(modal).toBeVisible();await expect(modal.locator('[data-screenshot]').first()).toBeFocused();mark('Actual conversation screenshots switch, enlarge and return focus without closing the introduction');
  await modal.locator('[data-feature="images"]').click();await expect(modal.locator('#introImageTitle')).toBeInViewport();await expect.poll(()=>modal.locator('.intro-image-screen img').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);await page.screenshot({path:path.join(out,'image-saving-guide.png')});await modal.locator('.intro-image-screen [data-screenshot]').click();await expect(page.locator('.intro-shot-viewer')).toBeVisible();await page.locator('.intro-shot-viewer button').click();mark('Image-saving section links to a real saved-diagram screenshot and explains backup');
  for(const method of ['close','escape']){if(method==='close')await modal.locator('[data-action="close"]').click();else await page.keyboard.press('Escape');await expect(modal).toHaveCount(0);await page.reload();await expect(modal).toBeVisible();await expect(modal.locator('#productIntroDoNotShow')).not.toBeChecked();}mark('Close and Escape both show the introduction again on the next visit unless checked');
  await modal.locator('#productIntroDoNotShow').check();await modal.locator('[data-action="close"]').click();await page.reload();await page.waitForTimeout(850);await expect(modal).toHaveCount(0);await page.locator('#quizGuideButton').click();await expect(modal.locator('#productIntroDoNotShow')).toBeChecked();await modal.locator('#productIntroDoNotShow').uncheck();await modal.locator('[data-action="close"]').click();await page.reload();await expect(modal).toBeVisible();mark('Explicit opt-out persists and can be reversed by reopening the guide');
  await modal.locator('[data-step="1"]').click();await modal.locator('[data-provider="openrouter"]').click();await modal.locator('[data-action="setup"]').click();await expect(page.locator('#llmProviderModelInput')).toHaveValue('deepseek/deepseek-v4-flash');await expect(page.locator('#llmApiKeyInput')).toHaveValue('');await page.locator('#llmPanelClose').click();mark('OpenRouter setup selects the requested model without a bundled key or AI request');
  await page.locator('#quizGuideButton').click();await modal.locator('[data-step="2"]').click();await modal.locator('[data-action="next"]').click();await expect(page.locator('.quiz-tour-layer')).toBeVisible();await expect(page.locator('.quiz-tour-dot')).toHaveCount(9);await expect(page.locator('.quiz-tour-title')).toHaveText('科目を選びます');await page.locator('.quiz-tour-skip').click();mark('Completing the introduction starts the existing spotlight walkthrough with the new image step');
  expect(errors).toEqual([]);expect(failed).toEqual([]);await context.close();
  await fs.writeFile(path.join(out,'results.json'),JSON.stringify({passed:true,browser:browser.version(),mode:process.env.QA_HTML?'fresh file HTML offline':'local HTTP',checks,errors,failed},null,2));
 }catch(e){await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw e;}
 finally{await browser.close();if(hosted){hosted.server.closeAllConnections();await new Promise(r=>hosted.server.close(r));}}
})().catch(e=>{console.error(e);process.exitCode=1});
