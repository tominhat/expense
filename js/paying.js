requireLogin();

const user = JSON.parse(localStorage.getItem("user") || "{}");
const activeUsers = JSON.parse(localStorage.getItem("activeUsers") || "[]");

const tjDtEl = document.getElementById("tjDt");
const payerEl = document.getElementById("payer");
const excEl = document.getElementById("exc");
const amtEl = document.getElementById("amt");
const suggestEl = document.getElementById("amountSuggest");
const pendingTjListEl = document.getElementById("pendingTjList");

let newTjList = JSON.parse(localStorage.getItem("newTjList") || "[]");
let selectedPendingTjIndex = null;


init();

function init() {
  tjDtEl.value = getToday();

  renderUserOptions();
  payerEl.value = user.username;

  renderPendingList();

  amtEl.addEventListener("input", renderAmountSuggest);

  // document
  //   .getElementById("payingForm")
  //   .addEventListener("submit", saveTjList);
  document.getElementById("what").addEventListener("blur", fillAmountFromWhat);

}

function renderUserOptions() {
  const options = activeUsers.map(id => `
    <option value="${id}">${id}</option>
  `).join("");

  payerEl.innerHTML = options;
  excEl.innerHTML = options;
}

function addTempTj() {
  const openPrdId = localStorage.getItem("openPrdId");

  if (!openPrdId) {
    alert("No open period. Please open a period before adding expenses.");
    return;
  }

  fillAmountFromWhat();

  const what = document.getElementById("what").value.trim();
  const amt = Number(amtEl.value);

  if (!what) {
    alert("Please enter What.");
    return;
  }

  if (!amt || amt <= 0) {
    alert("Please enter a valid Amount.");
    return;
  }

  const excValues = Array.from(excEl.selectedOptions)
    .map(option => option.value);

  const tj = {
    temp_id: Date.now(),
    prd_id: openPrdId,
    tj_dt: tjDtEl.value,
    payer: payerEl.value,
    what,
    amt,
    exc: excValues.join(",")
  };

  newTjList.push(tj);
  localStorage.setItem("newTjList", JSON.stringify(newTjList));

  selectedPendingTjIndex = null;
  renderPendingList();
  resetPayingForm();
}

async function saveTjList(e) {
  if (e) e.preventDefault();

  if (!newTjList || newTjList.length === 0) {
    alert("No data in Pending List to save.");
    return;
  }

  showLoadingOverlay("Saving...", "App free quite slowly");

  try {
    const res = await fetch(window.API_URL, {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "saveTjList",
        tjList: newTjList
      })
    });

    const result = await res.json();

    if (!result.success) {
      hideLoadingOverlay();
      alert(result.message);
      return;
    }

    newTjList = [];
    selectedPendingTjIndex = null;

    localStorage.removeItem("newTjList");

    await refreshTjListStorage();

    resetPayingForm();
    renderPendingList();

    hideLoadingOverlay();
    showSuccessToast();

    setTimeout(() => {
      window.location.href = "./home.html";
    }, 800);
  } catch (error) {
    hideLoadingOverlay();
    alert("Save failed. Please try again.");
    console.error(error);
  }
}
function renderPendingList() {
  if (!pendingTjListEl) return;

  if (newTjList.length === 0) {
    selectedPendingTjIndex = null;
    // pendingTjListEl.innerHTML =
    //   `<div class="text-muted small">No pending transaction</div>`;
    return;
  }

  pendingTjListEl.innerHTML = newTjList.map((item, index) => {
    const isSelected = selectedPendingTjIndex === index;

    return `
      <div
        class="border rounded-2 px-2 py-1 mb-2 d-flex align-items-center gap-2 ${
          isSelected ? "border-primary bg-primary-subtle" : "bg-white"
        }"
        role="button"
        onclick="fillPendingTj(${index})"
      >
        <div class="fw-semibold text-truncate flex-grow-1 min-w-0">
          ${item.what || "No description"}
        </div>

        <div class="small fw-semibold text-nowrap">
          ${Number(item.amt || 0).toLocaleString("vi-VN")} ₫
        </div>

        ${
          isSelected
            ? `
              <button
                type="button"
                class="btn btn-primary btn-sm flex-shrink-0"
                onclick="event.stopPropagation(); updateTempTj(${index})"
              >
                Save
              </button>
            `
            : `
              <button
                type="button"
                class="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center flex-shrink-0"
                style="width: 30px; height: 30px; padding: 0; font-size: 20px; line-height: 1;"
                aria-label="Remove transaction"
                onclick="event.stopPropagation(); removeTempTj(${index})"
              >
                ×
              </button>
            `
        }
      </div>
    `;
  }).join("");
}

