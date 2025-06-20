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
    import: "Import",
    appVersion: "App version",
    importSuccess: "Successefuly imported ✓",
    lastCigarette: "Last",
    cigarette: "Cigarette",
    addCigarette: "Add a cigarette",
    cost: "Cost",
    nicotinePerCig: "Nicotine per cigarette (mg)",
    pricePerCig: "Price per cigarette (€)",
    objectivePerDay: "Objective per day",
    shortIntervalThreashold: "Minimum duration threshold (in minutes)",
    mediumIntervalThreashold: "Medium duration threshold (in minutes)",
    longIntervalThreashold: "Any duration above this will be considered long",
    themeColor: "Theme color"
  },
  fr: {
    home: "Accueil",
    stats: "Statistiques",
    routine: "Routine",
    last7days: "7 derniers jours",
    settings: "Paramètres",
    history: "Historique",
    profile: "Paramètres du compte",
    save: "Enregistrer",
    saved: "Paramètres sauvegardés ✓",
    name: "Nom",
    language: "Langue",
    export: "Exporter",
    import: "Importer",
    appVersion: "Version de l'application",
    importSuccess: "Import réussi ✓",
    lastCigarette: "Dernière",
    cigarette: "Cigarette",
    addCigarette: "Ajouter une cigarette",
    cost: "Coût",
    nicotinePerCig: "Nicotine par cigarette (mg)",
    pricePerCig: "Prix par cigarette (€)",
    objectivePerDay: "Objectif par jour",
    shortIntervalThreashold: "Seuil de durée minimum (en minutes)",
    mediumIntervalThreashold: "Seuil de durée intermédiaire (en minutes)",
    longIntervalThreashold: "Toute durée au-delà de ce seuil sera considérée comme longue",
    themeColor: "Couleur du thème"
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
