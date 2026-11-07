import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source=await fs.readFile(new URL('../assets/report/share.js',import.meta.url),'utf8');
function environment(staticButton){
 class Element{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.childNodes=this.children;this.attrs={};this.listeners={};this.classList={add:()=>{}};this.nodeType=1;this.namespaceURI='http://www.w3.org/2000/svg';}
  setAttribute(k,v){this.attrs[k]=v;} querySelector(selector){if(selector==='.action-icon')return this.children.find(n=>n.icon)||null;return this.map?.[selector]||null;}
  append(...nodes){for(const n of nodes){n.parentElement=this;this.children.push(n);}} prepend(...nodes){for(const n of nodes.reverse()){n.parentElement=this;this.children.unshift(n);}}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);} async click(){for(const fn of this.listeners.click||[])await fn({target:this});}
  focus(){this.focused=true;} select(){} showModal(){this.open=true;} close(){this.open=false;}
  set innerHTML(value){this.map={};for(const s of ['.share-close','.share-heading','.share-status','input','[data-native]','[data-discord]','[data-kakao]','[data-discord-open]','[data-copy]','[data-telegram]','[data-line]','[data-whatsapp]'])this.map[s]=new Element('button');}
 }
 const body=new Element('body'),main=new Element('main'),button=staticButton?new Element('button'):null;if(button){button.id='report-share';main.append(button);}
 let dialog;const doc={body,currentScript:{src:'https://example.test/assets/report/share.js'},title:'보고서',createElement(tag){const e=new Element(tag);if(tag==='dialog')dialog=e;return e;},createElementNS(ns,tag){const e=new Element(tag);if(tag==='svg')e.icon=true;return e;},getElementById(id){return id==='report-share-dialog'?body.children.find(x=>x.id===id):id==='report-share'?(button||body.children.find(x=>x.id===id)||main.children.find(x=>x.id===id)):null;},querySelector(s){if(s==='.share-dialog')return dialog||null;if(s==='.weekly-editorial main.content')return main;return null;},querySelectorAll(){return [];},execCommand(){return false;}};
 const copied=[],context={document:doc,URL,Node:{TEXT_NODE:3},navigator:{clipboard:{writeText:async text=>copied.push(text)}},location:{origin:'https://example.test',pathname:'/report.html'}};context.globalThis=context;
 return {context,doc,main,body,copied,get dialog(){return dialog;},get button(){return button||main.children.find(x=>x.id==='report-share')||body.children.find(x=>x.id==='report-share');}};
}
for(const existing of [true,false])test(`공유 ${existing?'기존 버튼 채택':'버튼 생성'}과 중복 초기화 방지`,async()=>{
 const e=environment(existing);vm.runInNewContext(source,e.context);const dialog=e.dialog,button=e.button;assert.ok(dialog&&button);assert.equal(button.listeners.click.length,1);await button.click();assert.equal(dialog.open,true);
 await dialog.map['[data-copy]'].click();assert.deepEqual(e.copied,['https://example.test/report.html']);
 await dialog.map['[data-discord]'].click();assert.equal(dialog.map['[data-discord-open]'].hidden,false);assert.match(dialog.map['.share-status'].textContent,/디스코드/);
 await dialog.map['[data-kakao]'].click();assert.match(dialog.map['.share-status'].textContent,/카카오톡/);
 await dialog.map['[data-native]'].click();assert.match(dialog.map['.share-status'].textContent,/지원하지 않아요/);
 vm.runInNewContext(source,e.context);assert.equal(e.dialog,dialog);assert.equal(button.listeners.click.length,1);await dialog.map['.share-close'].click();assert.equal(dialog.open,false);assert.equal(button.focused,true);
});
