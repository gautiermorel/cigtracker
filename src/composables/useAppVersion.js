import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";

export function useAppVersion (options = { checkInterval: 0 }) {
  const currentVersion = ref("unknown");
  const updateAvailable = ref(false);
  const route = useRoute();

  const checkVersion = async () => {
    try {
      const res = await fetch("/version.json", { cache: "no-store" });
      const { version: latestVersion } = await res.json();
      const storedVersion = localStorage.getItem("appVersion");

      currentVersion.value = latestVersion;

      if (storedVersion && storedVersion !== latestVersion) {
        updateAvailable.value = true;
      } else {
        localStorage.setItem("appVersion", latestVersion);
      }
    } catch (e) {
      console.error("Version check failed", e);
    }
  };

  const reloadApp = () => {
    localStorage.setItem("appVersion", currentVersion.value);
    window.location.reload(true);
  };

  onMounted(() => {
    checkVersion();
    if (options.checkInterval > 0) {
      setInterval(checkVersion, options.checkInterval);
    }
  });

  watch(() => route.fullPath, () => {
    checkVersion();
  });

  return {
    version: currentVersion,
    updateAvailable,
    reloadApp,
  };
}
