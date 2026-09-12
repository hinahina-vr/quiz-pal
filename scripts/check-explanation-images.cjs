const {chromium,expect}=require(process.env.PLAYWRIGHT_TEST_MODULE||'playwright/test');
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
(async()=>{
 const out=path.resolve(process.env.QA_OUTPUT);await fs.mkdir(out,{recursive:true});
 const executablePath=process.env.QA_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe';
 const entry=pathToFileURL(path.resolve(process.env.QA_HTML)).href;
 const profile=path.join(out,'profile-'+Date.now());
 let context;let page;const checks=[],errors=[],external=[];let version;
 const start=async p=>{
  context=await chromium.launchPersistentContext(p,{executablePath,headless:true,viewport:{width:1440,height:900},acceptDownloads:true});
  await context.setOffline(true);page=await context.newPage();version=context.browser().version();
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url())});
  page.on('dialog',d=>d.accept());
  await page.goto(entry);await expect(page.locator('html')).toHaveAttribute('data-html-ready','quiz');
  await page.waitForTimeout(700);if(await page.locator('.product-intro[open]').count()){await page.locator('#productIntroDoNotShow').check();await page.locator('.product-intro-close').click();if(await page.locator('.quiz-tour-skip').isVisible())await page.locator('.quiz-tour-skip').click();}
 };
 const mark=s=>{checks.push(s);console.log('PASS',s)};
 const gallery=()=>page.locator('#llmImageGallery img');
 const open=async()=>{await page.locator('#explanationImagesButton').click();await expect(page.locator('#explanationImagesDialog')).toHaveJSProperty('open',true)};
 const close=async()=>{await page.locator('#explanationImagesClose').click();await expect(page.locator('#explanationImagesDialog')).toHaveJSProperty('open',false)};
 const imageBytes=async()=>gallery().evaluateAll(images=>images.map(i=>i.src));
 try{
  await start(profile);
  const fixture=path.join(out,'explanation-fixture.png');
  await page.locator('#questionText').screenshot({path:fixture});
  await open();await expect(page.locator('#llmExplanationPanel')).toBeHidden();await expect(page.locator('.llm-image-empty')).toContainText('保存画像はありません');
  const questionBefore=await page.locator('#questionNumber').textContent();
  await page.keyboard.press('1');await page.keyboard.press('ArrowRight');expect(await page.locator('#questionNumber').textContent()).toBe(questionBefore);
  mark('Direct explanation-images button opens saved images without opening AI or changing the quiz');
  const chooser=page.waitForEvent('filechooser');await page.locator('#llmImageAdd').click();await (await chooser).setFiles(fixture);
  await expect(gallery()).toHaveCount(1);await expect(page.locator('#llmImageStatus')).toContainText('1件');
  await expect(gallery()).toHaveJSProperty('complete',true);expect(await gallery().evaluate(i=>i.naturalWidth)).toBeGreaterThan(0);
  const expected='data:image/png;base64,'+(await fs.readFile(fixture)).toString('base64');expect((await imageBytes())[0]).toBe(expected);
  const compact=await gallery().boundingBox();await gallery().click();await expect(gallery()).toHaveAttribute('aria-expanded','true');
  await page.screenshot({path:path.join(out,'desktop-image-expanded.png')});
  await gallery().press('Enter');await expect(gallery()).toHaveAttribute('aria-expanded','false');
  await close();await expect(page.locator('#explanationImagesButton')).toBeFocused();await open();expect((await imageBytes())[0]).toBe(expected);
  mark('File picker stores exact image bytes; reopen and image enlargement work');
  await page.locator('#llmImageInput').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('not an image')});
  await expect(page.locator('#llmImageStatus')).toContainText('画像として読み取れない');expect((await imageBytes())[0]).toBe(expected);mark('Invalid image is rejected without damaging the saved image');
  await page.keyboard.press('Escape');await expect(page.locator('#explanationImagesDialog')).toHaveJSProperty('open',false);await expect(page.locator('#explanationImagesButton')).toHaveAttribute('aria-expanded','false');
  await page.reload();await expect(page.locator('html')).toHaveAttribute('data-html-ready','quiz');await open();await expect(gallery()).toHaveCount(1);expect((await imageBytes())[0]).toBe(expected);
  for(const width of [640,390,320]){
   await page.setViewportSize({width,height:844});await expect(gallery()).toBeVisible();
   const bounds=await page.locator('#explanationImagesDialog').boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);
   expect(await page.locator('#explanationImagesDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
   await page.screenshot({path:path.join(out,`images-${width}.png`)});
  }
  mark('Reload, Escape and image-dialog layout work at 640, 390 and 320 pixels');
  await close();await page.setViewportSize({width:1440,height:900});
  const download=page.waitForEvent('download');await page.locator('#fullDataSaveButton').click();const backup=path.join(out,'image-backup.json');await (await download).saveAs(backup);
  const saved=JSON.parse(await fs.readFile(backup,'utf8'));expect(saved.summary.llmImages).toBe(1);
  expect(saved.studio.stores.settings.find(s=>s.key==='llm-image-library-v1').value.items[0].dataUrl).toBe(expected);
  mark('Save downloads a real full backup containing the exact image bytes');
  await context.close();await start(profile);await open();await expect(gallery()).toHaveCount(1);expect((await imageBytes())[0]).toBe(expected);
  mark('Actual browser shutdown and restart retain the saved image');
  await context.close();await start(path.join(out,'restored-profile-'+Date.now()));
  await page.locator('#fullDataLoadInput').setInputFiles(backup);await expect(page.locator('#fullDataStatus')).toContainText('ロード完了');await page.waitForTimeout(1300);await expect(page.locator('html')).toHaveAttribute('data-html-ready','quiz');
  await open();await expect(gallery()).toHaveCount(1);expect((await imageBytes())[0]).toBe(expected);
  await page.screenshot({path:path.join(out,'restored-images.png')});
  mark('Load restores the exported image in a fresh browser profile');
  await page.locator('[data-llm-image-delete]').click();await expect(gallery()).toHaveCount(0);await close();await page.reload();await expect(page.locator('html')).toHaveAttribute('data-html-ready','quiz');await open();await expect(gallery()).toHaveCount(0);await close();
  mark('Deleting a saved image persists after reload');
  if(process.env.QA_OLD_BACKUP){
   await page.locator('#fullDataLoadInput').setInputFiles(path.resolve(process.env.QA_OLD_BACKUP));await expect(page.locator('#fullDataStatus')).toContainText('ロード完了');await page.waitForTimeout(1300);await expect(page.locator('html')).toHaveAttribute('data-html-ready','quiz');
   await expect(page.locator('.product-intro')).toBeVisible();await page.locator('#productIntroDoNotShow').check();await page.locator('.product-intro-close').click();if(await page.locator('.quiz-tour-skip').isVisible())await page.locator('.quiz-tour-skip').click();
   await open();await expect(gallery()).toHaveCount(1);await expect(gallery()).toHaveJSProperty('complete',true);expect(await gallery().evaluate(i=>i.naturalWidth)).toBeGreaterThan(0);await close();
   mark('The previous HTML release backup displays its saved image through the new button');
  }
  await page.locator('#llmTeachButton').click();await expect(page.locator('#llmSetupGuide')).toBeVisible();await page.locator('#llmImageLibraryToggle').click();await expect(page.locator('#explanationImagesDialog')).toHaveJSProperty('open',true);await close();await page.locator('#llmPanelClose').click();
  mark('Existing AI settings and image entry remain operable');
  expect(errors).toEqual([]);expect(external).toEqual([]);
  await fs.writeFile(path.join(out,'results.json'),JSON.stringify({passed:true,entry,browser:version,os:'Windows',checks,errors,external},null,2));
 }catch(error){await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});await fs.writeFile(path.join(out,'failure.json'),JSON.stringify({error:String(error),checks,errors},null,2));throw error}
 finally{await context?.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
