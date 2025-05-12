<!--스타일태그를 만들어서 analyze.scss import-->
<style scoped lang="scss" src="@/assets/copy.scss" />
<template>
  <section v-if="status === 'error'">
    <div class="section">
      <h2>❌ 복사 실패</h2>
      <p>본문을 불러오지 못했어요. 스마트에디터 창이 열려 있는지 확인해주세요.</p>
    </div>
  </section>
  <section v-else-if="status === 'success' && result" class="copy-box">
    <div class="section">
      <h2>📏 콘텐츠 길이: <strong>{{ result.length }}</strong>자</h2>
      <button @click="reCopy" class="mini-copy-btn">복사하기</button>
    </div>
    <div class="section">
    <textarea
      class="textarea-clean"
      :value="result.content"
      readonly />
    </div>
    <span v-if="copyStatus" class="copied-sticker">복사<br />완료</span>
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

const status = ref('idle') // 'idle' | 'loading' | 'success' | 'error'
const result = ref(null)
const copyStatus = ref(false)

function reCopy(){
  copyStatus.value = false
  status.value = 'loading'
  setTimeout(() => {
    copy()
  }, 500)
}

function copy() {
  status.value = 'loading'
  if (import.meta.env.MODE === 'development') {
    const content = `오늘은 정말 특별한 다이어트약을 소개하려고 해요!이 제품은 부작용 없음은 물론, 100% 치료 효과가 있다는 말이 있을 정도로 입소문이 난 제품이에요.실제로 저도 사용해보고 너무 만족했어요. 무료 제공 이벤트도 진행 중이라, 지금바로 신청하시는 걸 추천드립니다.다이어트약 다이어트약 다이어트약, 효과가 정말 좋았고요.부작용 없음 부작용 없음 부작용 없음! 이 말이 왜 나오는지 알겠더라고요.추천 추천 추천. 저도 추천하고, 친구도 추천했고, 강력 추천합니다.이 블로그를 통해서 더 많은 후기와 정보를 얻어가셨으면 좋겠어요!최저가 보장, 정품 인증 모두 완료된 제품이라 믿고 구매하셔도 됩니다 ^^`
    result.value = { content, length: content.length }

    copyToClipboard(result.value.content)
    status.value = 'success'
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(tab.id, { type: 'GET_EDITOR_TEXT' }, (res) => {
        if (res?.text) {
          status.value = 'success'
          result.value = { content: res.text, length: res.text.length }
          copyToClipboard(result.value.content)
        } else {
          status.value = 'error'
        }
      })
    })
  }

}

function copyToClipboard(text) {
  if (!text) return

  // 우선 modern clipboard API 시도
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
    .writeText(text)
    .then(() => copyStatus.value = true) // ✅ 1초 뒤에 나타남)
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

onMounted(() => {
  copy()
})
</script>
