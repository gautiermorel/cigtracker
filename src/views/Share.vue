<template>
  <div class="min-h-screen bg-neutral-100">
    <!-- Header style -->
    <header
      class="fixed top-0 left-0 w-full flex items-center justify-between px-6 py-6 bg-neutral-100/80"
    >
      <div></div>
      <div
        :style="{ backgroundColor: themeColor }"
        class="w-12 h-12 rounded-full text-white flex items-center justify-center font-bold text-sm"
      >
        {{ initials }}
      </div>
    </header>

    <!-- Contenu principal -->
    <div class="flex items-center justify-center px-4 pt-28 pb-10">
      <div
        class="w-full max-w-sm bg-white rounded-xl border border-neutral-200 p-6 text-center"
      >
        <!-- Phrase d’intro -->
        <p class="text-sm text-neutral-500 mb-4">
          {{ firstName }} {{ $t('sharingIntro') }}
        </p>

        <!-- Compteur principal -->
        <h1 class="text-3xl font-semibold text-neutral-900 mb-1 lowercase">
          {{ count }} {{ $t("cigarette") }}<span v-if="count > 1">s</span>
        </h1>

        <!-- Temps depuis la dernière cigarette -->
        <p class="text-sm text-neutral-500">
          {{ $t("lastCigarette") }} :
          <span v-if="last !== null">{{ last }} min</span>
          <span v-else>—</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const route = useRoute();

const name = ref("Inconnu");
const count = ref(0);
const last = ref(null);
const themeColor = localStorage.getItem("themeColor") || "#ef4444";

onMounted(() => {
  name.value = route.query.name || "Inconnu";
  count.value = parseInt(route.query.count) || 0;
  last.value = parseInt(route.query.last) || null;
});

const initials = computed(() =>
  name.value
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
);

const firstName = computed(() => {
  return name.value.split(" ")[0];
});
</script>
