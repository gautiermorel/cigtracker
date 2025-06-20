import { createI18n } from "vue-i18n";

const messages = {
  en: {
    home: "Home",
    stats: "Statistics",
    routine: "Routine",
    last7days: "Last 7 days",
    settings: "Settings",
    history: "History",
    profile: "Profile",
    save: "Save",
    saved: "Paramètres sauvegardés ✓",
    name: "Your name",
    language: "Language",
    export: "Export",
    import: "Import JSON",
    appVersion: "App version",
    importSuccess: "Successefuly imported ✓",
    lastCigarette: "Last",
    cigarette: "Cigarette",
    addCigarette: "Add a cigarette",
    cost: "Cost",
    nicotinePerCig: "Nicotine per cigarette (mg)",
    pricePerCig: "Price per cigarette (€)",
    objectivePerDay: "Objective per day",
    orangeThreashold: "Threashold red → orange (minutes)",
    blueThreashold: "Threashold orange → blue (minutes)",
  },
  fr: {
    home: "Accueil",
    stats: "Statistiques",
    routine: "Routine",
    last7days: "7 derniers jours",
    settings: "Paramètres",
    history: "Historique",
    profile: "Profil",
    save: "Enregistrer",
    saved: "Paramètres sauvegardés ✓",
    name: "Votre nom",
    language: "Langue",
    export: "Exporter",
    import: "Importer un fichier JSON",
    appVersion: "Version de l'application",
    importSuccess: "Import réussi ✓",
    lastCigarette: "Dernière",
    cigarette: "Cigarette",
    addCigarette: "Ajouter une cigarette",
    cost: "Coût",
    nicotinePerCig: "Nicotine par cigarette (mg)",
    pricePerCig: "Prix par cigarette (€)",
    objectivePerDay: "Objectif par jour",
    orangeThreashold: "Seuil rouge → orange (minutes)",
    blueThreashold: "Seuil orange → bleu (minutes)",
  },
};

const locale = localStorage.getItem("language") || "fr";

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: "fr",
  messages,
});

export default i18n;
