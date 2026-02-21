const STORAGE_KEY = "fitlabFormData";

const i18n = {
  tr: {
    resultPlaceholder: "Sonuçları görmek için formu doldurup analiz başlatın.",
    bmr: "Bazal Metabolizma Hızı (BMR)",
    calorie: "Günlük Kalori İhtiyacı",
    macros: "Örnek Makro Dağılımı",
    mealPlan: "1 Günlük Örnek Beslenme Planı",
    workout: "30 Dakikalık Örnek Antrenman",
  },
};

const lang = "tr";
const form = document.getElementById("fitlab-form");
const resultCard = document.getElementById("result-card");
const yearEl = document.getElementById("year");

const smokingAlcoholAdjustment = {
  none: 1,
  occasional: 0.98,
  regular: 0.95,
};

yearEl.textContent = new Date().getFullYear();

function saveToLocalStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromLocalStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function fillForm(data) {
  Object.entries(data).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (field) field.value = value;
  });
}

function getFormData() {
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries());
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function calculateBMR({ gender, weight, height, age }) {
  if (gender === "male") {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

function createMealPlan(calorieNeed) {
  const target = Math.round(calorieNeed);
  return `
    Kahvaltı: Yulaf + yoğurt + meyve (≈ ${Math.round(target * 0.25)} kcal)<br>
    Öğle: Izgara tavuk, bulgur, salata (≈ ${Math.round(target * 0.35)} kcal)<br>
    Akşam: Somon veya baklagil, sebze, yoğurt (≈ ${Math.round(target * 0.3)} kcal)<br>
    Ara öğün: Kuruyemiş + kefir (≈ ${Math.round(target * 0.1)} kcal)
  `;
}

function createWorkout(activityLevel) {
  if (activityLevel >= 1.725) {
    return "5 dk ısınma + 20 dk HIIT (40 sn çalışma/20 sn dinlenme) + 5 dk soğuma ve esneme.";
  }
  if (activityLevel >= 1.55) {
    return "5 dk ısınma + 15 dk vücut ağırlığı devre antrenmanı + 10 dk tempolu yürüyüş.";
  }
  return "5 dk mobilite + 20 dk tempolu yürüyüş + 5 dk core egzersizleri.";
}

function renderResults({ bmr, calorieNeed, protein, carb, fat, mealPlan, workout }) {
  resultCard.innerHTML = `
    <ul class="result-list">
      <li class="result-item">
        <strong>${i18n[lang].bmr}</strong>
        ${Math.round(bmr)} kcal/gün
      </li>
      <li class="result-item">
        <strong>${i18n[lang].calorie}</strong>
        ${Math.round(calorieNeed)} kcal/gün
      </li>
      <li class="result-item">
        <strong>${i18n[lang].macros}</strong>
        Protein: ${protein} g • Karbonhidrat: ${carb} g • Yağ: ${fat} g
      </li>
      <li class="result-item">
        <strong>${i18n[lang].mealPlan}</strong>
        ${mealPlan}
      </li>
      <li class="result-item">
        <strong>${i18n[lang].workout}</strong>
        ${workout}
      </li>
    </ul>
  `;
}

function runAnalysis(data) {
  const age = toNumber(data.age);
  const weight = toNumber(data.weight);
  const height = toNumber(data.height);
  const targetWeight = toNumber(data.targetWeight);
  const activityLevel = toNumber(data.activityLevel);
  const smokingAdjustment = smokingAlcoholAdjustment[data.smokingAlcohol] || 1;

  const bmr = calculateBMR({ gender: data.gender, weight, height, age });
  let calorieNeed = bmr * activityLevel * smokingAdjustment;

  const weightDelta = targetWeight - weight;
  calorieNeed += weightDelta < 0 ? -300 : weightDelta > 0 ? 250 : 0;
  calorieNeed = Math.max(1200, calorieNeed);

  const protein = Math.round((calorieNeed * 0.3) / 4);
  const carb = Math.round((calorieNeed * 0.4) / 4);
  const fat = Math.round((calorieNeed * 0.3) / 9);

  renderResults({
    bmr,
    calorieNeed,
    protein,
    carb,
    fat,
    mealPlan: createMealPlan(calorieNeed),
    workout: createWorkout(activityLevel),
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = getFormData();
  saveToLocalStorage(data);
  runAnalysis(data);
});

const savedData = loadFromLocalStorage();
if (savedData) {
  fillForm(savedData);
  runAnalysis(savedData);
} else {
  resultCard.innerHTML = `<p class="result-placeholder">${i18n[lang].resultPlaceholder}</p>`;
}
