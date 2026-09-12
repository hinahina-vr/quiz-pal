const {chromium,expect}=require(process.env.PLAYWRIGHT_TEST_MODULE||'playwright/test');
const fs=require('node:fs/promises'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const out=path.resolve(process.env.QA_OUTPUT),url=process.env.QA_URL||pathToFileURL(path.resolve(process.env.QA_HTML)).href,before=process.env.QA_BEFORE==='1';await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.QA_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});let page;const rows=[],errors=[];
 try{
  for(const [width,height] of before?[[1920,1080]]:[[3840,2160],[1920,1080],[1440,900],[980,900],[390,844],[320,640],[844,390]]){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:width>=1920?2:1});page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));await page.goto(url);await expect(page.locator('.product-intro')).toBeVisible();await page.getByRole('button',{name:'操作ガイド',exact:true}).click();
   for(const [kind,targets]of [['quiz',['courses','chapters','quiz','llm','images','tools','studio','data','guide']],['studio',['library-choice','ai-author','manual-author','data','practice','guide']]]){
    if(kind==='studio'){await page.locator('.maintenance-entry').click();await expect(page.locator('.tour-card')).toBeVisible();}
    const card=page.locator(kind==='quiz'?'.quiz-tour-card':'.tour-card');await expect(card).toBeVisible();
    for(let step=0;step<targets.length;step++){
     await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(270);
     const geo=await page.evaluate(({kind,id})=>{
      const card=document.querySelector(kind==='quiz'?'.quiz-tour-card':'.tour-card'),targets=[...document.querySelectorAll(`[data-${kind==='quiz'?'quiz-tour':'tour'}-id="${id}"]`)];
      const target=targets.find(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'});
      if(!target)throw Error('Missing target '+id);const a=card.getBoundingClientRect(),b=target.getBoundingClientRect();const rect=r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height});
      const dx=Math.max(a.left-b.right,b.left-a.right,0),dy=Math.max(a.top-b.bottom,b.top-a.bottom,0);
      const overlap=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
      const canFit=b.left>=a.width+26||innerWidth-b.right>=a.width+26||b.top>=a.height+26||innerHeight-b.bottom>=a.height+26;
      return {card:rect(a),target:rect(b),distance:Math.hypot(dx,dy),overlap,canFit};
     },{kind,id:targets[step]});
     rows.push({width,height,kind,step:step+1,id:targets[step],...geo});
     if(!before){expect(geo.card.left).toBeGreaterThanOrEqual(9);expect(geo.card.top).toBeGreaterThanOrEqual(9);expect(geo.card.right).toBeLessThanOrEqual(width-9);expect(geo.card.bottom).toBeLessThanOrEqual(height-9);expect(geo.distance).toBeLessThanOrEqual(24);if(geo.canFit)expect(geo.overlap).toBeLessThanOrEqual(1);}
     if((width===1920&&['llm','guide'].includes(targets[step]))||(width===390&&targets[step]==='guide'))await page.screenshot({path:path.join(out,`${kind}-${targets[step]}-${width}.png`),scale:'css'});
     await card.getByRole('button',{name:step===targets.length-1?'使ってみる':'次へ',exact:true}).click();
    }
    await expect(card).toHaveCount(0);
   }
   // Reopen after completion, move back, resize while open, then close with Escape.
   const guide=page.locator('[data-tour-id="guide"]').filter({visible:true}).first();await guide.click();await expect(page.locator('.tour-card')).toBeVisible();await page.locator('.tour-card').getByRole('button',{name:'次へ',exact:true}).click();await page.locator('.tour-card').getByRole('button',{name:'戻る',exact:true}).click();await page.setViewportSize({width:width===390?480:width,height:height+30});await page.waitForTimeout(250);await page.keyboard.press('Escape');await expect(page.locator('.tour-card')).toHaveCount(0);await context.close();
  }
  expect(errors).toEqual([]);await fs.writeFile(path.join(out,'results.json'),JSON.stringify({passed:true,before,browser:browser.version(),rows,errors,scope:'Actual Quiz 9-step and Studio 6-step tours; viewport/DPR emulation, next/back/finish/reopen/resize/Escape'},null,2));console.log('PASS '+rows.length+' actual guide steps; '+(before?'original positions recorded':'all cards adjacent, contained, and non-overlapping wherever space permits'));
 }catch(e){await page?.screenshot({path:path.join(out,'failure.png'),scale:'css'}).catch(()=>{});throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
