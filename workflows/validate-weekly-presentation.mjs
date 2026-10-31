// This checks the project's well-formed static report markup, not arbitrary third-party HTML.
const voidTags=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
function reportElements(html){
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
