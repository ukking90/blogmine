<!-- Tag.vue -->
<style scoped lang="scss" src="@/assets/tag.scss" />
<template>
  <section v-if="status === 'error'">
    <div class="section">
      <h2>❌ 해시 태그 추천 실패</h2>
      <p>AI 호출에 실패했습니다.<br>일일 한도 초과 또는 네트워크 문제로 인해 사용이 제한될 수 있어요.</p>
    </div>
  </section>

  <section v-else-if="status === 'success' && tags.length" class="tag-box">
    <div class="section section--row">
      <h2>🏷️ 추천 해시태그</h2>
      <div>
        <button @click="refreshTags" class="mini-refresh-btn">재생성</button>
        <button @click="copyTags" class="mini-copy-btn">복사하기</button>
      </div>
    </div>
    <div class="section">
      <div class="tag-wrap">
        <span v-for="tag in tags" :key="tag" class="tag-badge" @click="copyTag(tag)">#{{ tag
          }}</span>
      </div>
    </div>
  </section>

  <section v-else>
    <div class="section">
      <h2>⏳ 데이터 조회 중...</h2>
      <p>잠시만 기다려주세요.</p>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'

const status = ref('idle')
const result = ref(null)
const tags = ref([])

const LOCAL_KEY = 'blogmine:tags'

async function fetchTagsFromOpenRouter(text) {
  try {
    const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'deepseek/deepseek-chat-v3-0324:free',
      messages: [
        {
          role: 'system',
          content: '너는 블로그 해시태그 추천 전문가야. 본문에서 적절한 단어 30개를 해시태그로 추천해줘. 해시태그 없이 단어만 공백 구분으로 출력해.'
        },
        { role: 'user', content: text }
      ]
    }, {
      headers: {
        Authorization: 'Bearer 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',
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://your-extension-url.com'
      }
    })

    return res.data.choices?.[0]?.message?.content
    ?.split(/\s+/)
    .filter(Boolean)
  }catch (e) {
    console.error('태그 추천 실패:', e)
    throw e
  }
}

function copyTag(tag) {
  copyToClipboard(`#${tag}`)
}

function copyTags() {
  const tagText = tags.value.map(t => `#${t}`).join(' ')
  copyToClipboard(tagText)
  console.log('📋 복사 완료:', tagText)
}

function copyToClipboard(text) {
  if (!text) return

  // 우선 modern clipboard API 시도
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
    .writeText(text)
    .then(() => console.log('복사완료')) // ✅ 1초 뒤에 나타남)
    .catch(err => {
      console.warn('⚠️ navigator.clipboard 실패, polyfill로 fallback:', err)
      fallbackCopyText(text)
    })
  } else {
    // HTTP 환경이거나, 구형 브라우저면 바로 fallback
    fallbackCopyText(text)
  }
}

function fallbackCopyText(text) {
  const tempInput = document.createElement('input')
  tempInput.value = text
  document.body.appendChild(tempInput)
  tempInput.select()
  tempInput.setSelectionRange(0, 99999) // 모바일 대응
  document.execCommand('copy')
  document.body.removeChild(tempInput)
  console.log('📋 (fallback) 복사 성공:', text)
}

async function refreshTags() {
  localStorage.removeItem(LOCAL_KEY)
  getRecommendTag()
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem(LOCAL_KEY)
  if (saved) {
    tags.value = JSON.parse(saved)
    return true
  }
  return false
}

function getRecommendTag() {
  status.value = 'loading'

  const content = import.meta.env.MODE === 'development'
    ? `오늘은 정말 특별한 다이어트약을 소개하려고 해요! ...` // 생략
    : null

  const use = async (text) => {
    result.value = { content: text, length: text.length }
    const loaded = loadFromLocalStorage()
    if (!loaded) {
      try {
        tags.value = await fetchTagsFromOpenRouter(text)
        localStorage.setItem(LOCAL_KEY, JSON.stringify(tags.value))
        status.value = 'success'
      } catch (e) {
        status.value = 'error'
      }
    } else {
      status.value = 'success'
    }
  }

  if (content) {
    use(content)
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(tab.id, { type: 'GET_EDITOR_TEXT' }, async (res) => {
        if (res?.text) {
          use(res.text)
        } else {
          status.value = 'error'
        }
      })
    })
  }
}

onMounted(() => {
  getRecommendTag()
})
</script>
