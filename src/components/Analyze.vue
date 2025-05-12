<!--스타일태그를 만들어서 analyze.scss import-->
<style scoped lang="scss" src="@/assets/analyze.scss" />
<template>
  <section v-if="status === 'error'">
    <div class="section">
      <h2>❌ 분석 실패</h2>
      <p>본문을 불러오지 못했어요. 스마트에디터 창이 열려 있는지 확인해주세요.</p>
    </div>
  </section>
  <section v-else-if="status === 'success' && result" class="analyze-box">
    <div class="section">
      <h2>📏 길이: <strong>{{ result.length }}</strong>({{result.trimLen}})자&nbsp;/&nbsp;🖼️ 사진: <strong>{{ result.imgCnt
        }}</strong>개</h2>
    </div>

    <div class="section">
      <h2>🧠 형태소 분석 결과</h2>
      <div class="table-box">
        <table>
          <tbody>
          <tr v-for="[word, count] in result.words" :key="word">
            <td>{{ word }}</td>
            <td>{{ count }}</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="section">
      <h2>🚫 금칙어</h2>
      <div class="badword-box">
        <p v-if="result.badWords.length">
          {{ result.badWords.map(([word, count]) => `${word}(${count})`).join(', ') }}
        </p>
        <p v-else>✅ 훌륭합니다! 금칙어가 존재하지 않습니다 ^^</p>
      </div>
    </div>
  </section>
  <section v-else>
    <div class="section">
      <h2>⏳ 데이터 분석 중...</h2>
      <p>잠시만 기다려주세요.</p>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const status = ref('idle') // 'idle' | 'loading' | 'success' | 'error'
const result = ref(null)

const forbiddenWords = [
  // 성인/음란
  '보지', '자위', '야동', '성기', '섹스', '성인용', '에로', 'AV', '노모',

  // 의료/건강 오인
  '완치', '부작용 없음', '100% 치료', '즉시 효과', '지방흡입', '모공축소', '다이어트약',

  // 허위/과장 광고
  '100% 할인', '전액 환불', '무료 제공', '가짜 후기', '정품 인증', '최저가 보장',

  // 불법/위법
  '대마', '마약', '불법', '도박', '총판', '토토', '성범죄', '몰카'
]

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

function analyze() {
  status.value = 'loading'
  if (import.meta.env.MODE === 'development') {
    result.value = analyzeText(
      { text: `오늘은 정말 특별한 다이어트약을 소개하려고 해요!이 제품은 부작용 없음은 물론, 100% 치료 효과가 있다는 말이 있을 정도로 입소문이 난 제품이에요.실제로 저도 사용해보고 너무 만족했어요. 무료 제공 이벤트도 진행 중이라, 지금바로 신청하시는 걸 추천드립니다.다이어트약 다이어트약 다이어트약, 효과가 정말 좋았고요.부작용 없음 부작용 없음 부작용 없음! 이 말이 왜 나오는지 알겠더라고요.추천 추천 추천. 저도 추천하고, 친구도 추천했고, 강력 추천합니다.이 블로그를 통해서 더 많은 후기와 정보를 얻어가셨으면 좋겠어요!최저가 보장, 정품 인증 모두 완료된 제품이라 믿고 구매하셔도 됩니다 ^^` }
    )
    status.value = 'success'
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(tab.id, { type: 'GET_EDITOR_TEXT' }, (res) => {
        if (res?.text) {
          result.value = analyzeText(res)
          status.value = 'success'
        } else {
          status.value = 'error'
        }
      })
    })
  }
}

function analyzeText({ text: raw, imgCnt }) {
  const cleaned = raw
  .replace(/[^가-힣a-zA-Z0-9\s]/g, '') // 특수문자 제거
  .trim()

  const words = cleaned
  .split(/\s+/)
  .filter(w => w.length >= 2)

  const freqMap = {}
  words.forEach(word => {
    freqMap[word] = (freqMap[word] || 0) + 1
  })

  const sorted = Object.entries(freqMap).sort((a, b) => b[1] - a[1])

  const badMap = new Map()
  forbiddenWords.forEach(word => {
    const regex = new RegExp(word, 'g')
    const match = raw.match(regex)
    if (match) badMap.set(word, match.length)
  })
  const trimmed = raw.replace(/\s/g, '')
  return {
    words: sorted,
    badWords: [...badMap.entries()],
    length: raw.length,
    trimLen: trimmed.length,
    imgCnt: imgCnt || 0
  }
}

onMounted(() => {
  analyze()
})


</script>
