/* Deterministic integration smoke test for the region-aware launch transition.
   No browser, external packages, Rockstar calls or account access required.
   Run: node tests/test_launch.cjs
*/
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const appSource = fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');

function mount(startEpoch){
  const clock={now:startEpoch};
  const nodes=new Map();
  const intervals=[];
  class MockDate extends Date{
    constructor(...values){super(...(values.length?values:[clock.now]));}
    static now(){return clock.now;}
  }
  class MockElement{
    constructor(tag='div'){
      this.tagName=tag;
      this.children=[];
      this._value='';
      this._html='';
      this.textContent='';
      this.style={};
      this.hidden=false;
      this.events={};
      this.dataset={};
      this.classList={
        values:new Set(),
        toggle:(name,enabled)=>{if(enabled)this.classList.values.add(name);else this.classList.values.delete(name);},
        contains:name=>this.classList.values.has(name),
        add:(...names)=>names.forEach(n=>this.classList.values.add(n)),
        remove:(...names)=>names.forEach(n=>this.classList.values.delete(n))
      };
    }
    set innerHTML(value){this._html=value;this.children=[];}
    get innerHTML(){return this._html;}
    set value(value){this._value=value;}
    get value(){return this._value;}
    get options(){return this.children.flatMap(x=>x.tagName==='optgroup'?x.children:[x]);}
    get selectedOptions(){return this.options.filter(x=>x.value===this.value);}
    append(...nodes){this.children.push(...nodes);}
    appendChild(node){this.children.push(node);}
    replaceChildren(...nodes){this.children=[...nodes];}
    addEventListener(name,handler){this.events[name]=handler;}
    dispatch(name,value){if(this.events[name])this.events[name](value);}
    querySelectorAll(){return [];}
    setAttribute(){}
    removeAttribute(){}
    getAttribute(){return null;}
    scrollIntoView(){}
  }
  function element(id){
    if(!nodes.has(id))nodes.set(id,new MockElement(id==='timezone'?'select':'div'));
    return nodes.get(id);
  }
  const body=new MockElement('body');
  const document={
    body,title:'',
    getElementById:element,
    createElement:tag=>new MockElement(tag),
    createDocumentFragment:()=>new MockElement('fragment'),
    querySelectorAll:()=>[],
    querySelector:()=>null,
    addEventListener:()=>{}
  };
  // Mirror the HTML's initial hidden state.
  element('launch-state').hidden=true;
  element('launch-hub').hidden=true;
  const window={
    addEventListener:()=>{},
    matchMedia:()=>({matches:false}),
    location:{hash:''},
    innerWidth:375
  };
  const sandbox={
    window,document,Date:MockDate,Intl,
    navigator:{userAgent:'TestBrowser'},
    localStorage:{getItem:key=>key==='vc-countdown-timezone-v1'?'Australia/Sydney':null,setItem:()=>{}},
    setInterval:fn=>{intervals.push(fn);return intervals.length;},
    setTimeout:()=>1,
    clearTimeout:()=>{},
    fetch:()=>Promise.resolve({ok:true,json:async()=>({articles:[]})}),
    console,URL,
    Option:class extends MockElement{constructor(label,value){super('option');this.textContent=label;this.value=value;}}
  };
  vm.runInNewContext(appSource,sandbox,{filename:'app.js',timeout:10000});
  assert.equal(intervals.length,1,'one ticking interval expected');
  return {clock,element,body,tick:intervals[0]};
}
function assertHidden(actual,expected,description){assert.equal(actual,expected,description);}

(function testSydneyMidnightAndRegionSwitch(){
  // Sydney November is AEDT (UTC+11). Local 19 Nov 00:00 = 18 Nov 13:00 UTC.
  const mounted=mount(Date.parse('2026-11-18T12:59:59.000Z'));
  const {clock,element,tick,body}=mounted;
  assert.equal(element('seconds').textContent,'01','last pre-launch second remains visible');
  assertHidden(element('launch-state').hidden,true,'launch panel must be hidden pre-release');
  assertHidden(element('launch-hub').hidden,true,'launch hub must be hidden pre-release');
  assert.equal(element('countdown-heading').textContent,'Midnight Calling');

  clock.now=Date.parse('2026-11-18T13:00:00.000Z');
  tick();
  assertHidden(element('count-grid').hidden,true,'countdown should disappear at selected midnight');
  assertHidden(element('count-progress').hidden,true,'countdown progress should disappear at launch');
  assertHidden(element('launch-state').hidden,false,'launch panel must appear at midnight');
  assertHidden(element('launch-hub').hidden,false,'launch hub must appear at midnight');
  assert.equal(element('countdown-heading').textContent,'The Wait Is Over');
  assert.equal(element('launch-elapsed').textContent,'00H 00M');
  assert.equal(element('hero-primary-label').textContent,'Launch guide');
  assert.equal(element('hero-primary-action').href,'./launch-info.html#launch-hub');
  assert.equal(body.classList.contains('has-launched'),true);

  // Selecting Los Angeles at the same instant reverts to the pending countdown.
  const zone=element('timezone');
  zone.value='America/Los_Angeles';
  zone.dispatch('change');
  assertHidden(element('count-grid').hidden,false,'other region should still count down');
  assertHidden(element('launch-hub').hidden,true,'launch hub should hide in unreleased region');
  assert.equal(element('hero-primary-label').textContent,'See the countdown');
  assert.equal(body.classList.contains('has-launched'),false);

  // Switching back restores the launch view.
  zone.value='Australia/Sydney';
  zone.dispatch('change');
  assertHidden(element('launch-state').hidden,false);
  assert.equal(element('launch-elapsed').textContent,'00H 00M');

  clock.now=Date.parse('2026-11-19T16:00:00.000Z');
  tick();
  assert.equal(element('launch-elapsed').textContent,'1D 03H 00M','post-launch hub remains useful beyond day one');
  assertHidden(element('launch-hub').hidden,false);
})();

console.log('PASS: Sydney midnight switch, region reversal, accessibility visibility and post-launch elapsed time');
