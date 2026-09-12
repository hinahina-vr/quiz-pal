const {chromium,expect}=require(process.env.PLAYWRIGHT_TEST_MODULE||'playwright/test');
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url');
(async()=>{
 const out=path.resolve(process.env.QA_OUTPUT),entry=path.resolve(process.env.QA_HTML),folder=path.dirname(entry);await fs.mkdir(out,{recursive:true});
 const bytes=await fs.readFile(path.join(folder,'guide-captures/binary-study-note.png')),expected='data:image/png;base64,'+bytes.toString('base64');
 const screenshot=await fs.readFile(path.join(folder,'guide-captures/image-library.png'));
 const browser=await chromium.launch({executablePath:process.env.QA_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const views=[],checks=[],errors=[];let page;
 const start=async(viewport={width:1440,height:900},deviceScaleFactor=1)=>{const c=await browser.newContext({viewport,deviceScaleFactor,acceptDownloads:true});await c.setOffline(true);page=await c.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());await page.goto(pathToFileURL(entry).href);await expect(page.locator('.product-intro')).toBeVisible();return c;};
 try{
  for(const [width,height,dpr]of [[3840,2160,1],[3072,1728,1.25],[2560,1440,1.5],[1920,1080,2],[1920,960,2],[1440,900,1],[980,900,1],[390,844,1],[320,640,1],[844,390,1]]){
   const c=await start({width,height},dpr);const modal=page.locator('.product-intro');await modal.locator('[data-feature="images"]').click();await expect(modal).toHaveCSS('opacity','1');await page.evaluate(()=>document.fonts.ready);
   const picture=modal.locator('.intro-image-screen img');await expect.poll(()=>picture.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);await expect(picture).toHaveJSProperty('naturalWidth',screenshot.readUInt32BE(16));await expect(picture).toHaveJSProperty('naturalHeight',screenshot.readUInt32BE(20));
   const fit=await modal.locator('.product-intro-body').evaluate(e=>({height:e.clientHeight,contentHeight:e.scrollHeight,width:e.clientWidth,contentWidth:e.scrollWidth}));expect(fit.contentWidth).toBeLessThanOrEqual(fit.width+1);if(width>=1920)expect(fit.contentHeight).toBeLessThanOrEqual(fit.height+1);
   await expect(modal.locator('#productIntroDoNotShow')).toBeInViewport();await expect(modal.locator('[data-action="next"]')).toBeInViewport();
   if([1920,390].includes(width))await page.screenshot({path:path.join(out,`guide-${width}x${height}.png`),scale:'css'});
   await modal.locator('.intro-image-screen [data-screenshot]').click();await expect(page.locator('.intro-shot-viewer')).toBeVisible();await expect(page.locator('.intro-shot-viewer img')).toHaveJSProperty('complete',true);await page.keyboard.press('Escape');await expect(page.locator('.intro-shot-viewer')).toHaveCount(0);await expect(modal.locator('.intro-image-screen [data-screenshot]')).toBeFocused();
   await modal.locator('[data-feature="conversation"]').click();await expect(modal.locator('.product-intro-hero')).toBeVisible();views.push({viewport:{width,height},dpr,...fit});await c.close();
  }
  checks.push('Replacement screenshot, enlargement, Escape/focus and conversation switch work at ten viewport/DPR settings; five large settings need no scroll');
  let c=await start();await page.locator('#productIntroDoNotShow').check();await page.locator('.product-intro-close').click();if(await page.locator('.quiz-tour-skip').isVisible())await page.locator('.quiz-tour-skip').click();await page.locator('#fullDataLoadInput').setInputFiles(path.resolve(process.env.QA_BACKUP));await expect(page.locator('#fullDataStatus')).toContainText('ロード完了');await page.waitForTimeout(1000);await page.locator('#explanationImagesButton').click();
  const gallery=page.locator('#llmImageGallery img');await expect(gallery).toHaveAttribute('src',expected);await expect(gallery).toHaveJSProperty('complete',true);await gallery.click();await expect(gallery).toHaveAttribute('aria-expanded','true');await page.screenshot({path:path.join(out,'restored-original.png')});await page.locator('#explanationImagesClose').click();
  await page.reload();await page.locator('#explanationImagesButton').click();await expect(gallery).toHaveAttribute('src',expected);await page.locator('#explanationImagesClose').click();
  const dl=page.waitForEvent('download');await page.locator('#fullDataSaveButton').click();const savedPath=path.join(out,'resaved-backup.json');await(await dl).saveAs(savedPath);
  const data=JSON.parse(await fs.readFile(savedPath,'utf8'));expect(data.studio.stores.settings.find(x=>x.key==='llm-image-library-v1').value.items[0].dataUrl).toBe(expected);await c.close();
  checks.push('Actual Web-exported backup restores the original PNG in freshly extracted offline HTML; enlargement, reload and re-export preserve exact bytes');
  c=await start();await page.locator('#productIntroDoNotShow').check();await page.locator('.product-intro-close').click();if(await page.locator('.quiz-tour-skip').isVisible())await page.locator('.quiz-tour-skip').click();await page.locator('#fullDataLoadInput').setInputFiles(savedPath);await expect(page.locator('#fullDataStatus')).toContainText('ロード完了');await page.waitForTimeout(1000);await page.locator('#explanationImagesButton').click();await expect(page.locator('#llmImageGallery img')).toHaveAttribute('src',expected);await c.close();
  checks.push('Re-exported backup restores the same original PNG in a second clean browser context');
  expect(errors).toEqual([]);await fs.writeFile(path.join(out,'results.json'),JSON.stringify({passed:true,browser:browser.version(),imageSha256:crypto.createHash('sha256').update(bytes).digest('hex'),imageSize:bytes.length,views,checks,errors,scope:'Fresh final HTML ZIP; original supplied PNG and real saved-image screenshot. 4K scaling represented by browser viewport and DPR. No image editing or AI calls.'},null,2));console.log('PASS',checks);
 }catch(e){await page?.screenshot({path:path.join(out,'failure.png'),scale:'css'}).catch(()=>{});throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
