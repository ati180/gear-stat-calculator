const inputs = {
  attack: document.getElementById("attack"),
  crit: document.getElementById("crit"),
  hit: document.getElementById("hit"),
  penetration: document.getElementById("penetration")
};

const outputs = {
  rawCritRate: document.getElementById("raw-crit-rate"),
  rawHeal: document.getElementById("raw-heal"),
  atkCritRate: document.getElementById("atk-crit-rate"),
  atkHeal: document.getElementById("atk-heal"),
  pureCritRate: document.getElementById("pure-crit-rate"),
  pureHeal: document.getElementById("pure-heal")
};

const calcBtn = document.getElementById("calc-btn");
const resetBtn = document.getElementById("reset-btn");
const errorMsg = document.getElementById("error-msg");

function toNumber(value) {
  if (value.trim() === "") {
    return NaN;
  }
  return Number(value);
}

function formatNum(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return value.toLocaleString("zh-Hant", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function validateInput(values) {
  const requiredKeys = ["A", "C", "H", "P"];
  for (const key of requiredKeys) {
    const value = values[key];
    if (!Number.isFinite(value)) {
      return "請先輸入完整的數字。";
    }
    if (value < 0) {
      return "屬性不能小於 0。";
    }
  }
  if (values.A + values.H + values.P <= 0) {
    return "A + H + P 必須大於 0，才能計算暴擊率。";
  }
  return "";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function calculate(values) {
  const baseHeal = values.A + values.H + values.P;
  const rawCritRatio = values.C / baseHeal;
  const rawCritRate = rawCritRatio * 100;
  const rawHeal = values.A + values.C + values.H + values.P;

  const atkBaseHeal = (values.A * 1.125) + values.H + values.P;
  const atkCritValue = values.C * 1.2625;
  const atkCritRatio = clamp(atkCritValue / atkBaseHeal, 0, 1);
  const atkCritRate = atkCritRatio * 100;
  const atkHeal = atkBaseHeal * (1 + atkCritRatio);

  const pureBaseHeal = (values.A * 1.2375) + values.H + values.P;
  const pureCritValue = values.C * 1.0675;
  const pureCritRatio = clamp(pureCritValue / pureBaseHeal, 0, 1);
  const pureCritRate = pureCritRatio * 100;
  const pureHeal = pureBaseHeal * (1 + pureCritRatio);

  return {
    rawCritRate,
    rawHeal,
    atkCritRate,
    atkHeal,
    pureCritRate,
    pureHeal
  };
}

function renderResult(result) {
  outputs.rawCritRate.textContent = `${formatNum(result.rawCritRate)}%`;
  outputs.rawHeal.textContent = formatNum(result.rawHeal, 2);
  outputs.atkCritRate.textContent = `${formatNum(result.atkCritRate)}%`;
  outputs.atkHeal.textContent = formatNum(result.atkHeal, 2);
  outputs.pureCritRate.textContent = `${formatNum(result.pureCritRate)}%`;
  outputs.pureHeal.textContent = formatNum(result.pureHeal, 2);
}

function clearResult() {
  outputs.rawCritRate.textContent = "-";
  outputs.rawHeal.textContent = "-";
  outputs.atkCritRate.textContent = "-";
  outputs.atkHeal.textContent = "-";
  outputs.pureCritRate.textContent = "-";
  outputs.pureHeal.textContent = "-";
}

function handleCalculate() {
  const values = {
    A: toNumber(inputs.attack.value),
    C: toNumber(inputs.crit.value),
    H: toNumber(inputs.hit.value),
    P: toNumber(inputs.penetration.value)
  };

  const error = validateInput(values);
  if (error) {
    errorMsg.textContent = error;
    clearResult();
    return;
  }

  errorMsg.textContent = "";
  const result = calculate(values);
  renderResult(result);
}

function handleReset() {
  Object.values(inputs).forEach((input) => {
    input.value = "";
  });
  errorMsg.textContent = "";
  clearResult();
  inputs.attack.focus();
}

calcBtn.addEventListener("click", handleCalculate);
resetBtn.addEventListener("click", handleReset);

Object.values(inputs).forEach((input) => {
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleCalculate();
    }
  });
});

// ===== 分頁切換 =====
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

function activateTab(btn) {
  tabButtons.forEach((b) => {
    const isActive = b === btn;
    b.classList.toggle("active", isActive);
    b.setAttribute("aria-selected", String(isActive));
  });
  tabPanels.forEach((panel) => {
    const isActive = panel.id === btn.getAttribute("aria-controls");
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });
}

