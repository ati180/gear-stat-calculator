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
