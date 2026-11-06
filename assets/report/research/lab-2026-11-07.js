// 가상 데이터 규칙 예제; AI 정확도나 실제 게임 측정이 아닙니다.
const rows = [['A', 50], ['B', 100], ['A', 30], ['', 20], ['C', 0], ['D', 101]];
const seen = new Set();
for (const [id, hp] of rows) {
  const issues = [];
  if (!id) issues.push('ID 누락');
  if (id && seen.has(id)) issues.push('ID 중복');
  if (hp < 1 || hp > 100) issues.push('범위 위반');
  if (id) seen.add(id);
  console.log(id || '(빈 값)', hp, issues.join(', ') || '정상');
}
