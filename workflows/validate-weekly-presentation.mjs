// This checks the project's well-formed static report markup, not arbitrary third-party HTML.
const voidTags=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
export function reportElements(html){
 const root={tag:'root',attrs:{},parent:null,start:0,end:html.length},elements=[],stack=[root];
 const source=html.replace(/(<(?:script|style)\b[^>]*>)[\s\S]*?(<\/(?:script|style)>)/gi,'$1$2');
 for(const match of source.matchAll(/<!--[\s\S]*?-->|<\/?([a-z][\w-]*)\b([^>]*)>/gi)){
  if(!match[1])continue;
  const tag=match[1].toLowerCase();
  if(match[0].startsWith('</')){
   if(stack.at(-1).tag!==tag)throw Error('Invalid report HTML nesting: '+tag);
   stack.pop().end=match.index+match[0].length;continue;
  }
  const attrs={};
  for(const attr of match[2].matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g))attrs[attr[1].toLowerCase()]=attr[2]??attr[3]??attr[4]??'';
  const node={tag,attrs,parent:stack.at(-1),start:match.index,end:match.index+match[0].length};elements.push(node);
  if(!voidTags.has(tag)&&!match[0].endsWith('/>'))stack.push(node);
 }
 if(stack.length!==1)throw Error('Unclosed report HTML element');
 return {elements,source};
}
const hasClass=(node,name)=>(node.attrs.class||'').split(/\s+/).includes(name);
const within=(node,parent)=>{for(let current=node.parent;current;current=current.parent)if(current===parent)return true;return false;};
export const careerCategories=['startups','events','bootcamps','admissions','news'];
export function validateCareerCoverage(coverage,{issueDate}={}){
 const nonempty=value=>typeof value==='string'&&value.trim().length>0;
 if(!Array.isArray(coverage)||coverage.length!==careerCategories.length||new Set(coverage.map(item=>item?.category)).size!==careerCategories.length)throw Error('Career research must cover five unique categories');
 for(const category of careerCategories){
  const item=coverage.find(item=>item?.category===category);
  if(!item||!['updated','no_material_change','unverified'].includes(item.status)||!nonempty(item.searchScope)||!nonempty(item.finding))throw Error('Career research evidence missing: '+category);
  if(!Array.isArray(item.sourceUrls)||!item.sourceUrls.length||item.sourceUrls.some(url=>typeof url!=='string'||!url.startsWith('https://')))throw Error('Career research sources missing: '+category);
  const checked=typeof item.searchedAt==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(item.searchedAt)?Date.parse(item.searchedAt+'T00:00:00Z'):NaN;
  const issue=Date.parse(issueDate+'T00:00:00Z');
  if(!Number.isFinite(checked)||!Number.isFinite(issue)||new Date(checked).toISOString().slice(0,10)!==item.searchedAt||checked>issue||checked<issue-7*86400000)throw Error('Career research date is stale or invalid: '+category);
  if(item.status==='unverified'&&!nonempty(item.limitation))throw Error('Career research limitation missing: '+category);
 }
}
export function validateSectionPractices(html,{sectionIds}={}){
 const required=new Map([['reverse',1],['ai-planning',1],['prototype',1],['lab',2],['game-ai-tools',1],['agent-skills',1],['ai-production',1]]);
 const {elements,source}=reportElements(html);
 const text=n=>source.slice(n.start,n.end).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 const descendants=(n,predicate)=>elements.filter(child=>within(child,n)&&predicate(child));
 for(const [id,count] of required){
  if(sectionIds&&!sectionIds.includes(id))continue;
  const section=elements.find(n=>n.attrs.id===id);
  const blocks=section?descendants(section,n=>hasClass(n,'practice-prompt')):[];
  const own=(block,predicate)=>descendants(block,n=>predicate(n)&&!blocks.some(other=>other!==block&&within(other,block)&&within(n,other)));
  const widgets=blocks.filter(block=>own(block,n=>n.tag==='pre'||n.tag==='button').length);
  if(widgets.length<count)throw Error('Missing practice prompts in section: '+id);
  for(const block of widgets){
   const buttons=own(block,n=>n.tag==='button'),pres=own(block,n=>n.tag==='pre');
   const copy=buttons.length===1&&buttons[0].attrs['data-copy-workflow'];
   const pre=pres.length===1&&pres[0],code=copy&&elements.find(n=>n.attrs.id===copy);
   if(!copy||!pre||!code||!(code===pre||within(code,pre))||elements.filter(n=>n.attrs.id===copy).length!==1||!/\[[^\]]+\]/.test(text(code)))throw Error('Practice prompt needs a copy target and editable input: '+id);
   if(!['받을 결과','직접 확인','이어서 물어보기'].every(label=>text(block).includes(label)))throw Error('Practice prompt needs output, verification and follow-up: '+id);
  }
 }
}
export function validateReadingResources(html,{review,issueDate}={}){
 const {elements,source}=reportElements(html),section=elements.find(n=>n.attrs.id==='reading');
 if(!section)throw Error('Reading section missing');
 const kinds=['article','video','post'],resources=elements.filter(n=>within(n,section)&&Object.hasOwn(n.attrs,'data-kind'));
 const counts=Object.fromEntries(kinds.map(k=>[k,0]));
 for(const node of resources){
  const kind=node.attrs['data-kind'];if(!kinds.includes(kind))throw Error('Invalid reading resource kind');
  const links=elements.filter(n=>n.tag==='a'&&within(n,node)&&/^https:\/\//.test(n.attrs.href||'')&&!resources.some(other=>other!==node&&within(other,node)&&within(n,other)));
  const primary=links[0],text=source.slice(node.start,node.end).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  if(!primary||!text)throw Error('Reading resource needs a title and primary source');
  let parsed;try{parsed=new URL(primary.attrs.href);}catch{throw Error('Invalid reading source');}
  const host=parsed.hostname.toLowerCase().replace(/^www\./,'');
  const youtube=(host==='youtu.be'&&parsed.pathname.length>1)||(host==='youtube.com'&&(parsed.pathname==='/watch'||parsed.pathname.startsWith('/shorts/')));
  if(youtube&&kind!=='video')throw Error('YouTube video must use video kind');
  counts[kind]++;
 }
 const coverage=review?.readingCoverage??[];
 if(!Array.isArray(coverage)||new Set(coverage.map(c=>c?.kind)).size!==coverage.length||coverage.some(c=>!kinds.includes(c?.kind)))throw Error('Invalid reading coverage');
 for(const kind of kinds){
  const item=coverage.find(c=>c.kind===kind);
  if(item&&item.count!==counts[kind])throw Error('Reading coverage count mismatch: '+kind);
  if(counts[kind])continue;
  const date=value=>{if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return NaN;const n=Date.parse(value+'T00:00:00Z');return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===value?n:NaN;};
  const issue=date(issueDate),searched=date(item?.searchedAt);
  if(!item||!['unverified','no_material_change'].includes(item.status)||!Number.isFinite(issue)||!Number.isFinite(searched)||searched>issue||searched<issue-7*86400000||!['searchScope','finding','limitation'].every(k=>typeof item[k]==='string'&&item[k].trim())||!Array.isArray(item.sourceUrls))throw Error('Missing reading search coverage: '+kind);
 }
 return counts;
}
export function validateAiCaseAndVideoResources(html){
 const {elements,source}=reportElements(html),lab=elements.find(n=>n.attrs.id==='ai-only-lab'),reading=elements.find(n=>n.attrs.id==='reading');
 const children=(node,predicate)=>elements.filter(n=>within(n,node)&&predicate(n));
 const text=node=>source.slice(node.start,node.end).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 const links=node=>children(node,n=>n.tag==='a'&&/^https:\/\//.test(n.attrs.href||''));
 const titled=node=>children(node,n=>/^h[34]$/.test(n.tag)&&text(n).length>0).length>0;
 const legacy=lab?children(lab,n=>Object.hasOwn(n.attrs,'data-ai-case')&&links(n).length>0):[];
 const selected=lab?children(lab,n=>n.tag==='article'&&Object.hasOwn(n.attrs,'data-selected-video')):[];
 for(const card of selected){
  const id=card.attrs['data-selected-video'],paragraphs=children(card,n=>n.tag==='p').map(text);
  const ai=paragraphs.some(p=>p.match(/AI\s*역할\s*[:：]\s*(.*?)(?=사람\s*역할\s*[:：]|$)/)?.[1].trim());
  const person=paragraphs.some(p=>p.match(/사람\s*역할\s*[:：]\s*(.+)$/)?.[1].trim());
  if(!/^[\w-]{11}$/.test(id)||!titled(card)||!links(card).some(n=>n.attrs.href===`https://www.youtube.com/watch?v=${id}`)||!ai||!person)throw Error('Invalid AI case: title, matching source and AI/person roles required');
 }
 if(!legacy.length&&!selected.length)throw Error('Missing AI case with source in ai-only-lab');
 const videoLink=node=>{
  try{const u=new URL(links(node)[0]?.attrs.href),host=u.hostname.toLowerCase().replace(/^www\./,'');return (host==='youtube.com'&&u.pathname==='/watch'&&/^[\w-]{11}$/.test(u.searchParams.get('v')||''))||(host==='youtu.be'&&/^\/[\w-]{11}\/?$/.test(u.pathname))||(host==='vimeo.com'&&/^\/\d+\/?$/.test(u.pathname));}catch{return false;}
 };
 const legacyVideos=lab?children(lab,n=>n.attrs['data-ai-resource']==='video'&&titled(n)&&videoLink(n)):[];
 const readingVideos=reading?children(reading,n=>n.tag==='article'&&n.attrs['data-kind']==='video'):[];
 if(readingVideos.some(node=>!titled(node)||!videoLink(node)))throw Error('Invalid video resource: title and primary video source required');
 if(!legacyVideos.length&&!readingVideos.length)throw Error('Missing video resource with title and direct source');
}
export function validateNavigationEnhancements(html,{reportDate}={}){
 const {elements}=reportElements(html);
 const assert=(condition,message)=>{if(!condition)throw Error(message);};
 const has=(node,key)=>Object.hasOwn(node.attrs,key);
 const descendants=(node,predicate)=>elements.filter(child=>within(child,node)&&predicate(child));
 const uniqueId=id=>elements.filter(node=>node.attrs.id===id);
 const styles=elements.filter(node=>node.tag==='link'&&node.attrs.rel==='stylesheet');
 const scripts=elements.filter(node=>node.tag==='script');
 const asset=node=>(node.attrs.href||node.attrs.src||'').split('?')[0];
 const searchCss='../assets/report/report-search.css',searchJs='../assets/report/report-search.js',scoped='../assets/report/reading-experience-scoped.js',legacy='../assets/report/reading-experience.js';
 const active=reportDate>='2026-11-14'||elements.some(node=>has(node,'data-report-search-panel')||has(node,'data-disclosure-scope'))||[...styles,...scripts].some(node=>[searchCss,searchJs,scoped].includes(asset(node)));
 if(!active)return false;
 const exactly=(items,path)=>items.filter(node=>asset(node)===path);
 assert(exactly(styles,searchCss).length===1&&asset(styles.at(-1))===searchCss,'Search stylesheet must occur once after the editorial stylesheet');
 assert(styles.length>1&&asset(styles.at(-2))==='../assets/report/weekly-editorial.css','Search stylesheet must occur once after the editorial stylesheet');
 const paths=['../assets/report/share.js',scoped,searchJs,`weekly-${reportDate}.js`];
 assert(paths.every(path=>exactly(scripts,path).length===1)&&!exactly(scripts,legacy).length,'Search requires one scoped script and no legacy reading script');
 const selected=paths.map(path=>exactly(scripts,path)[0]);
 assert(selected.every(node=>has(node,'defer'))&&selected.every((node,i)=>!i||node.start>selected[i-1].start),'Search scripts must be deferred and in the required order');
 const panels=elements.filter(node=>has(node,'data-report-search-panel'));
 assert(panels.length===2&&panels.every(node=>node.tag==='form'&&node.attrs.role==='search'&&(node.attrs['aria-label']||'').trim()),'Search requires two accessible forms');
 const side=uniqueId('side-nav')[0],sidebar=elements.find(node=>hasClass(node,'sidebar')&&side&&within(side,node)),header=elements.find(node=>node.tag==='header'),mobile=uniqueId('mobile-links')[0];
 assert(panels.filter(node=>(side&&within(node,side))||(sidebar&&within(node,sidebar))).length===1&&panels.filter(node=>(header&&within(node,header))||(mobile&&within(node,mobile))).length===1,'Search forms must be placed in desktop and mobile navigation');
 for(const panel of panels){
  const inputs=descendants(panel,node=>node.tag==='input'&&node.attrs.type==='search'&&has(node,'data-report-search-input'));
  assert(inputs.length===1&&inputs[0].attrs.id&&uniqueId(inputs[0].attrs.id).length===1&&descendants(panel,node=>node.tag==='label'&&node.attrs.for===inputs[0].attrs.id).length===1,'Search input needs a unique ID and matching label');
  for(const key of ['data-report-search-status','data-report-search-prev','data-report-search-next'])assert(descendants(panel,node=>has(node,key)).length===1,'Search panel control missing or duplicated: '+key);
  assert(descendants(panel,node=>node.tag==='button'&&node.attrs.type==='submit').length===1,'Search panel needs a submit button');
  const status=descendants(panel,node=>has(node,'data-report-search-status'))[0];assert(status.attrs.role==='status'&&status.attrs['aria-live']==='polite','Search status must be announced');
  for(const key of ['data-report-search-prev','data-report-search-next']){const button=descendants(panel,node=>has(node,key))[0];assert(button.tag==='button'&&button.attrs.type==='button'&&(button.attrs['aria-label']||'').trim(),'Search navigation must use labelled buttons');}
 }
 const mobilePanel=panels.find(node=>(header&&within(node,header))||(mobile&&within(node,mobile)));
 assert(mobilePanel.attrs.id&&uniqueId(mobilePanel.attrs.id).length===1&&has(mobilePanel,'hidden'),'Mobile search needs a unique initially hidden panel');
 const toggles=elements.filter(node=>has(node,'data-report-search-toggle'));
 assert(toggles.length===1&&toggles[0].tag==='button'&&toggles[0].attrs.type==='button'&&toggles[0].attrs['aria-controls']===mobilePanel.attrs.id&&toggles[0].attrs['aria-expanded']==='false','Mobile search toggle must target its panel');
 assert(descendants(mobilePanel,node=>node.tag==='button'&&has(node,'data-report-search-close')).length===1,'Mobile search close button missing');
 const groups=elements.filter(node=>has(node,'data-disclosure-scope'));
 // The scoped script can create controls at runtime. Browser QA must verify those
 // generated controls; when controls are authored statically, validate them here.
 const seen=new Set();
 for(const group of groups){
  const scopeId=group.attrs['data-disclosure-scope'],scope=uniqueId(scopeId);
  assert(scopeId&&!seen.has(scopeId)&&scope.length===1,'Disclosure scope must have a unique target');seen.add(scopeId);
  assert(within(group,scope[0])&&group.attrs.role==='group'&&(group.attrs['aria-label']||'').trim(),'Disclosure controls must be in their named scope');
  const actions=['expand','collapse'].map(action=>descendants(group,node=>node.tag==='button'&&node.attrs.type==='button'&&node.attrs['data-disclosure-action']===action));
  assert(actions.every(nodes=>nodes.length===1),'Disclosure scope requires expand and collapse buttons');
  const targets=actions.map(nodes=>(nodes[0].attrs['aria-controls']||'').trim().split(/\s+/).filter(Boolean));
  assert(targets[0].length&&new Set(targets[0]).size===targets[0].length&&JSON.stringify(targets[0])===JSON.stringify(targets[1]),'Disclosure buttons must list matching unique targets');
  for(const id of targets[0]){const target=uniqueId(id);assert(target.length===1&&target[0].tag==='details'&&within(target[0],scope[0]),'Disclosure target must be a unique detail in its scope');}
 }
 return true;
}
export function validateWeeklyPresentation(html,{reportDate}={}){
 const {elements,source}=reportElements(html);
 const oneId=id=>elements.find(node=>node.attrs.id===id);
 const text=node=>source.slice(node.start,node.end).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 const assert=(condition,message)=>{if(!condition)throw Error(message);};
 const descendants=(node,predicate)=>elements.filter(child=>within(child,node)&&predicate(child));
 assert(elements.some(node=>node.tag==='body'&&hasClass(node,'weekly-editorial')),'Missing weekly-editorial body class');
 const styles=elements.filter(node=>node.tag==='link'&&node.attrs.rel==='stylesheet').map(node=>(node.attrs.href||'').split('?')[0]);
 const enhanced=validateNavigationEnhancements(html,{reportDate});
 assert(styles.at(-1)===(enhanced?'../assets/report/report-search.css':'../assets/report/weekly-editorial.css'),'Weekly editorial stylesheet must be last before optional search stylesheet');
 for(const asset of ['report.css','share.css','reading-experience.css'])assert(styles.includes('../assets/report/'+asset),'Missing required report stylesheet: '+asset);
 const scripts=elements.filter(node=>node.tag==='script').map(node=>(node.attrs.src||'').split('?')[0]);
 for(const asset of ['share.js',enhanced?'reading-experience-scoped.js':'reading-experience.js'])assert(scripts.includes('../assets/report/'+asset),'Missing required report script: '+asset);
 if(reportDate>='2026-11-07')assert(scripts.includes(`weekly-${reportDate}.js`)&&!scripts.includes('../assets/report/report.js'),'New reports require an issue-specific UI/chart script');
 assert(elements.some(node=>node.tag==='html'&&node.attrs.lang==='ko'),'Report language must be Korean');
 const cover=elements.find(node=>hasClass(node,'issue-cover')),headings=elements.filter(node=>node.tag==='h1');
 assert(cover&&headings.length===1&&within(headings[0],cover)&&text(headings[0]).length>0,'Expected one h1 inside the issue cover');
 const categories={overview:['issue-summary','top10'],tools:['game-ai-tools','agent-skills','github-trending','ai-trends','game-ai','ai-releases','techniques'],making:['games','reverse','ai-only-lab','ai-planning','game-ideas','ai-production','prototype','lab'],resources:['careers','opportunities','reading','sources']};
 const unity=elements.filter(node=>node.attrs.id==='unity-official-guide');
 assert(unity.length<=1,'Unity guide must have a unique ID');
 if(unity.length)assert(unity[0].tag==='section'&&oneId('game-ai-tools')&&within(unity[0],oneId('game-ai-tools'))&&!within(unity[0],oneId('agent-skills')),'Unity guide must be inside game-ai-tools');
 const parts=elements.filter(node=>hasClass(node,'report-part')),toc=oneId('side-nav');
 const groups=elements.filter(node=>hasClass(node,'toc-group')&&toc&&within(node,toc));
 assert(JSON.stringify(parts.map(node=>node.attrs['data-report-part']))===JSON.stringify(Object.keys(categories)),'Report category structure is incomplete or reordered');
 assert(JSON.stringify(groups.map(node=>node.attrs['data-toc-group']))===JSON.stringify(Object.keys(categories)),'Navigation categories must match report categories');
 assert(Object.hasOwn(groups[0].attrs,'open')&&groups.slice(1).every(node=>!Object.hasOwn(node.attrs,'open')),'Only the overview navigation category should be initially open');
 const labels=['핵심 요약','AI 도구와 기술','게임 분석과 제작','취업과 참고 자료'];
 Object.entries(categories).forEach(([key,ids],index)=>{
  const label=descendants(groups[index],node=>node.tag==='summary')[0];assert(label&&text(label)===labels[index],'Navigation category label mismatch: '+key);
  if(index){const heading=descendants(parts[index],node=>hasClass(node,'part-heading'))[0];assert(heading&&text(heading)===labels[index],'Missing category divider label: '+key);}
  let previous=-1;
  for(const id of ids){const node=oneId(id);assert(node&&within(node,parts[index])&&node.start>previous,'Section is outside its category or out of order: '+id);previous=node.start;}
  assert(groups[index].tag==='details'&&groups[index].attrs.name==='report-toc','Navigation categories require native grouped details');
  const links=ids.map(id=>'#'+id);
  if(key==='tools'&&unity.length)links.splice(1,0,'#unity-official-guide');
  assert(JSON.stringify(descendants(groups[index],node=>node.tag==='a').map(node=>node.attrs.href))===JSON.stringify(links),'Navigation links differ from the category: '+key);
 });
 if(reportDate>='2026-11-07'){
  validateAiCaseAndVideoResources(html);
  const main=elements.find(n=>n.tag==='main'&&hasClass(n,'content'));
  const share=elements.filter(n=>n.attrs.id==='report-share');
  assert(main&&share.length===1&&share[0].tag==='button'&&within(share[0],main)&&share[0].attrs.type==='button'&&share[0].attrs['aria-haspopup']==='dialog'&&((share[0].attrs['aria-label']||'').trim()||text(share[0])),'Missing or invalid static share button');
  const print=elements.filter(n=>n.attrs.id==='print-button');assert(print.length===1&&print[0].tag==='button'&&print[0].attrs.type==='button'&&((print[0].attrs['aria-label']||'').trim()||text(print[0])),'Missing or invalid print button');
  const footers=elements.filter(n=>n.tag==='footer'&&within(n,main));assert(footers.length===1,'Missing report footer');
  assert(descendants(footers[0],n=>n.tag==='a'&&['../','../index.html'].includes(n.attrs.href)&&((n.attrs['aria-label']||'').trim()||text(n))).length>0,'Missing archive link in footer');
  const sources=elements.filter(n=>n.attrs.id==='sources');assert(sources.length===1&&sources[0].tag==='section'&&within(sources[0],main),'Missing source section in report');
  const careers=oneId('careers');
  for(const category of careerCategories){
   const block=descendants(careers,node=>node.attrs['data-career-category']===category)[0];
   assert(block&&text(block).length>0,'Career coverage missing: '+category);
   assert(descendants(block,node=>node.tag==='a'&&/^https:\/\//.test(node.attrs.href||'')).length>0,'Career source missing: '+category);
   assert(descendants(block,node=>['listed','open','planned','closed','unknown'].includes(node.attrs['data-career-status'])).length>0,'Career status missing: '+category);
   assert(/확인일/.test(text(block)),'Career retrieval date missing: '+category);
  }
  validateSectionPractices(html);
 }
 const summary=oneId('issue-summary'),top=oneId('top10');
 assert(summary&&hasClass(summary,'issue-summary')&&cover.start<summary.start&&summary.start<top.start,'Summary must follow cover and precede TOP 10');
 const takeaways=elements.find(node=>hasClass(node,'issue-takeaways')&&within(node,summary));
 assert(takeaways&&descendants(takeaways,node=>node.tag==='dt').length===3&&descendants(takeaways,node=>node.tag==='dd').length===3&&descendants(takeaways,node=>node.tag==='dd').every(node=>text(node).length>0),'Expected three nonempty issue summary takeaways');
 assert(JSON.stringify(descendants(takeaways,node=>node.tag==='dt').map(text))===JSON.stringify(['핵심 판단','도구 선택','이번 주 할 일']),'Summary takeaway labels must match the reading structure');
 const topics=elements.find(node=>hasClass(node,'issue-topic-links')&&within(node,summary));
 assert(topics&&JSON.stringify(descendants(topics,node=>node.tag==='a').map(node=>node.attrs.href))===JSON.stringify(['#game-ai-tools','#games','#game-ideas','#careers','#opportunities']),'Summary topic links are incomplete');
 const lists=descendants(top,node=>node.tag==='ol'&&hasClass(node,'top-ten-grid'));
 const items=list=>descendants(list,node=>node.tag==='li'&&hasClass(node,'top-ten-item'));
 const more=elements.find(node=>hasClass(node,'top-ten-more')&&within(node,top));
 for(const item of lists.flatMap(items)){for(const role of ['top-why','top-action','top-source']){const info=descendants(item,node=>hasClass(node,role))[0];assert(info&&text(info).length>0,'TOP 10 lacks visible evidence: '+role);if(role==='top-source')assert(descendants(info,node=>node.tag==='a'&&/^https:\/\//.test(node.attrs.href||'')).length>0,'TOP 10 source must link to its original');}}
 assert(lists.length===2&&items(lists[0]).length===3&&items(lists[1]).length===7&&more&&within(lists[1],more)&&!within(lists[0],more),'TOP 10 must show three items before seven expandable items');
 assert(elements.some(node=>node.tag==='mark'&&within(node,oneId('report'))&&text(node).length>0),'Missing meaningful highlighted report text');
 const ideaCards=elements.filter(node=>node.tag==='article'&&hasClass(node,'idea-card'));
 assert(ideaCards.length===6&&ideaCards.every(card=>descendants(card,node=>node.tag==='figure'&&hasClass(node,'idea-concept')).some(figure=>descendants(figure,node=>node.tag==='img'&&(node.attrs.alt||'').length>0).length&&descendants(figure,node=>node.tag==='figcaption'&&text(node).length>0).length)),'Each of the six ideas needs a captioned concept image');
 for(const card of elements.filter(node=>node.tag==='article'&&node.attrs['data-agent-skill'])){
  const evidence=descendants(card,node=>hasClass(node,'skill-selection'))[0];
  assert(evidence&&['선정 이유','문서상 강점','도입 부담·한계','이런 사람에게','작게 시도'].every(label=>descendants(evidence,node=>node.tag==='strong'&&text(node)===label).length),'Agent Skill needs visible selection reasons, strengths, limitations and a small trial');
 }
 const mobile=oneId('mobile-links');
 assert(mobile&&descendants(mobile,node=>node.tag==='a').length>=4,'Missing static mobile navigation fallback');
}
