console.log('📌 blogmine content.js loaded')

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_EDITOR_TEXT') {
    const result = getFromEditorIframe()
    if (!result) {
      sendResponse({ text: '❌ iframe 접근 또는 본문 찾기 실패', imgCnt: 0 })
      return
    }

    const cleanedText = cleanText(result.rawText)
    sendResponse({ text: cleanedText, imgCnt: result.imageCount })
  }
  return true
})

function cleanText(text) {
  return text
  // 모든 줄바꿈, 탭 등 → 공백 하나로
  .replace(/\s+/g, ' ')
  // 이모지 제거 (광범위한 범위 커버)
  .replace(/[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{1F900}-\u{1F9FF}\u{2600}-\u{27BF}]/gu, '')
  // 양쪽 공백 제거
  .trim()
}

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const step = 100
    let elapsed = 0

    const interval = setInterval(() => {
      const el = document.querySelector(selector)
      if (el) {
        clearInterval(interval)
        resolve(el)
      } else if ((elapsed += step) >= timeout) {
        clearInterval(interval)
        reject(new Error(`⏰ ${selector} not found within timeout`))
      }
    }, step)
  })
}

//const junkClasses = [
//  'se-is-empty',
//  'se-module-image',
//  'se-image',
//  'se-video'
//]
//function getFromEditorIframe() {
//  const iframe = document.querySelector('iframe')
//  const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document
//  if (!iframeDoc) return null
//
//  const container = iframeDoc.querySelector('.se-components-wrap')
//  if (!container) return null
//
//  const childNodes = [...container.children].slice(1)
//  const rawText = childNodes
//  .map(el => el.innerText?.trim())
//  .filter(Boolean)
//  .join('\n')
//
//  return rawText
//}

function getFromEditorIframe() {
  const iframe = document.querySelector('iframe')
  const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document
  if (!iframeDoc) return null

  const container = iframeDoc.querySelector('.se-components-wrap')
  if (!container) return null

  const clone = container.cloneNode(true)

  // 🎯 이미지 카운트용
  const imageCount = clone.querySelectorAll('img').length;

    // 불필요한 요소 제거
    [...clone.querySelectorAll('*')].forEach(el => {
    const cls = el.classList
    if (
      cls.contains('se-is-empty') ||
      cls.contains('se-module-image') ||
      cls.contains('se-image') ||
      cls.contains('se-video') ||
      cls.contains('se-cover-button-wrap')
    ) {
      el.remove()
    }
  })

  // 줄바꿈 삽입
  applyLineBreaksBeforeBlocks(clone)

  const childNodes = [...clone.children]
  const rawText = childNodes
  .map(el => el.textContent?.trim())
  .join('\n')

  return { rawText, imageCount }
}

function applyLineBreaksBeforeBlocks(node) {
  const blockTags = ['P', 'DIV', 'SECTION', 'ARTICLE', 'LI', 'H1', 'H2', 'H3'];

  function recurse(el) {
    if (!el || el.nodeType !== 1) return;

    if (blockTags.includes(el.tagName)) {
      el.insertAdjacentText('beforebegin', '\n');
    }

    [...el.children].forEach(recurse);
  }

  recurse(node);
}
