(() => {
  'use strict';
  const root = document.getElementById('report');
  const panels = [...document.querySelectorAll('[data-report-search-panel]')];
  if (!root || !panels.length) return;
  const toggle = document.querySelector('[data-report-search-toggle]');
  const mobile = document.getElementById('report-search-mobile-panel');
  const inputs = panels.map(panel => panel.querySelector('[data-report-search-input]'));
  if (inputs.some(input => !input)) return;

  let query = '', matches = [], current = -1, dirty = true, timer, fallbackSelectionOwned = false;
  const maxMatches = 5000;
  const excluded = 'script,style,noscript,template,textarea,input,select,button,[hidden]:not([data-tool-goal]):not([data-tool-row]),[aria-hidden="true"],[inert]';
  const blockSelector = 'p,h1,h2,h3,h4,h5,h6,li,td,th,dt,dd,figcaption,summary,pre,blockquote';
  const hasHighlights = Boolean(globalThis.CSS?.highlights && globalThis.Highlight);
  const paint = range => {
    if (hasHighlights) {
      if (range) CSS.highlights.set('report-search-current', new Highlight(range));
      else CSS.highlights.delete('report-search-current');
    } else {
      const selection = window.getSelection();
      if (!selection) return;
      if (range || fallbackSelectionOwned) selection.removeAllRanges();
      if (range) selection.addRange(range);
      fallbackSelectionOwned = Boolean(range);
    }
  };
  const showStatus = () => {
    const message = !query ? '검색어를 입력하세요.' : !matches.length ? '검색 결과가 없습니다.' : current < 0 ? `검색 결과 ${matches.length}${matches.length === maxMatches ? '개 이상' : '개'}` : `검색 결과 ${current + 1} / ${matches.length}${matches.length === maxMatches ? '개 이상' : ''}`;
    panels.forEach(panel => {
      panel.querySelector('[data-report-search-status]').textContent = message;
      panel.querySelectorAll('[data-report-search-prev], [data-report-search-next]').forEach(button => { button.disabled = !matches.length; });
    });
  };
  const indexText = () => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const segments = []; let text = '', lastBlock = null, node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent || parent.closest(excluded) || !node.data) continue;
      const block = parent.closest(blockSelector) || parent;
      if (lastBlock && block !== lastBlock) text += '\n';
      const start = text.length;
      text += node.data;
      segments.push({ node, start, end: text.length });
      lastBlock = block;
    }
    return { text, segments };
  };
  const segmentAt = (segments, pos, endBoundary = false) => {
    let lo = 0, hi = segments.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1, segment = segments[mid];
      if (pos < segment.start) hi = mid - 1;
      else if (pos > segment.end || (pos === segment.end && !endBoundary)) lo = mid + 1;
      else return segment;
    }
    return null;
  };
  const rebuild = () => {
    clearTimeout(timer); dirty = false; const previous = matches[current] || null; matches = []; current = -1; paint(null);
    if (!query) { showStatus(); return; }
    const { text, segments } = indexText();
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const expression = new RegExp(escaped, 'giu');
    let match;
    while ((match = expression.exec(text)) && matches.length < maxMatches) {
      const start = segmentAt(segments, match.index);
      const end = segmentAt(segments, match.index + match[0].length, true);
      if (!start || !end) continue;
      const range = document.createRange();
      range.setStart(start.node, match.index - start.start);
      range.setEnd(end.node, match.index + match[0].length - end.start);
      matches.push(range);
    }
    if (previous) current = matches.findIndex(range => range.startContainer === previous.startContainer && range.startOffset === previous.startOffset && range.endContainer === previous.endContainer && range.endOffset === previous.endOffset);
    showStatus();
  };
  const navigate = direction => {
    if (dirty) rebuild();
    if (!matches.length) return;
    current = current < 0 ? (direction < 0 ? matches.length - 1 : 0) : (current + direction + matches.length) % matches.length;
    const range = matches[current];
    let element = range.startContainer.parentElement;
    if (element?.closest('[hidden][data-tool-goal], [hidden][data-tool-row]')) document.getElementById('tool-reset')?.click();
    for (let parent = element; parent && parent !== root; parent = parent.parentElement) {
      if (parent.tagName === 'DETAILS') parent.open = true;
    }
    paint(range);
    const rect = range.getBoundingClientRect();
    const mobileBottom = mobile && !mobile.hidden && getComputedStyle(mobile).display !== 'none' ? mobile.getBoundingClientRect().bottom + 24 : 160;
    window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - Math.max(160, mobileBottom)), behavior: 'instant' });
    showStatus();
  };
  const update = value => {
    const clean = value.trim();
    inputs.forEach(input => { if (input.value !== value) input.value = value; });
    if (query !== clean) current = -1;
    query = clean; dirty = true; clearTimeout(timer);
    timer = setTimeout(rebuild, 180);
  };
  panels.forEach(panel => {
    const input = panel.querySelector('[data-report-search-input]');
    input.addEventListener('input', () => update(input.value));
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); navigate(event.shiftKey ? -1 : 1); }
    });
    panel.addEventListener('submit', event => { event.preventDefault(); navigate(1); });
    panel.querySelector('[data-report-search-prev]').addEventListener('click', () => navigate(-1));
    panel.querySelector('[data-report-search-next]').addEventListener('click', () => navigate(1));
  });
  const closeMobile = () => {
    if (!mobile || mobile.hidden) return;
    mobile.hidden = true; document.body.classList.remove('report-search-open'); toggle?.setAttribute('aria-expanded', 'false'); toggle?.focus();
  };
  toggle?.addEventListener('click', () => {
    if (!mobile) return;
    if (!mobile.hidden) { closeMobile(); return; }
    mobile.hidden = false; document.body.classList.add('report-search-open'); toggle.setAttribute('aria-expanded', 'true');
    mobile.querySelector('[data-report-search-input]')?.focus();
  });
  mobile?.querySelector('[data-report-search-close]')?.addEventListener('click', closeMobile);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMobile(); });
  new MutationObserver(() => { dirty = true; }).observe(root, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'aria-hidden'] });
  showStatus();
})();
