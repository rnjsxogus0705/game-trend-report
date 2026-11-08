(function () {
  'use strict';

  // Mulberry32 uses one fixed seed per run, so equal inputs reproduce equal results.
  function simulate(probability, chances) {
    if (!Number.isInteger(probability) || probability < 0 || probability > 100 ||
        !Number.isInteger(chances) || chances < 1 || chances > 10) {
      throw new RangeError('Invalid probability or chance count');
    }
    let state = 20261107;
    const counts = Array(chances + 1).fill(0);
    for (let game = 0; game < 1000; game += 1) {
      let successes = 0;
      for (let turn = 0; turn < chances; turn += 1) {
        state = (state + 0x6D2B79F5) >>> 0;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        const random = ((value ^ (value >>> 14)) >>> 0) / 4294967296;
        if (random * 100 < probability) successes += 1;
      }
      counts[successes] += 1;
    }
    return counts;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { simulate };
  if (typeof document === 'undefined') return;

  const root = document.querySelector('[data-lab-simulation]');
  if (!root) return;
  const form = root.querySelector('form');
  const probability = root.querySelector('[name="probability"]');
  const chances = root.querySelector('[name="chances"]');
  const result = root.querySelector('[data-lab-result]');
  const summary = root.querySelector('[data-lab-summary]');
  const body = root.querySelector('tbody');
  const reset = root.querySelector('[data-lab-reset]');
  if (!form || !probability || !chances || !result || !summary || !body || !reset) return;

  function render() {
    const p = Number(probability.value);
    const n = Number(chances.value);
    const counts = simulate(p, n);
    const rows = document.createDocumentFragment();
    counts.forEach((count, index) => {
      const row = document.createElement('tr');
      const heading = document.createElement('th');
      heading.scope = 'row';
      heading.textContent = index + '회';
      const total = document.createElement('td');
      total.textContent = count + '판';
      const percentage = document.createElement('td');
      percentage.textContent = (count / 10).toFixed(1) + '%';
      row.append(heading, total, percentage);
      rows.append(row);
    });
    body.replaceChildren(rows);
    summary.textContent = '발동 확률 ' + p + '%, 한 판의 기회 ' + n + '회로 1,000판을 계산했어요.';
    result.hidden = false;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    render();
  });
  [probability, chances].forEach(function (input) {
    input.addEventListener('change', function () { if (!result.hidden) render(); });
  });
  reset.addEventListener('click', function () {
    probability.value = '50';
    chances.value = '2';
    if (!result.hidden) render();
  });
  root.hidden = false;
}());
