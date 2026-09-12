// Browser regression for explicit guide opt-out, manual access and re-enabling.
const {chromium,expect}=require(process.env.PLAYWRIGHT_TEST_MODULE||'playwright/test');
const fs=require('node:fs/promises'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const out=path.resolve(process.env.QA_OUTPUT);await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const checks=[],errors=[];
 try {for(const [width,height] of [[3840,2160],[1024,650],[390,844],[844,390]]){
  const context=await browser.newContext({viewport:{width,height}});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.QA_URL||pathToFileURL(path.resolve(process.env.QA_HTML)).href);
  await page.locator('.product-intro-close').click();await expect(page.locator('#quizGuideDoNotShow')).not.toBeChecked();
  await page.locator('.quiz-tour-skip').click();await page.reload();await page.locator('.product-intro-close').click();await expect(page.locator('#quizGuideDoNotShow')).toBeVisible();
  await page.locator('#quizGuideDoNotShow').check();await page.keyboard.press('Tab');await expect(page.locator('.quiz-tour-skip')).toBeFocused();
  for(let i=0;i<8;i++)await page.locator('.quiz-tour-next').click();await expect(page.locator('#quizGuideDoNotShow')).toBeChecked();
  await page.waitForTimeout(200);
  await page.screenshot({path:path.join(out,`guide-${width}.png`)});
  const box=await page.locator('.quiz-tour-card').boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width+1);expect(box.y+box.height).toBeLessThanOrEqual(height+1);
  await page.locator('.quiz-tour-next').click();await page.reload();await page.locator('.product-intro-close').click();await expect(page.locator('.quiz-tour-card')).toHaveCount(0);
  await page.locator('#quizGuideButton').click();await expect(page.locator('#quizGuideDoNotShow')).toBeChecked();await page.locator('.quiz-tour-skip').click();
  await page.locator('#quizIntroButton').click();await page.locator('[data-action="guide"]').click();await expect(page.locator('#quizGuideDoNotShow')).toBeChecked();
  await page.locator('#quizGuideDoNotShow').uncheck();await page.keyboard.press('Escape');await page.reload();await page.locator('.product-intro-close').click();await expect(page.locator('#quizGuideDoNotShow')).not.toBeChecked();
  checks.push({width,height,passed:true,checks:['unchecked repeats','opt-out persists through completion and reload','manual toolbar and intro links bypass opt-out','keyboard checkbox focus','uncheck re-enables','card fits viewport']});await context.close();
 }expect(errors).toEqual([]);await fs.writeFile(path.join(out,'results.json'),JSON.stringify({version:'1.0.0',scope:process.env.QA_URL||'freshly extracted local HTML',checks,errors},null,2));console.log(JSON.stringify({checks,errors}));}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
