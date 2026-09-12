const {spawn}=require('node:child_process');
const fs=require('node:fs/promises'),path=require('node:path'),net=require('node:net');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
class FirefoxBiDi {
  static async launch(profile) {
    const self=new FirefoxBiDi();self.pending=new Map();self.nextId=1;self.events=[];
    await fs.mkdir(profile,{recursive:true});
    await fs.mkdir(path.join(profile,'downloads'),{recursive:true});
    await fs.writeFile(path.join(profile,'user.js'),[
      ['browser.shell.checkDefaultBrowser',false],['browser.startup.homepage','about:blank'],['browser.startup.homepage_override.mstone','ignore'],['browser.newtabpage.enabled',false],
      ['browser.download.folderList',2],['browser.download.dir',path.join(profile,'downloads')],['browser.download.useDownloadDir',true],['browser.helperApps.neverAsk.saveToDisk','application/json,text/csv,text/plain,application/octet-stream'],
    ].map(([k,v])=>`user_pref(${JSON.stringify(k)},${JSON.stringify(v)});`).join('\n'));
    const server=net.createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;await new Promise(resolve=>server.close(resolve));
    self.process=spawn(process.env.QA_FIREFOX||'C:/Program Files/Mozilla Firefox/firefox.exe',['--headless','--no-remote','--profile',profile,'--remote-debugging-port',String(port)],{windowsHide:true,stdio:['ignore','pipe','pipe']});
    let log='';self.process.stdout.on('data',d=>log+=d);self.process.stderr.on('data',d=>log+=d);
    self.process.on('error',e=>{log+=e.message});
    try {
      for(let i=0;i<100&&!log.includes('WebDriver BiDi listening');i++)await sleep(100);
      if(!log.includes('WebDriver BiDi listening'))throw new Error('Firefox remote agent did not start: '+log.slice(-2000));
      self.socket=new WebSocket(`ws://127.0.0.1:${port}/session`);
      await new Promise((resolve,reject)=>{self.socket.onopen=resolve;self.socket.onerror=reject});
      self.socket.onmessage=message=>{const response=JSON.parse(message.data);if(response.id){const p=self.pending.get(response.id);if(p){clearTimeout(p.timer);self.pending.delete(response.id);response.type==='error'?p.reject(new Error(response.error+': '+response.message)):p.resolve(response.result)}}else {self.events.push(response);self.onEvent?.(response)}};
      self.session=await self.send('session.new',{capabilities:{alwaysMatch:{acceptInsecureCerts:false,unhandledPromptBehavior:{default:'ignore'}}}});
      self.context=(await self.send('browsingContext.create',{type:'tab'})).context;
      await self.send('session.subscribe',{events:['log.entryAdded','network.beforeRequestSent'],contexts:[self.context]});
      return self;
    } catch(e){await self.close();throw e}
  }
  send(method,params={}){const id=this.nextId++;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error('Timed out: '+method))},20000);this.pending.set(id,{resolve,reject,timer});this.socket.send(JSON.stringify({id,method,params}))})}
  async evaluate(expression){const r=await this.send('script.evaluate',{expression:`(async()=>JSON.stringify(await (${expression})))()`,target:{context:this.context},awaitPromise:true});if(r.type==='exception')throw new Error(r.exceptionDetails?.text||JSON.stringify(r));return r.result.type==='undefined'?undefined:JSON.parse(r.result.value)}
  async waitFor(expression){for(let i=0;i<60;i++){try{if(await this.evaluate(expression))return}catch{}await sleep(150)}throw new Error('Did not become ready: '+expression+'\n'+await this.evaluate('document.body.innerText.slice(0,1200)'))}
  async navigate(url){await this.send('browsingContext.navigate',{context:this.context,url,wait:'complete'})}
  async click(selector){await this.waitFor(`!!document.querySelector(${JSON.stringify(selector)})`);const rect=await this.evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center',inline:'nearest'});const r=el.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()`);await this.send('input.performActions',{context:this.context,actions:[{type:'pointer',id:'mouse',parameters:{pointerType:'mouse'},actions:[{type:'pointerMove',x:rect.x,y:rect.y,origin:'viewport'},{type:'pointerDown',button:0},{type:'pointerUp',button:0}]}]})}
  async screenshot(file){const r=await this.send('browsingContext.captureScreenshot',{context:this.context,origin:'viewport'});await fs.writeFile(file,Buffer.from(r.data,'base64'))}
  async setFiles(selector,files){const r=await this.send('script.evaluate',{expression:`document.querySelector(${JSON.stringify(selector)})`,target:{context:this.context},awaitPromise:false});await this.send('input.setFiles',{context:this.context,element:{sharedId:r.result.sharedId},files})}
  async close(){
    try{if(this.socket?.readyState===1)await this.send('browser.close')}catch{}
    if(this.process&&this.process.exitCode===null){
      await new Promise(resolve=>{const timer=setTimeout(resolve,10000);this.process.once('exit',()=>{clearTimeout(timer);resolve()})});
      if(this.process.exitCode===null)this.process.kill();
    }
    this.socket?.close();
  }
}
module.exports={FirefoxBiDi};
