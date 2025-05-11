<template>
  <div class="popup-root">
    <header>
      <div class="header-left">
        <img src="/newicon.png" class="icon" alt="icon" />
        <div>
          <h1>중복 단어 & 금칙어 분석기</h1>
        </div>
      </div>
      <button @click="analyze" class="analyze-btn">분석 시작</button>
    </header>

    <section v-if="result" class="result-box">
      <div class="section">
        <h2>📏 콘텐츠 길이: <strong>{{ result.length }}</strong>자</h2>
        <p></p>
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
  </div>
</template>

<script setup>
import { ref } from 'vue'
const forbiddenWords = [
  // 성인/음란
  "보지", "자위", "야동", "성기", "섹스", "성인용", "에로", "AV", "노모",

  // 의료/건강 오인
  "완치", "부작용 없음", "100% 치료", "즉시 효과", "지방흡입", "모공축소", "다이어트약",

  // 허위/과장 광고
  "100% 할인", "전액 환불", "무료 제공", "가짜 후기", "정품 인증", "최저가 보장",

  // 불법/위법
  "대마", "마약", "불법", "도박", "총판", "토토", "성범죄", "몰카"
];
const result = ref(null)

function analyze() {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, { type: 'GET_EDITOR_TEXT' }, (res) => {
      if (res?.text) {
        result.value = analyzeText(res.text);
      }
    });
  });
//  console.log('gg')
//  result.value = analyzeText(
//    `오늘은 정말 특별한 다이어트약을 소개하려고 해요!
//이 제품은 부작용 없음은 물론, 100% 치료 효과가 있다는 말이 있을 정도로 입소문이 난 제품이에요.
//실제로 저도 사용해보고 너무 만족했어요. 무료 제공 이벤트도 진행 중이라, 지금바로 신청하시는 걸 추천드립니다.
//
//다이어트약 다이어트약 다이어트약, 효과가 정말 좋았고요.
//부작용 없음 부작용 없음 부작용 없음! 이 말이 왜 나오는지 알겠더라고요.
//추천 추천 추천. 저도 추천하고, 친구도 추천했고, 강력 추천합니다.
//
//이 블로그를 통해서 더 많은 후기와 정보를 얻어가셨으면 좋겠어요!
//최저가 보장, 정품 인증 모두 완료된 제품이라 믿고 구매하셔도 됩니다 ^^`
//  );
}

function analyzeText(raw) {
  const cleaned = raw
  .replace(/[^가-힣a-zA-Z0-9\s]/g, '') // 특수문자 제거
  .trim();

  const words = cleaned
  .split(/\s+/)
  .filter(w => w.length >= 2);

  const freqMap = {};
  words.forEach(word => {
    freqMap[word] = (freqMap[word] || 0) + 1;
  });

  const sorted = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);

  const badMap = new Map();
  forbiddenWords.forEach(word => {
    const regex = new RegExp(word, 'g');
    const match = raw.match(regex);
    if (match) badMap.set(word, match.length);
  });

  return {
    words: sorted,
    badWords: [...badMap.entries()],
    length: raw.length
  };
}
</script>

<style lang="scss" scoped>
$yellow: #ffcb05;
$brown: #333;
$lightbox: #fffefc;
$box-border: #ddd;

.popup-root {
  width: 360px;
  height: 480px;
  overflow: hidden;
  padding: 16px;
  box-sizing: border-box;
  font-family: 'Segoe UI', sans-serif;
  background: #fffbe6;

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 6px;

      .icon {
        width: 48px;
        height: 48px;
      }

      h1 {
        font-size: 16px;
        font-weight: 600;
        color: #4e2c16;
        margin: 0;
      }

      .subtitle {
        font-size: 12px;
        color: #555;
        margin: 0;
      }
    }

    .analyze-btn {
      background-color: $yellow;
      border: none;
      padding: 8px 12px;
      font-weight: bold;
      cursor: pointer;
      border-radius: 6px;
    }
  }

  .result-box {
    font-size: 14px;

    .section {
      margin-bottom: 12px;

      h2 {
        font-weight: bold;
        margin-bottom: 6px;
        color: $brown;
      }
    }

    .table-box {
      background: $lightbox;
      border: 1px solid $box-border;
      border-radius: 6px;
      padding: 4px;
      //max-height: 160px;
      height: 254px;
      overflow-y: auto;

      table {
        width: 100%;
        border-collapse: collapse;

        td {
          border-bottom: 1px solid #ddd;
          padding: 4px 8px;
          text-align: left;
        }
      }
    }

    .badword-box {
      height: 39px;
      overflow: auto;
      background: $lightbox;
      border: 1px solid $box-border;
      border-radius: 6px;
      padding: 8px;
    }
  }
}
</style>
