# 🚬 CigTracker — Progressive Web App (Vue 3 + TailwindCSS)

This is a mobile-first Progressive Web App (PWA) built with **Vue 3**, **Vue Router**, **TailwindCSS**, and **vite-plugin-pwa**, designed to help you track cigarette consumption and reduce your intake over time.

## 📱 Features

### 🔢 Counter
- Track how many cigarettes you've smoked today
- Live timer since your last cigarette
- One-tap "➕" button to add a cigarette

### 📅 History
- Daily logs with:
  - Date, weekday
  - Nicotine amount (e.g., 9.6 mg)
  - Difference vs. previous day
- Stored in `localStorage`

### 📊 Stats
- Line chart of your cigarette use (Chart.js)
- Weekly averages:
  - Last week, previous week, first week
- Total cigarettes, packs, money spent
- Estimated total toxins (nicotine, tar, CO)
- Minimum/maximum consumption days

### ⚙️ Settings
- Customize nicotine amount per cigarette
- Stored in `localStorage`

### 🧾 Edit History
- Visualize and **edit** historical data:
  - Add/remove cigarettes for any day
  - Modify time of each cigarette
  - Swipe left to delete

---

## 💻 Technologies Used

- [Vue 3](https://vuejs.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Vue Router](https://router.vuejs.org/)
- [Chart.js](https://www.chartjs.org/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- LocalStorage (for offline persistence)

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
