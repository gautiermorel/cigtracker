<template>
  <div
    v-touch:swipe.left="onSwipeLeft"
    v-touch:swipe.right="onSwipeRight"
    v-touch-options="{ touchSensitivity: 10 }"
    class="min-h-screen bg-neutral-100 flex flex-col overflow-hidden"
  >
    <router-view v-slot="{ Component }">
      <transition :name="transitionName" mode="out-in">
        <div :key="route.fullPath" class="flex-grow">
          <component :is="Component" />
        </div>
      </transition>
    </router-view>

    <BottomNav />
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router';
import { ref, watch } from 'vue';
import BottomNav from './components/BottomNav.vue';

const router = useRouter();
const route = useRoute();

const routes = ['/', '/history', '/stats', '/settings'];
const transitionName = ref('');
let isSwipe = false;

const getIndex = () => routes.indexOf(route.path);

const onSwipeLeft = () => {
  const i = getIndex();
  if (i < routes.length - 1) {
    transitionName.value = 'slide-left';
    isSwipe = true;
    router.push(routes[i + 1]);
  }
};

const onSwipeRight = () => {
  const i = getIndex();
  if (i > 0) {
    transitionName.value = 'slide-right';
    isSwipe = true;
    router.push(routes[i - 1]);
  }
};

// Supprime transition si navigation non swipe
watch(
  () => route.fullPath,
  () => {
    if (!isSwipe) {
      transitionName.value = '';
    }
    isSwipe = false;
  }
);
</script>

<style scoped>
/* TRANSITIONS SLIDE UNIQUEMENT */
.slide-left-enter-active,
.slide-right-enter-active,
.slide-left-leave-active,
.slide-right-leave-active {
  transition: transform 0.25s ease-out;
  will-change: transform;
}

.slide-left-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

.slide-left-leave-to,
.slide-right-enter-from {
  transform: translateX(-100%);
}
</style>
