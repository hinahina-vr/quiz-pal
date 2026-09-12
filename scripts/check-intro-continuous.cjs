const {chromium,expect}=require(process.env.PLAYWRIGHT_TEST_MODULE||'playwright/test');
const fs=require('node:fs/promises'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const out=path.resolve(process.env.QA_OUTPUT);await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const checks=[],errors=[];let page;
 try{
  const viewports=process.env.QA_DESKTOP_ONLY ? [[1920,1080]] : [[3840,2160],[1920,1080],[1440,900],[390,844],[844,390]];
  for(const [width,height] of viewports){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true});page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(process.env.QA_URL||pathToFileURL(path.resolve(process.env.QA_HTML)).href);
   const modal=page.locator('.product-intro'),body=modal.locator('.product-intro-body');await expect(modal).toBeVisible();await expect(modal).toHaveCSS('opacity','1');await page.evaluate(()=>document.fonts.ready);
   await expect(modal.locator('[data-reading-section]')).toHaveCount(4);
   const sizes=await body.evaluate(e=>({client:e.clientHeight,total:e.scrollHeight,width:e.clientWidth,scrollWidth:e.scrollWidth,overflow:getComputedStyle(e).overflowY,snap:getComputedStyle(e).scrollSnapType}));
   expect(sizes.total).toBeGreaterThan(sizes.client*3);expect(sizes.overflow).toBe('auto');expect(sizes.snap).toBe('none');expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.width+1);
   await body.evaluate(e=>e.dataset.identity='retained');
   const box=await body.boundingBox();await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.wheel(0,180);await page.waitForTimeout(250);
   const partial=await body.evaluate(e=>e.scrollTop);expect(partial).toBeGreaterThan(100);expect(partial).toBeLessThan(250);await page.waitForTimeout(300);expect(await body.evaluate(e=>e.scrollTop)).toBe(partial);
   await expect(body).toHaveAttribute('data-identity','retained');
   const boundary=await body.evaluate(e=>{const next=e.querySelector('[data-reading-section=images]');return e.scrollTop+next.getBoundingClientRect().top-e.getBoundingClientRect().top;});
   await body.evaluate((e,top)=>e.scrollTop=top,boundary-sizes.client/2);await page.waitForTimeout(100);
   for(const id of ['conversation','images']){const rect=await modal.locator(`[data-reading-section=${id}]`).boundingBox();expect(rect.y).toBeLessThan(box.y+box.height);expect(rect.y+rect.height).toBeGreaterThan(box.y);}
   await page.screenshot({path:path.join(out,`continuous-boundary-${width}.png`),scale:'css'});
   const jump=async(id,selector)=>{await modal.locator(selector).click();await expect.poll(()=>modal.getAttribute('data-reading-section')).toBe(id);await page.waitForTimeout(650);};
   // A real smooth movement must have intermediate positions, not just swap DOM pages.
   if(width===1920){await body.evaluate(e=>e.scrollTop=0);await page.waitForTimeout(100);await modal.locator('[data-step="2"]').click();await page.waitForTimeout(60);const middle=await body.evaluate(e=>e.scrollTop);expect(middle).toBeGreaterThan(0);expect(middle).toBeLessThan(await body.evaluate(e=>e.scrollHeight-e.clientHeight));await expect.poll(()=>modal.getAttribute('data-reading-section')).toBe('portable');await page.waitForTimeout(700);}
   await jump('choose','[data-step="1"]');await expect(modal.locator('[data-step="1"]')).toHaveAttribute('aria-current','step');
   for(const provider of ['openrouter','openai','gemini','grok']){
    await jump('setup',`[data-provider=${provider}]`);await expect(modal.locator('[data-reading-section]')).toHaveCount(5);await expect(modal.locator('#productIntroProviderDetail')).toContainText(provider==='openai'?'GPT':provider==='gemini'?'Gemini':provider==='grok'?'Grok':'OpenRouter');await jump('choose','[data-action=choose-provider]');
   }
   await jump('images','[data-feature=images]');await expect(modal.locator('[data-feature=images]')).toHaveAttribute('aria-pressed','true');await expect(modal.locator('[data-step="0"]')).toHaveAttribute('aria-current','step');
   await modal.locator('[data-reading-section=images] [data-screenshot]').click();const viewer=page.locator('.intro-shot-viewer');await expect(viewer).toBeVisible();await expect(viewer.locator('img')).toHaveAttribute('src','./guide-captures/image-library.png');await expect.poll(()=>viewer.locator('img').evaluate(img=>img.complete && img.naturalWidth>0)).toBe(true);await viewer.locator('button').click();await expect(modal).toHaveAttribute('data-reading-section','images');
   await jump('conversation','[data-step="0"]');await modal.locator('[data-capture-step="ai-first-answer.png"]').click();await expect(modal.locator('[data-reading-section=conversation] [data-screenshot] img')).toHaveAttribute('src','./guide-captures/ai-first-answer-preview.webp');
   await jump('images','[data-action=next]');await jump('conversation','[data-action=back]');
   // Scroll itself, not a tab, drives the selected primary tab in both directions.
   await body.evaluate(e=>e.scrollTop=e.scrollHeight);await expect.poll(()=>modal.getAttribute('data-reading-section')).toBe('portable');await expect(modal.locator('[data-step="2"]')).toHaveAttribute('aria-current','step');
   await body.evaluate(e=>e.scrollTop=0);await expect.poll(()=>modal.getAttribute('data-reading-section')).toBe('conversation');
   if(width===390){const cdp=await context.newCDPSession(page);const x=box.x+box.width*.5,y=box.y+box.height*.7;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*25}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(300);expect(await body.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);await cdp.detach();}
   await modal.locator('#productIntroDoNotShow').check();await jump('portable','[data-step="2"]');await modal.locator('[data-action=next]').click();await expect(modal).toHaveCount(0);await expect(page.locator('.quiz-tour-layer')).toBeVisible();await page.locator('.quiz-tour-skip').click();await page.reload();await page.waitForTimeout(900);await expect(page.locator('.product-intro')).toHaveCount(0);
   checks.push(`${width}x${height}: native partial scroll stays between sections; both sections coexist, tabs/links/footer sync, all providers inline, image viewer, opt-out, final guide`);await context.close();
  }
  expect(errors).toEqual([]);await fs.writeFile(path.join(out,'results.json'),JSON.stringify({passed:true,browser:browser.version(),checks,errors,scope:'Actual isolated Windows Chrome; smooth scroll observed at intermediate position, native wheel and CDP touch emulation. Not a physical-phone test.'},null,2));console.log('PASS',checks);
 }catch(e){await page?.screenshot({path:path.join(out,'failure.png'),scale:'css'}).catch(()=>{});throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});


