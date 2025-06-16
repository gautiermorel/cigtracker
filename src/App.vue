<template>
  <div
    class="relative min-h-screen overflow-hidden bg-neutral-100 flex flex-col"
  >
    <div
      class="relative flex-1 overflow-hidden"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <div
        v-if="nextComponent"
        class="absolute inset-0 w-full h-full z-0 pointer-events-none"
        :style="nextStyle"
      >
        <component :is="nextComponent" />
      </div>

      <div
        ref="currentView"
        class="relative z-10 w-full h-full"
        :style="currentStyle"
      >
        <component :is="currentComponent" :key="route.fullPath" />
      </div>
    </div>

    <BottomNav class="z-20" />
  </div>
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";
import { shallowRef, ref, computed, watch, onMounted } from "vue";
import BottomNav from "./components/BottomNav.vue";

const route = useRoute();
const router = useRouter();

const routes = ["/", "/history", "/stats", "/settings"];
const getIndex = () => routes.indexOf(route.path);

const currentComponent = shallowRef(null);
const nextComponent = shallowRef(null);

const currentView = ref(null);
const startX = ref(0);
const deltaX = ref(0);
const isSwiping = ref(false);
const direction = ref(null);
const animating = ref(false);

const loadComponent = async (routeToResolve, targetRef) => {
  const matched = routeToResolve.matched.at(-1);
  if (!matched) return;

  const raw = matched.components?.default;
  const resolved = typeof raw === "function" ? await raw() : raw;
  targetRef.value = resolved.default || resolved;
};

onMounted(async () => {
  await router.isReady();
  await loadComponent(route, currentComponent);
});

watch(
  () => route.fullPath,
  async () => {
    await loadComponent(route, currentComponent);
  }
);

const currentStyle = computed(() =>
  isSwiping.value || animating.value
    ? `transform: translateX(${deltaX.value}px); transition: none;`
    : ""
);

const nextStyle = computed(() => {
  if (!isSwiping.value && !animating.value) return "";

  const ratio = Math.min(Math.abs(deltaX.value) / window.innerWidth, 1);

  const scale = 0.95 + 0.05 * ratio;
  const opacity = 0.5 + 0.5 * ratio;
  const translate =
    deltaX.value < 0
      ? window.innerWidth * (1 - ratio) * 0.5
      : -window.innerWidth * (1 - ratio) * 0.5;

  return `
  transform: translateX(${translate}px) scale(${scale});
  opacity: ${opacity};
  transition: none;
`;
});

const onTouchStart = (e) => {
  if (animating.value) return;
  startX.value = e.touches[0].clientX;
  isSwiping.value = true;
};

const onTouchMove = async (e) => {
  if (!isSwiping.value || animating.value) return;

  deltaX.value = e.touches[0].clientX - startX.value;

  if (!direction.value && Math.abs(deltaX.value) > 10) {
    direction.value = deltaX.value < 0 ? "left" : "right";

    const i = getIndex();
    const targetIndex = direction.value === "left" ? i + 1 : i - 1;

    if (targetIndex >= 0 && targetIndex < routes.length) {
      const targetRoute = router.resolve(routes[targetIndex]);
      await loadComponent(targetRoute, nextComponent);
    } else {
      isSwiping.value = false;
    }
  }
};

const animateBack = () => {
  animating.value = true;
  const el = currentView.value;
  el.style.transition = "transform 0.3s ease-out";
  el.style.transform = "translateX(0)";

  setTimeout(() => {
    animating.value = false;
    isSwiping.value = false;
    nextComponent.value = null;
    direction.value = null;
    deltaX.value = 0;
    el.style.transition = "";
  }, 300);
};

const animateForward = (targetPath) => {
  animating.value = true;
  const finalX =
    direction.value === "left" ? -window.innerWidth : window.innerWidth;
  const el = currentView.value;
  el.style.transition = "transform 0.3s ease-out";
  el.style.transform = `translateX(${finalX}px)`;

  setTimeout(() => {
    animating.value = false;
    isSwiping.value = false;
    deltaX.value = 0;
    direction.value = null;
    nextComponent.value = null;
    el.style.transition = "";
    router.push(targetPath);
  }, 300);
};

const onTouchEnd = () => {
  if (!isSwiping.value || animating.value) return;

  const threshold = window.innerWidth * 0.3;
  const i = getIndex();
  const targetIndex = direction.value === "left" ? i + 1 : i - 1;

  if (
    Math.abs(deltaX.value) > threshold &&
    targetIndex >= 0 &&
    targetIndex < routes.length
  ) {
    animateForward(routes[targetIndex]);
  } else {
    animateBack();
  }
};
</script>

<style scoped>
* {
  user-select: none;
  -webkit-user-drag: none;
  touch-action: pan-y;
}
</style>
