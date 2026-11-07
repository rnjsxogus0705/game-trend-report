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
export function validateWeeklyPresentation(html,{reportDate}={}){
 const {elements,source}=reportElements(html);
 const oneId=id=>elements.find(node=>node.attrs.id===id);
 const text=node=>source.slice(node.start,node.end).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 const assert=(condition,message)=>{if(!condition)throw Error(message);};
 const descendants=(node,predicate)=>elements.filter(child=>within(child,node)&&predicate(child));
 assert(elements.some(node=>node.tag==='body'&&hasClass(node,'weekly-editorial')),'Missing weekly-editorial body class');
 const styles=elements.filter(node=>node.tag==='link'&&node.attrs.rel==='stylesheet').map(node=>(node.attrs.href||'').split('?')[0]);
 assert(styles.at(-1)==='../assets/report/weekly-editorial.css','Weekly editorial stylesheet must be last');
 for(const asset of ['report.css','share.css','reading-experience.css'])assert(styles.includes('../assets/report/'+asset),'Missing required report stylesheet: '+asset);
 const scripts=elements.filter(node=>node.tag==='script').map(node=>(node.attrs.src||'').split('?')[0]);
 for(const asset of ['share.js','reading-experience.js'])assert(scripts.includes('../assets/report/'+asset),'Missing required report script: '+asset);
 if(reportDate>='2026-11-07')assert(scripts.includes(`weekly-${reportDate}.js`)&&!scripts.includes('../assets/report/report.js'),'New reports require an issue-specific UI/chart script');
 assert(elements.some(node=>node.tag==='html'&&node.attrs.lang==='ko'),'Report language must be Korean');
 const cover=elements.find(node=>hasClass(node,'issue-cover')),headings=elements.filter(node=>node.tag==='h1');
 assert(cover&&headings.length===1&&within(headings[0],cover)&&text(headings[0]).length>0,'Expected one h1 inside the issue cover');
 const categories={overview:['issue-summary','top10'],tools:['game-ai-tools','agent-skills','github-trending','ai-trends','game-ai','ai-releases','techniques'],making:['games','reverse','ai-only-lab','ai-planning','game-ideas','ai-production','prototype','lab'],resources:['careers','opportunities','reading','sources']};
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
  assert(JSON.stringify(descendants(groups[index],node=>node.tag==='a').map(node=>node.attrs.href))===JSON.stringify(ids.map(id=>'#'+id)),'Navigation links differ from the category: '+key);
 });
 if(reportDate>='2026-11-07'){
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
