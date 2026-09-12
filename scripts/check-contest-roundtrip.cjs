const {chromium,expect}=require(process.env.PLAYWRIGHT_TEST_MODULE||'playwright/test');
const {startServer}=require('./audit-release.cjs');
const fs=require('node:fs/promises'),path=require('node:path'),{pathToFileURL}=require('node:url');

(async()=>{
  const out=path.resolve(process.env.QA_OUTPUT);await fs.mkdir(out,{recursive:true});
  const expectedImage='data:image/png;base64,'+(await fs.readFile(process.env.QA_WEB_IMAGE)).toString('base64');
  await fs.access(process.env.QA_WEB_BACKUP);
  const {server,url}=process.env.QA_URL?{server:null,url:process.env.QA_URL}:await startServer(),browser=await chromium.launch({executablePath:process.env.QA_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const checks=[],errors=[];
  async function restore(entry,backup,offline){
    const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});await context.setOffline(offline);
    const page=await context.newPage();page.on('dialog',d=>d.accept());page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(entry);await expect(page.locator('.product-intro[open]')).toBeVisible();await page.locator('#productIntroDoNotShow').check();await page.locator('.product-intro-close').click();if(await page.locator('.quiz-tour-skip').isVisible())await page.locator('.quiz-tour-skip').click();
    await page.locator('#fullDataLoadInput').setInputFiles(backup);await expect(page.locator('#fullDataStatus')).toContainText('ロード完了');
    await expect(page.locator('.course-switch')).toContainText('WebからHTML移行QA');
    await page.reload();await expect(page.locator('.course-switch')).toContainText('WebからHTML移行QA');
    await page.locator('button[data-course="sample-fe"]').click();await expect(page.locator('.exam-group-button').first().locator('.chapter-score')).toHaveText('1/19正解');
    await page.locator('#explanationImagesButton').click();await expect(page.locator('#llmImageGallery img')).toHaveCount(1);
    expect(await page.locator('#llmImageGallery img').getAttribute('src')).toBe(expectedImage);await page.locator('.study-image-panel [data-action=close]').click();
    return {context,page};
  }
  try{
    const local=await restore(pathToFileURL(path.resolve(process.env.QA_HTML)).href,path.resolve(process.env.QA_WEB_BACKUP),true);
    await expect(local.page.locator('.portable-promo')).toHaveAttribute('href','./README.html');
    await expect(local.page.locator('.portable-promo-copy')).toContainText('HTML版を使っています');
    await local.page.screenshot({path:path.join(out,'web-data-restored-offline.png')});
    const downloaded=local.page.waitForEvent('download');await local.page.locator('#fullDataSaveButton').click();const save=await downloaded;const backup=path.join(out,'local-roundtrip.json');await save.saveAs(backup);
    expect(JSON.parse(await fs.readFile(backup,'utf8')).summary.llmImages).toBe(1);
    await local.context.close();checks.push('Web backup restores the edited subject, exact image bytes and exam progress in the freshly extracted offline HTML, then exports again');
    const hosted=await restore(url,backup,false);await hosted.page.screenshot({path:path.join(out,'local-data-restored-web.png')});
    await hosted.context.close();checks.push('The offline HTML backup restores the same subject, image and exam progress into a fresh hosted browser context');
    expect(errors).toEqual([]);
    await fs.writeFile(path.join(out,'results.json'),JSON.stringify({passed:true,browser:browser.version(),url, scope:process.env.QA_URL ? 'Actual hosted URL to offline HTML to hosted URL; real UI save/load, no physical phone' : 'Local HTTP to offline HTML; no public deployment',checks,errors},null,2));
    console.log('PASS',checks);
  }finally{await browser.close();if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}}
})().catch(error=>{console.error(error);process.exitCode=1});

