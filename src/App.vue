<template>
  <div class="popup-root">
    <header>
      <div class="header-left">
        <img src="/newicon.png" class="icon" alt="icon" />
        <div>
          <h1>몽키<p class="header-highlight">N</p>블</h1>
        </div>
      </div>
      <div class="button-group">
        <button v-for="m in MENUS" :key="m.id" @click="goComponent(m)"
                :class="[`${m.icon}-btn`, {'btn-active': currentComponentId === m.id}]">
          {{ m.name }}
        </button>
      </div>
    </header>

    <component :is="currentComponent" />
  </div>
</template>

<script setup>
// 각 컴퍼낸트 등록
import { onMounted, shallowRef } from 'vue'

const currentComponentId = shallowRef(null)
const currentComponent = shallowRef(null)

const MENUS = [
  { id: 1, name: '복사', icon: 'copy', component: () => import('@/components/Copy.vue') },
  { id: 2, name: '태그', icon: 'tag', component: () => import('@/components/Tag.vue') },
  { id: 3, name: '분석', icon: 'analyze', component: () => import('@/components/Analyze.vue') }
]

async function goComponent(menu) {
  const loader = menu.component
  const module = await loader()             // 🔥 await로 로드
  currentComponent.value = module.default   // 🔥 default 추출해서 넣어야 Vue가 이해함
  currentComponentId.value = menu.id
}

onMounted(() => {
  goComponent(MENUS[2])
})
</script>
