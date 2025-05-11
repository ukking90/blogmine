console.log('📌 blogmine content.js loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_EDITOR_TEXT') {
    const result = getFromEditorIframe();
    if (!result) {
      sendResponse({ text: '❌ iframe 접근 또는 본문 찾기 실패' });
      return;
    }
    sendResponse({ text: cleanText(result) });
  }
  return true;
});

function cleanText(text) {
  return text
  // 모든 줄바꿈, 탭 등 → 공백 하나로
  .replace(/\s+/g, ' ')
  // 이모지 제거 (광범위한 범위 커버)
  .replace(/[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{1F900}-\u{1F9FF}\u{2600}-\u{27BF}]/gu, '')
  // 양쪽 공백 제거
  .trim();
}

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const step = 100;
    let elapsed = 0;

    const interval = setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        clearInterval(interval);
        resolve(el);
      } else if ((elapsed += step) >= timeout) {
        clearInterval(interval);
        reject(new Error(`⏰ ${selector} not found within timeout`));
      }
    }, step);
  });
}
function getFromEditorIframe() {
  const iframe = document.querySelector('iframe');
  const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
  if (!iframeDoc) return null;

  const container = iframeDoc.querySelector('.se-components-wrap');
  if (!container) return null;

  const childNodes = [...container.children].slice(1);
  const rawText = childNodes
  .map(el => el.innerText?.trim())
  .filter(Boolean)
  .join('\n');

  return rawText;
}
