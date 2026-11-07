document.addEventListener('click', async event => {
  const play = event.target.closest('[data-play-video]');
  if (play) {
    const frame = document.createElement('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/' + play.dataset.playVideo;
    frame.title = '스프라이트 제작 영상';
    frame.allowFullscreen = true;
    play.parentElement.querySelector('.video-slot').replaceChildren(frame);
    play.remove();
    return;
  }
  if (event.target.id === 'tool-reset') {
    document.getElementById('tool-goal').value = 'all';
    filterTools();
    return;
  }
  const button = event.target.closest('[data-copy-workflow], [data-copy-idea], [data-copy-ai-plan]');
  if (!button) return;
  const target = button.dataset.copyWorkflow ? document.getElementById(button.dataset.copyWorkflow) : button.closest('.idea-card');
  try {
    await navigator.clipboard.writeText(target.textContent.trim());
    button.textContent = '복사했어요';
  } catch {
    button.textContent = '텍스트를 직접 선택해 복사하세요';
  }
});
function filterTools() {
  const goal = document.getElementById('tool-goal').value;
  let count = 0;
  document.querySelectorAll('[data-tool-goal]').forEach(tool => {
    tool.hidden = goal !== 'all' && tool.dataset.toolGoal !== goal;
    if (!tool.hidden) count++;
  });
  document.querySelectorAll('[data-tool-row]').forEach(row => {
    row.hidden = goal !== 'all' && row.dataset.toolRow !== goal;
  });
  document.getElementById('tool-count').textContent = count + '개 도구';
}
document.getElementById('tool-goal').addEventListener('change', filterTools);

document.getElementById('print-button').addEventListener('click', () => window.print());
function updateReadingProgress() {
  const distance = document.documentElement.scrollHeight - innerHeight;
  const percent = distance > 0 ? Math.min(100, Math.round(scrollY / distance * 100)) : 100;
  document.getElementById('read-percent').textContent = percent + '%';
  document.getElementById('read-bar').style.width = percent + '%';
}
addEventListener('scroll', updateReadingProgress, {passive: true});
addEventListener('resize', updateReadingProgress);
updateReadingProgress();