tabButtons.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    activateTab(btn);
    const url = new URL(window.location);
    url.searchParams.set("tab", String(index + 1));
    history.replaceState(null, "", url);
  });
});

// 依網址 ?tab=1|2 決定預設分頁，無效或未帶則預設第 1 頁
const tabParam = new URLSearchParams(window.location.search).get("tab");
const initialIndex = tabParam === "2" ? 1 : 0;
activateTab(tabButtons[initialIndex]);

// ===== 職業傷害計算器 =====
// 天賦暴擊率 = 暴擊 / (攻擊權重 × 攻擊 + 穿透權重 × 穿透)
// 權重由遊戲實測值反推（5 組測試資料 × 6 天賦全數吻合）
const DMG_TALENTS = [
  { atkW: 1 / 1.0675,      penW: 1.2875 / 1.0675, critId: "dmg-mage-pen-crit",   dmgId: "dmg-mage-pen-dmg" },
  { atkW: 1 / 1.2625,      penW: 1.1125 / 1.2625, critId: "dmg-mage-crit-crit",  dmgId: "dmg-mage-crit-dmg" },
  { atkW: 1.2375 / 1.0675, penW: 1 / 1.0675,      critId: "dmg-rogue-atk-crit",  dmgId: "dmg-rogue-atk-dmg" },
  { atkW: 1.1125 / 1.2625, penW: 1 / 1.2625,      critId: "dmg-rogue-crit-crit", dmgId: "dmg-rogue-crit-dmg" },
  { atkW: 1.2375,          penW: 1.1125,          critId: "dmg-archer-atk-crit", dmgId: "dmg-archer-atk-dmg" },
  { atkW: 1.1125,          penW: 1.2995,          critId: "dmg-archer-pen-crit", dmgId: "dmg-archer-pen-dmg" }
];

const dmgInputs = {
  attack: document.getElementById("dmg-attack"),
  crit: document.getElementById("dmg-crit"),
  penetration: document.getElementById("dmg-penetration"),
  bonus: document.getElementById("dmg-bonus")
};

const dmgCalcBtn = document.getElementById("dmg-calc-btn");
const dmgResetBtn = document.getElementById("dmg-reset-btn");
const dmgErrorMsg = document.getElementById("dmg-error-msg");
const dmgBaseCritRate = document.getElementById("dmg-base-crit-rate");

function clearDmgResult() {
  dmgBaseCritRate.textContent = "-";
  DMG_TALENTS.forEach((t) => {
    document.getElementById(t.critId).textContent = "-";
    document.getElementById(t.dmgId).textContent = "-";
  });
}

function handleDmgCalculate() {
  const atk = toNumber(dmgInputs.attack.value);
  const crit = toNumber(dmgInputs.crit.value);
  const pen = toNumber(dmgInputs.penetration.value);
  const bonus = toNumber(dmgInputs.bonus.value);

  if (![atk, crit, pen, bonus].every(Number.isFinite)) {
    dmgErrorMsg.textContent = "請先輸入完整的數字。";
    clearDmgResult();
    return;
  }
  if (atk < 0 || crit < 0 || pen < 0 || bonus < 0) {
    dmgErrorMsg.textContent = "屬性不能小於 0。";
    clearDmgResult();
    return;
  }
  if (atk + pen <= 0) {
    dmgErrorMsg.textContent = "攻擊 + 穿透必須大於 0，才能計算暴擊率。";
    clearDmgResult();
    return;
  }

  dmgErrorMsg.textContent = "";
  const baseTotal = atk + pen;
  const bonusMul = 1 + bonus / 100;

  const baseCritRatio = clamp(crit / baseTotal, 0, 1);
  dmgBaseCritRate.textContent = `${formatNum(baseCritRatio * 100)}%`;

  DMG_TALENTS.forEach((t) => {
    const critRatio = clamp(crit / (t.atkW * atk + t.penW * pen), 0, 1);
    const damage = baseTotal * (1 + critRatio) * bonusMul;
    document.getElementById(t.critId).textContent = `${formatNum(critRatio * 100)}%`;
    document.getElementById(t.dmgId).textContent = formatNum(damage, 2);
  });
}

function handleDmgReset() {
  Object.values(dmgInputs).forEach((input) => {
    input.value = "";
  });
  dmgErrorMsg.textContent = "";
  clearDmgResult();
  dmgInputs.attack.focus();
}

dmgCalcBtn.addEventListener("click", handleDmgCalculate);
dmgResetBtn.addEventListener("click", handleDmgReset);

Object.values(dmgInputs).forEach((input) => {
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleDmgCalculate();
    }
  });
});
