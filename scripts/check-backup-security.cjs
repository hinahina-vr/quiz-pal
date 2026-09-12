const {chromium}=require(process.env.PLAYWRIGHT_TEST_MODULE || 'playwright/test');
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url');
const out=path.resolve(process.env.QA_OUTPUT);
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,canonical(x)])):v;
function checksum(v){delete v.checksum;v.checksum=crypto.createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');return v;}
(async()=>{
 await fs.mkdir(out,{recursive:true}); const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.setOffline(true);
 const page=await context.newPage(),report={browser:browser.version(),checks:[],errors:[]};page.on('pageerror',e=>report.errors.push(e.message));
 page.on('dialog',d=>d.accept());
 try {
 await page.goto(pathToFileURL(path.resolve(process.env.QA_HTML)).href);
 await page.locator('.product-intro[open]').waitFor();await page.locator('#productIntroDoNotShow').check();await page.locator('.product-intro-close').click();if(await page.locator('.quiz-tour-skip').isVisible())await page.locator('.quiz-tour-skip').click();
 report.sanitizer=await page.evaluate(async()=>{
  const payloads=['<img src=x onerror="window.__auditXss=1">','<svg onload="window.__auditXss=1"></svg>','[click](javascript:window.__auditXss=1)','[click](data:text/html,test)','<a href="javascript:window.__auditXss=1">click</a>','<iframe srcdoc="<script>parent.__auditXss=1</script>"></iframe>'];
  const results=[];for(const input of payloads){const div=document.createElement('div');div.innerHTML=window.DOMPurify.sanitize(window.marked.parse(input));document.body.append(div);await new Promise(r=>setTimeout(r,30));results.push({input,output:div.innerHTML,executed:!!window.__auditXss,dangerous:!!div.querySelector('script,img,svg,iframe,[onerror],[onload],a[href^="javascript:"],a[href^="data:"]')});div.remove();}return results;
 });
 const download=page.waitForEvent('download');await page.locator('#fullDataSaveButton').click();const backupFile=path.join(out,'baseline-backup.json');await(await download).saveAs(backupFile);const baseline=JSON.parse(await fs.readFile(backupFile,'utf8'));
 report.checks.push({name:'Actual offline HTML JSON save',passed:!!baseline.checksum});
 const load=async(payload,name)=>{const file=path.join(out,name+'.json');await fs.writeFile(file,JSON.stringify(payload));await page.locator('#fullDataLoadInput').setInputFiles(file);await page.waitForTimeout(1600);return page.locator('#fullDataStatus').textContent();};
 const corrupted=structuredClone(baseline);corrupted.exportedAt='2026-01-01T00:00:00.000Z';report.corruptedStatus=await load(corrupted,'corrupted');
 const secret=structuredClone(baseline);secret.localStorage.push({key:'local-quiz-studio-consented-api-keys-v1',value:'{}'});report.secretStatus=await load(checksum(secret),'secret-store');
 // Exercise the actual file-input restore path; payload only sets an inert local marker.
 const poison=structuredClone(baseline);
 const data=await page.evaluate(()=>({manifest:window.QUIZ_DATA,courses:Object.values(window.QUIZ_COURSE_DATA)}));
 data.courses[0].chapters[0].questions[0].promptHtml='<p>SECURITY AUDIT PROBE</p><img src="missing-audit-image.png" onerror="document.documentElement.dataset.auditXss=\'executed\'">';
 poison.localStorage=poison.localStorage.filter(e=>e.key!=='local-quiz-studio-legacy-dataset-v1');poison.localStorage.push({key:'local-quiz-studio-legacy-dataset-v1',value:JSON.stringify(data)});
 report.poisonStatus=await load(checksum(poison),'crafted-backup');
 await page.waitForTimeout(1500);
 report.storedXss={executed:await page.locator('html').getAttribute('data-audit-xss'),question:await page.locator('#questionText').textContent(),payloadRetained:await page.evaluate(()=>localStorage.getItem('local-quiz-studio-legacy-dataset-v1')?.includes('SECURITY AUDIT PROBE'))};
 if (report.storedXss.executed || report.storedXss.question.includes('SECURITY AUDIT PROBE') || report.storedXss.payloadRetained) throw new Error('Stored XSS regression');
 if (!report.corruptedStatus.includes('読込失敗') || !report.secretStatus.includes('読込失敗')) throw new Error('Invalid backup accepted');
 // Older profiles may already hold the poisoned cache. Startup must also sanitize it.
 await page.evaluate(value=>localStorage.setItem('local-quiz-studio-legacy-dataset-v1',JSON.stringify(value)),data);
 await page.reload();await page.waitForTimeout(1000);
 report.startupSafe=await page.locator('html').getAttribute('data-audit-xss')===null && !(await page.locator('#questionText').textContent()).includes('SECURITY AUDIT PROBE');
 if (!report.startupSafe || report.errors.length) throw new Error('Startup cache security regression');
 report.passed = true; await page.screenshot({path:path.join(out,'security-backup-probe.png')});
 }finally{await fs.writeFile(path.join(out,'security.json'),JSON.stringify(report,null,2));await browser.close();}
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1});


