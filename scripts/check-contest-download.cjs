const {chromium,expect}=require(process.env.PLAYWRIGHT_TEST_MODULE||'playwright/test');
const {startServer}=require('./audit-release.cjs');
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');

(async()=>{
  const out=path.resolve(process.env.QA_OUTPUT);await fs.mkdir(out,{recursive:true});
  const manifest=JSON.parse(await fs.readFile(process.env.QA_MANIFEST||path.resolve(__dirname,'../PUBLICATION_MANIFEST.json'),'utf8'));
  const {server,url}=process.env.QA_URL?{server:null,url:process.env.QA_URL}:await startServer();
  const browser=await chromium.launch({executablePath:process.env.QA_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const checks=[],errors=[],failed=[],external=[];let page;
  const mark=name=>{checks.push(name);console.log('PASS',name)};
  const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
  try{
    const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});
    page=await context.newPage();page.setDefaultTimeout(15000);page.on('dialog',d=>d.accept());
    page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)failed.push({url:r.url().replace(url,'PREVIEW/'),status:r.status()})});
    page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(url))external.push(r.url())});
    await page.goto(url);await expect(page.locator('html')).toHaveAttribute('data-html-ready','quiz');
    const modal=page.locator('.product-intro[open]');await expect(modal).toHaveCSS('opacity','1');
    await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>[...document.querySelectorAll('.product-intro img')].filter(e=>e.getClientRects().length && e.loading!=='lazy').every(e=>e.complete&&e.naturalWidth>0));
    await page.screenshot({path:path.join(out,'introduction.png')});
    await page.locator('[data-step="2"]').click();
    await expect(modal).toContainText('HTML共通版をダウンロード');await expect(modal).not.toContainText('Quiz Pal.exe');
    await expect(modal).not.toContainText('この画面は、サーバーを使わずに動いています');
    for(const [width,height]of [[1440,900],[980,900],[390,844],[320,640],[844,390]]){
      await page.setViewportSize({width,height});
      const box=await modal.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width+1);expect(box.y+box.height).toBeLessThanOrEqual(height+1);
      const footer=await modal.locator('.product-intro-footer').boundingBox();expect(footer.y+footer.height).toBeLessThanOrEqual(height+1);
      await page.screenshot({path:path.join(out,`download-intro-${width}.png`)});
    }
    mark('Web download introduction fits five desktop, narrow and landscape viewports and describes the HTML edition');
    await page.setViewportSize({width:1440,height:900});
    const downloadEvent=page.waitForEvent('download');await page.locator('.product-intro-download').click();const download=await downloadEvent;
    const downloaded=path.join(out,'Quiz-Pal-HTML.zip');await download.saveAs(downloaded);expect(await download.failure()).toBeNull();
    expect(sha256(await fs.readFile(downloaded))).toBe(manifest.download.sha256);
    mark('Actual browser download from the local HTTP site has the exact prepared ZIP hash');
    await page.locator('#productIntroDoNotShow').check();await page.locator('.product-intro-close').click();if(await page.locator('.quiz-tour-skip').isVisible())await page.locator('.quiz-tour-skip').click();await page.evaluate(()=>window.scrollTo(0,0));
    await expect(page.locator('.portable-promo')).toHaveAttribute('href','./downloads/Quiz-Pal-HTML.zip');
    await expect(page.locator('.portable-promo')).toHaveAttribute('download','Quiz-Pal-HTML.zip');
    await expect(page.locator('.sidebar-site-links a').nth(1)).toHaveAttribute('href',manifest.plannedRepositoryUrl);
    await page.screenshot({path:path.join(out,'contest-thumbnail.png')});
    const sidebarDownload=page.waitForEvent('download');await page.locator('.portable-promo').click();const second=await sidebarDownload;
    expect(sha256(await fs.readFile(await second.path()))).toBe(manifest.download.sha256);
    mark('Sidebar download and planned repository link point to the prepared destinations');
    await page.locator('button[data-course="sample-fe"]').click();await page.locator('.chapter-category-toggle[data-category="sample-fe:exams"]').click();await page.locator('.exam-group-button').first().click();
    const correct=await page.evaluate(()=>currentViewQuestion().options.findIndex(o=>o.correct));await page.locator('#options .option-button').nth(correct).click();
    await expect(page.locator('.exam-group-button.active .chapter-score')).toHaveText('1/19正解');
    const fixture=path.join(out,'explanation-fixture.png');await page.locator('#questionText').screenshot({path:fixture});
    await page.locator('#explanationImagesButton').click();const chooser=page.waitForEvent('filechooser');await page.locator('.study-image-panel [data-action=register]').click();await(await chooser).setFiles(fixture);
    await expect(page.locator('#llmImageGallery img')).toHaveCount(1);await page.locator('.study-image-panel [data-action=close]').click();
    await page.locator('.maintenance-entry').click();await expect(page.locator('.studio-shell')).toBeVisible();
    const skip=page.getByRole('button',{name:'スキップ',exact:true});if(await skip.isVisible())await skip.click();
    await page.locator('[data-tour-id="manual-author"]').click();await page.getByLabel('科目名',{exact:true}).fill('WebからHTML移行QA');await page.getByRole('button',{name:'保存',exact:true}).click();
    await expect(page.locator('.manual-list-pane')).toContainText('WebからHTML移行QA');
    await expect(page.locator('.studio-shell .sidebar .portable-promo')).toHaveCount(0);
    await expect(page.locator('.studio-shell .sidebar .course-switch')).toHaveCount(0);
    await page.screenshot({path:path.join(out,'studio-sidebar.png')});
    await page.goto(url);await expect(page.locator('.course-switch')).toContainText('WebからHTML移行QA');
    const saveEvent=page.waitForEvent('download');await page.locator('#fullDataSaveButton').click();const save=await saveEvent;await save.saveAs(path.join(out,'web-backup.json'));
    const saved=JSON.parse(await fs.readFile(path.join(out,'web-backup.json'),'utf8'));expect(saved.summary.llmImages).toBe(1);expect(saved.studio.stores.subjects.some(s=>s.name==='WebからHTML移行QA')).toBe(true);
    mark('Hosted quiz progress, actual image upload and Studio edit are included in a real exported backup');
    await page.locator('.sidebar-site-links a').first().click();await expect(page.locator('html')).toHaveAttribute('data-html-ready','legal');
    await expect(page.locator('body')).toContainText('GitHub Pages');await expect(page.locator('body')).not.toContainText('Cloudflare');await expect(page.locator('body')).not.toContainText('EXEをダブルクリック');
    const links=await page.locator('a[href]').evaluateAll(es=>es.map(e=>e.href));expect(links).toContain(manifest.plannedRepositoryUrl+'/blob/main/LICENSE');expect(links).toContain(manifest.plannedRepositoryUrl+'/issues');
    for(const width of [1440,980,390,320]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);await page.screenshot({path:path.join(out,`legal-${width}.png`)});}
    const legalDownload=page.waitForEvent('download');await page.locator('.legal-portable-callout a').click();const third=await legalDownload;
    expect(sha256(await fs.readFile(await third.path()))).toBe(manifest.download.sha256);
    mark('Legal page uses GitHub Pages copy and planned source/contact URLs; its download returns the same ZIP');
    expect(errors).toEqual([]);expect(failed).toEqual([]);expect(external).toEqual([]);
    mark('No missing HTTP assets, browser exceptions or external requests during the preparation preview');
    await fs.writeFile(path.join(out,'results.json'),JSON.stringify({passed:true,browser:browser.version(),url, scope:process.env.QA_URL ? 'Actual Chrome on the specified hosted URL; no physical phone or live AI request' : 'Actual Chrome on local HTTP; no public deployment or physical phone',zipSha256:manifest.download.sha256,checks,errors,failed,external},null,2));
  }catch(error){await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw error;}
  finally{await browser.close();if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}}
})().catch(error=>{console.error(error);process.exitCode=1});


