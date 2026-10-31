(()=>{'use strict';
function monthlyPrice(text) {
  const match = text.match(/([₩$])\s*([\d,]+(?:\.\d+)?)\s*\/\s*월/) || text.match(/월\s*([₩$])\s*([\d,]+(?:\.\d+)?)/);
  if (!match) return null;
  return {currency: match[1] === '$' ? 'USD' : 'KRW', amount: Number(match[2].replaceAll(',', '')), annual: /연간\s*청구/.test(text)};
}
function hasGoal(goals, goal) { return goals.split(/\s+/).includes(goal); }
if (typeof module !== 'undefined') module.exports = {monthlyPrice, hasGoal};
if (typeof document === 'undefined') return;
const root=document.getElementById('game-ai-tools'),select=document.getElementById('tool-goal');if(!root||!select)return;const cards=[...root.querySelectorAll('.tool-research-card')],rows=[...root.querySelectorAll('[data-compare-goals]')],status=document.getElementById('tool-choice-status');const visual = document.createElement('section');
visual.className = 'tool-visual';
visual.setAttribute('aria-labelledby', 'tool-visual-title');
visual.innerHTML = '<h4 id="tool-visual-title">도구를 고르는 비교 지도</h4><p>공개된 가격과 작업 범주를 비교해요. 성능·가성비 순위는 아니에요.</p><div class="tool-price-chart"></div><div class="tool-workflow"><h5>결과물이 게임에 들어가기까지</h5><ol><li><strong>입력</strong><span>참조와 조건 정하기</span></li><li><strong>생성</strong><span>작은 결과 시험하기</span></li><li><strong>수정</strong><span>형태·권리 확인하기</span></li><li><strong>엔진</strong><span>파일·재질 연결하기</span></li><li><strong>검증</strong><span>실행·성능 확인하기</span></li></ol></div><div class="tool-matrix"></div><details class="tool-counts"><summary>작업별 조사 후보 수 보기</summary><p>한 도구가 여러 작업에 포함될 수 있어요. 후보 수는 성능이나 인기도가 아니에요.</p><div class="tool-visual-bars" role="list" aria-label="작업별 조사 후보 수"></div></details><details class="tool-costs"><summary>선택한 후보의 무료·유료 조건 살펴보기</summary><p>확인일은 아래 비교표를 참고해요. 크레딧·토큰·포인트는 서로 다르고 갱신 주기도 달라 숫자를 직접 비교할 수 없어요. 실제 결제 전 원문을 다시 확인해요.</p><ul class="tool-cost-list"></ul></details><p class="tool-visual-note">성능은 직접 비교 실험하지 않았어요. 같은 입력으로 결과 품질, 수정 시간, 엔진 연결을 확인한 뒤 선택해요.</p>';
const bars = visual.querySelector('.tool-visual-bars');
const costs = visual.querySelector('.tool-cost-list');
const groups = [...select.options].filter(option => option.value !== 'all');

const chart = visual.querySelector('.tool-price-chart');
chart.innerHTML = '<h5>월 표기 가격 · USD/월</h5><p>표에 적힌 월 가격을 같은 0축에서 표시했어요. 기능과 조건이 달라 가격만으로 가치를 비교할 수 없어요. 환율·세금·할인은 포함하지 않아요.</p><div class="tool-price-bars"></div><div class="tool-price-separate"></div><p>월 표기와 실제 청구 주기는 다를 수 있어요. 실제 결제 전 원문을 다시 확인해요.</p>';
const priceRows = rows.map(row => {
  const cells = row.querySelectorAll('th, td');
  return { name: cells[0].textContent.trim(), text: cells[2].textContent.trim(), price: monthlyPrice(cells[2].textContent), source: cells[5].querySelector('a') };
}).filter(row => row.price);
const monthlyUSD = priceRows.filter(row => row.price.currency === 'USD' && !row.price.annual);
const maxUSD = Math.max(1, ...monthlyUSD.map(row => row.price.amount));
for (const row of monthlyUSD) {
  const item = document.createElement('div');
  item.className = 'tool-visual-bar';
  const label = document.createElement('span'); label.textContent = row.name;
  const track = document.createElement('span'); track.className = 'tool-visual-track'; track.setAttribute('aria-hidden', 'true');
  const fill = document.createElement('span'); fill.style.width = `${row.price.amount / maxUSD * 100}%`; track.append(fill);
  const amount = document.createElement('strong'); amount.textContent = `$${row.price.amount}`;
  item.append(label, track, amount); chart.querySelector('.tool-price-bars').append(item);
}
const axis = document.createElement('div'); axis.className = 'tool-price-axis';
const axisRange = document.createElement('span'); axisRange.innerHTML = `<span>0</span><span>${maxUSD} USD/월</span>`; axis.append(axisRange);
chart.querySelector('.tool-price-bars').append(axis);
for (const row of priceRows.filter(row => row.price.annual || row.price.currency !== 'USD')) {
  const item = document.createElement('p');
  item.textContent = `${row.name} · ${row.text} (${row.price.annual ? '연간 청구 환산' : '원화 별도 표기'})`;
  chart.querySelector('.tool-price-separate').append(item);
}
if (monthlyUSD.some(row => row.name.includes('Luma') && row.price.amount === 30)) {
  const note = document.createElement('p');
  note.innerHTML = '<a href="https://lumalabs.ai/learning-hub/payments-subscriptions">Luma 공식 안내</a>는 웹 Plus 월간 구독을 $29.99/월로 안내해요. 아래 표의 $30은 반올림된 표기이며 연간 결제도 별도로 제공돼요.';
  chart.append(note);
}
const matrix = visual.querySelector('.tool-matrix');
matrix.innerHTML = '<h5>작업 범주 비교</h5><p>●는 이번 조사에서 해당 작업의 후보로 분류했다는 뜻이에요. —는 미조사이며 미지원이라는 뜻이 아니에요. 표는 좌우로 이동할 수 있어요.</p><div class="tool-matrix-scroll" tabindex="0" role="region" aria-label="도구별 작업 범주 비교, 가로 스크롤 가능"><table><caption>도구별 조사 작업 범주</caption><thead><tr><th scope="col">도구</th></tr></thead><tbody></tbody></table></div>';
const headings = matrix.querySelector('thead tr');
for (const group of groups) {
  const heading = document.createElement('th'); heading.scope = 'col'; heading.textContent = group.textContent; headings.append(heading);
}
for (const row of rows) {
  const item = document.createElement('tr'); item.dataset.compareGoals = row.dataset.compareGoals;
  const name = document.createElement('th'); name.scope = 'row'; name.append(row.querySelector('th a').cloneNode(true)); item.append(name);
  for (const group of groups) {
    const cell = document.createElement('td');
    const included = hasGoal(row.dataset.compareGoals || '', group.value);
    cell.textContent = included ? '●' : '—';
    cell.setAttribute('aria-label', included ? '이번 조사 후보' : '미조사');
    item.append(cell);
  }
  matrix.querySelector('tbody').append(item);
}

for (const option of groups) {
  const count = cards.filter(card => (card.dataset.toolGoals || '').split(' ').includes(option.value)).length;
  const item = document.createElement('div');
  item.className = 'tool-visual-bar';
  item.setAttribute('role', 'listitem');
  const label = document.createElement('span');
  label.textContent = option.textContent;
  const track = document.createElement('span');
  track.className = 'tool-visual-track';
  track.setAttribute('aria-hidden', 'true');
  const fill = document.createElement('span');
  fill.style.width = `${count / cards.length * 100}%`;
  track.append(fill);
  const total = document.createElement('strong');
  total.textContent = `${count}개`;
  item.append(label, track, total);
  bars.append(item);
}
for (const row of rows) {
  const cells = row.querySelectorAll('th, td');
  const item = document.createElement('li');
  item.dataset.compareGoals = row.dataset.compareGoals;
  const name = document.createElement('strong');
  const link = cells[0].querySelector('a').cloneNode(true);
  name.append(link);
  const free = document.createElement('span');
  free.textContent = `무료·공개: ${cells[1].textContent.trim()}`;
  const paid = document.createElement('span');
  paid.textContent = `유료·실행: ${cells[2].textContent.trim()}`;
  const functionLine = document.createElement('span');
  functionLine.textContent = `주요 기능: ${cells[3].textContent.trim()}`;
  const source = cells[5].querySelector('a').cloneNode(true);
  source.textContent = '가격·조건 원문 보기';
  item.append(name, functionLine, free, paid, source);
  costs.append(item);
}
root.querySelector('.tool-comparison').before(visual);
const matches=(value,goals)=>value==='all'||goals.split(' ').includes(value);function apply(){let count=0;for(const c of cards){c.hidden=!matches(select.value,c.dataset.toolGoals||'');if(!c.hidden)count++;}for(const r of [...rows,...costs.children,...matrix.querySelectorAll('tbody tr')])r.hidden=!matches(select.value,r.dataset.compareGoals||'');status.textContent=count+'개 후보를 보여드려요. 성능 순위가 아니라 작업 목적에 맞춘 목록이에요.';}select.addEventListener('change',apply);root.querySelectorAll('a[href^="#tool-"]').forEach(a=>a.addEventListener('click',()=>{const target=document.getElementById(a.hash.slice(1));if(target?.hidden){select.value='all';apply();}}));root.querySelectorAll('.tool-demo').forEach(d=>d.addEventListener('toggle',()=>{const v=d.querySelector('video');if(d.open&&v.dataset.src&&!v.src){v.src=v.dataset.src;v.load();}if(!d.open)v.pause();}));root.querySelectorAll('.tool-demo video').forEach(v=>v.addEventListener('error',()=>{v.parentElement.querySelector('[role=status]').textContent='이 환경에서는 영상을 불러오지 못했어요. 공식 원문 링크에서 확인해 주세요.';}));apply();})();