function removeTempTj(index) {
  newTjList.splice(index, 1);
  localStorage.setItem("newTjList", JSON.stringify(newTjList));

  selectedPendingTjIndex = null;
  resetPayingForm();
  renderPendingList();
}

function fillPendingTj(index) {
  if (selectedPendingTjIndex === index) {
    selectedPendingTjIndex = null;
    resetPayingForm();
    renderPendingList();
    return;
  }

  const item = newTjList[index];
  if (!item) return;

  selectedPendingTjIndex = index;

  document.getElementById("what").value = item.what || "";
  tjDtEl.value = item.tj_dt || getToday();
  payerEl.value = item.payer || user.username;
  amtEl.value = item.amt || "";

  const excValues = item.exc ? item.exc.split(",") : [];

  Array.from(excEl.options).forEach(option => {
    option.selected = excValues.includes(option.value);
  });

  suggestEl.innerHTML = "";
  renderPendingList();
}

function updateTempTj(index) {
  const item = newTjList[index];
  if (!item) return;

  const what = document.getElementById("what").value.trim();
  const amt = Number(amtEl.value);

  if (!what) {
    alert("Please enter What.");
    return;
  }

  if (!amt || amt <= 0) {
    alert("Please enter a valid Amount.");
    return;
  }

  const excValues = Array.from(excEl.selectedOptions)
    .map(option => option.value);

  newTjList[index] = {
    ...item,
    tj_dt: tjDtEl.value,
    payer: payerEl.value,
    what,
    amt,
    exc: excValues.join(",")
  };

  localStorage.setItem("newTjList", JSON.stringify(newTjList));

  selectedPendingTjIndex = null;
  resetPayingForm();
  renderPendingList();
}
function clearPendingTjInputs() {
  document.getElementById("what").value = "";
  document.getElementById("payer").value = "";
  document.getElementById("amt").value = "";
  document.getElementById("tj_dt").value = "";
  document.getElementById("exc").value = "";
}

function renderAmountSuggest() {
  const raw = amtEl.value;

  if (!raw) {
    suggestEl.innerHTML = "";
    return;
  }

  const base = Number(raw);

  const suggestions = [
    base * 1000,
    base * 10000,
    base * 100000
  ];

  suggestEl.innerHTML = suggestions.map(value => `
    <button
      type="button"
      class="btn btn-sm btn-outline-primary"
      onclick="setAmount(${value})"
    >
      ${value.toLocaleString("vi-VN")} ₫
    </button>
  `).join("");
}

function setAmount(value) {
  amtEl.value = value;
  suggestEl.innerHTML = "";
}

function resetPayingForm() {
  document.getElementById("what").value = "";
  amtEl.value = "";
  suggestEl.innerHTML = "";

  Array.from(excEl.options).forEach(option => {
    option.selected = false;
  });

  tjDtEl.value = getToday();
  payerEl.value = user.username;
}

function goBackHome() {
  window.location.href = "./home.html";
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function fillAmountFromWhat() {
  const whatEl = document.getElementById("what");

  // Nếu user đã nhập Amount riêng rồi thì không tự ghi đè
  if (amtEl.value) return;

  const quickPay = parseQuickPayText(whatEl.value);

  if (!quickPay.what || !quickPay.amt) return;

  whatEl.value = quickPay.what;
  amtEl.value = quickPay.amt;
  suggestEl.innerHTML = "";
}

function parseQuickPayText(value) {
  const text = value.trim();
  const lastSpaceIndex = text.lastIndexOf(" ");

  if (lastSpaceIndex === -1) {
    return {
      what: text,
      amt: 0
    };
  }

  const what = text.slice(0, lastSpaceIndex).trim();
  const amountText = text.slice(lastSpaceIndex + 1).trim();

  return {
    what,
    amt: parseSmartAmount(amountText)
  };
}

function parseSmartAmount(value) {
  const text = value.trim().toLowerCase();

  if (!text) return 0;

  const hasK = text.endsWith("k");
  const hasM = text.endsWith("m");

  const rawNumber = text
    .replace("k", "")
    .replace("m", "")
    .replace(",", ".");

  const number = Number(rawNumber);

  if (!number || number <= 0) return 0;

  if (hasK) return Math.round(number * 1000);
  if (hasM) return Math.round(number * 1000000);

  // Quy ước: 45 -> 45,000 ; 4.5 -> 4,500
  return Math.round(number * 1000);
}
