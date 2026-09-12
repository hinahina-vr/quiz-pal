const {chromium,expect}=require(process.env.PLAYWRIGHT_TEST_MODULE || 'playwright/test');
const fs=require('fs/promises'),path=require('path');
const appUrl = (view = 'quiz') => process.env.QA_HTML
  ? require('node:url').pathToFileURL(path.resolve(process.env.QA_HTML)).href + '#/' + view
  : 'http://127.0.0.1:57421' + (view === 'quiz' ? '/' : '/' + view + '.html');
async function navigate(page, view = 'quiz') {
  await page.goto(appUrl(view));
  if (process.env.QA_HTML) await expect(page.locator('html')).toHaveAttribute('data-html-ready', view);
}
(async()=>{
const output=path.resolve(process.env.QA_OUTPUT || 'work/qa-portable');
const browser=await chromium.launch({executablePath:process.env.QA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
const page=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
if (process.env.QA_HTML) await page.context().setOffline(true);
await navigate(page, 'studio');
await page.waitForTimeout(600);
const skip=page.getByRole('button',{name:'スキップ',exact:true});if(await skip.isVisible())await skip.click();
await page.locator('[data-tour-id="data"]').first().click();
await page.locator('dialog[open] input[type=file]').setInputFiles(path.join(output,'template.csv'));
await expect(page.getByRole('heading',{name:'変更プレビュー'})).toBeVisible();
await page.getByRole('button',{name:'取込を確定',exact:true}).click();
await expect(page.locator('dialog[open]')).toHaveCount(0);
await page.reload();
await expect(page.locator('.course-switch')).toContainText('サンプル科目');
await navigate(page);
const quizSkip=page.getByRole('button',{name:'紹介を閉じる',exact:true});await expect(quizSkip).toBeVisible();await page.locator('#productIntroDoNotShow').check();await quizSkip.click();
await page.locator('button[data-course="my-subject"]').click();
await expect(page.locator('#questionText')).toContainText('2 + 2');
await expect(page.locator('#options .option-button')).toHaveCount(5);
await expect(page.locator('.exam-group-button')).toHaveCount(0);
const correct=await page.evaluate(()=>currentViewQuestion().options.findIndex(option=>option.correct));
await page.locator('#options .option-button').nth(correct).click();
await expect(page.locator('#answeredCount')).toHaveText('1 / 1');
await page.waitForTimeout(1600);
await page.screenshot({path:path.join(output,'csv-imported-question.png')});
const event=page.waitForEvent('download');await page.locator('#fullDataSaveButton').click();const file=await event;
const backupPath=path.join(output,'csv-imported-backup.json');await file.saveAs(backupPath);
const data=JSON.parse(await fs.readFile(backupPath,'utf8'));
expect(data.studio.stores.questions.some(q=>q.id==='my-question-1')).toBe(true);
const result={passed:true,checks:['CSV template confirmed through UI','Imported subject survives reload','Imported question plays as five choices','Ordinary imported course remains ungrouped','Correct answer recorded','Imported question included in exported full backup']};
await fs.writeFile(path.join(output,'csv-import-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
