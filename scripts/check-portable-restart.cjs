const { chromium, expect } = require(process.env.PLAYWRIGHT_TEST_MODULE || 'playwright/test');
const fs = require('fs/promises');
const path = require('path');
const appUrl = (view = 'quiz') => process.env.QA_HTML
  ? require('node:url').pathToFileURL(path.resolve(process.env.QA_HTML)).href + '#/' + view
  : 'http://127.0.0.1:57421' + (view === 'quiz' ? '/' : '/' + view + '.html');
async function navigate(page, view = 'quiz') {
  await page.goto(appUrl(view));
  if (process.env.QA_HTML) await expect(page.locator('html')).toHaveAttribute('data-html-ready', view);
}
(async()=>{
 const output=path.resolve(process.env.QA_OUTPUT||'work/qa-portable');
 const previous=JSON.parse(await fs.readFile(path.join(output,'results.json'),'utf8'));
 const context=await chromium.launchPersistentContext(previous.profilePath,{executablePath:process.env.QA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,viewport:{width:1440,height:900}});
 try {
 const page=await context.newPage();
 await navigate(page);
 await page.locator('button[data-course="sample-fe"]').click();
 await expect(page.locator('.chapter-category-toggle[data-category="sample-fe:exams"]')).toHaveAttribute('aria-expanded','true');
 await expect(page.locator('.exam-group-button').first().locator('.chapter-score')).toHaveText('1/19正解');
 await expect(page.locator('.course-switch')).toContainText('QA 保存復元テスト');
 await page.locator('#llmTeachButton').click();
 await page.locator('#llmImageLibraryToggle').click();
 await expect(page.locator('#llmImageGallery img')).toHaveCount(1);
 await navigate(page, 'studio');
 await expect(page.locator('.course-switch')).toContainText('QA 保存復元テスト');
 const result={passed:true,entryUrl:appUrl(),profilePath:previous.profilePath,checks:[process.env.QA_HTML ? 'Exam progress retained after browser restart reopening the same HTML' : 'Exam progress retained after EXE and browser restart','Expanded preference retained','Studio IndexedDB edit retained','Image library retained']};
 await fs.writeFile(path.join(output,'restart-results.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
 } finally {await context.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
