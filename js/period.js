requireLogin();

const user = JSON.parse(localStorage.getItem("user") || "{}");

let selectedPeriod = null;
let periodActionModal = null;

document.addEventListener("DOMContentLoaded", () => {
  periodActionModal = new bootstrap.Modal(
    document.getElementById("periodActionModal")
  );
});

document.getElementById("stDt").value = getToday();

document
  .getElementById("openPeriodForm")
  .addEventListener("submit", openPeriod);

loadPeriods();

async function loadPeriods() {
  let periodList = JSON.parse(localStorage.getItem("periodList") || "[]");

  const hasOldCache = periodList.some(item => !Array.isArray(item.cal_prd_list));

  if (periodList.length === 0 || hasOldCache) {
    showLoadingOverlay("Loading periods...", "App free quite slowly");

    try {
      periodList = await refreshPeriodListStorage();
    } catch (error) {
      console.error(error);
      alert("Cannot load period list.");
      return;
    } finally {
      hideLoadingOverlay();
    }
  }

  renderPeriodList(periodList);
}

function renderPeriodList(periodList) {
  const html = periodList.map(item => `
    <div
      class="period-item ${getStatusBgClass(item.sts_cd)}"
      onclick='openPeriodAction(${JSON.stringify(item)})'
    >
      <div class="period-row-1">
        <div>
          <b>${item.id || ""}</b>
        </div>

        <span class="status-badge ${getStatusClass(item.sts_cd)}">
          ${item.sts_cd}
        </span>
      </div>

      <div class="period-row-2">
        <span>
          ${formatDate(item.st_dt)}
          ${item.sts_cd !== "OPEN" ? " - " + formatDate(item.end_dt) : ""}
        </span>
      </div>

      <div class="period-row-3">
        <span>${item.note || "No note"}</span>
      </div>
    </div>
  `).join("");

  document.getElementById("periodList").innerHTML =
    html || `<div class="text-muted">No period</div>`;
}

async function openPeriod(e) {
  e.preventDefault();

  showLoadingOverlay("Opening period...", "App free quite slowly");

  try {
    const result = await callApi({
      action: "openPeriod",
      st_dt: document.getElementById("stDt").value,
      note: document.getElementById("note").value.trim(),
      cre_usr_id: user.username
    });

    if (!result.success) {
      showToast(result.message || "Cannot open period.", "danger");
      return;
    }

    localStorage.setItem("openPrdId", result.openPrdId);
    localStorage.setItem("tjList", "[]");

    const periodList = await refreshPeriodListStorage();
    renderPeriodList(periodList);

    const modalEl = document.getElementById("openPeriodModal");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    document.getElementById("note").value = "";

    showToast(result.message || "Open period successfully", "success");
  } catch (error) {
    console.error(error);
    showToast("Cannot open period.", "danger");
  } finally {
    hideLoadingOverlay();
  }
}

async function callApi(payload) {
  const res = await fetch(window.API_URL, {
    method: "POST",
    redirect: "follow",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  return await res.json();
}

function getStatusClass(status) {
  if (status === "OPEN") return "status-open";
  if (status === "END") return "status-end";
  if (status === "LOCK") return "status-lock";
  return "";
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function getStatusBgClass(status) {
  if (status === "OPEN") return "status-bg-open";
  if (status === "END") return "status-bg-end";
  if (status === "LOCK") return "status-bg-lock";
  return "";
}

function openPeriodAction(item) {
  selectedPeriod = item;

  document.getElementById("periodActionTitle").innerText =
    `Period ${item.id}`;

  renderCalPrdList(item);

  periodActionModal.show();
}

function getTransactionPeriodStorageKey(prdId) {
  return `transactionPeriod_${prdId}`;
}

async function goTransactionList() {
  if (!selectedPeriod) return;

  const storageKey = getTransactionPeriodStorageKey(selectedPeriod.id);
  const cached = localStorage.getItem(storageKey);
  const isOpen = selectedPeriod.sts_cd === "OPEN";

  if (cached && !isOpen) {
    localStorage.setItem("selectedTransactionPeriod", cached);
    window.location.href = "./transaction-list.html";
    return;
  }

  showLoadingOverlay("Loading...", "App free quite slowly");

  try {
    const result = await apiPost({
      action: "getTjByPrdId",
      prd_id: selectedPeriod.id
    });

    if (!result.success) {
      alert(result.message);
      return;
    }

    const payload = {
      prd: {
        id: selectedPeriod.id,
        sts_cd: selectedPeriod.sts_cd,
        st_dt: selectedPeriod.st_dt,
        end_dt: selectedPeriod.end_dt
      },
      tjList: result.data || []
    };

    localStorage.setItem(storageKey, JSON.stringify(payload));
    localStorage.setItem("selectedTransactionPeriod", JSON.stringify(payload));

    window.location.href = "./transaction-list.html";
  } catch (error) {
    console.error(error);
    alert("Cannot load transaction list.");
  } finally {
    hideLoadingOverlay();
  }
}

async function confirmEndPeriod() {
  if (!selectedPeriod) return;

  if (selectedPeriod.sts_cd !== "OPEN") {
    showToast("Chỉ có thể kết thúc kỳ đang OPEN.", "warning");
    return;
  }

  const ok = confirm(`Bạn có chắc muốn END kỳ ${selectedPeriod.id}?`);
  if (!ok) return;

  showLoadingOverlay("Ending period...", "App free quite slowly");

  try {
    const result = await callApi({
      action: "endPeriod",
      prd_id: selectedPeriod.id
    });

    if (!result.success) {
      showToast(result.message || "Cannot end period.", "danger");
      return;
    }

    const calPrdList = result.data || [];

    selectedPeriod = {
      ...selectedPeriod,
      sts_cd: "END",
      end_dt: new Date().toISOString(),
      cal_prd_list: calPrdList
    };

    const periodList = JSON.parse(localStorage.getItem("periodList") || "[]");

    const nextPeriodList = periodList.map(period =>
      String(period.id) === String(selectedPeriod.id)
        ? selectedPeriod
        : period
    );

    localStorage.setItem("periodList", JSON.stringify(nextPeriodList));
    localStorage.removeItem("openPrdId");

    renderPeriodList(nextPeriodList);
    renderCalPrdList(selectedPeriod);

    showToast(result.message || "Đã kết thúc kỳ.", "success");
  } catch (error) {
    console.error(error);
    showToast("Cannot end period.", "danger");
  } finally {
    hideLoadingOverlay();
  }
}
async function refreshPeriodListStorage() {
  const result = await apiPost({
    action: "getPeriods"
  });

  if (!result.success) {
    throw new Error(result.message || "Cannot load period list.");
  }

  const periodList = result.data || [];
  localStorage.setItem("periodList", JSON.stringify(periodList));

  return periodList;
}

async function refreshPeriodList() {
  showLoadingOverlay("Refreshing...", "App free quite slowly");

  try {
    const periodList = await refreshPeriodListStorage();
    renderPeriodList(periodList);
  } catch (error) {
    console.error(error);
    alert("Cannot refresh period list.");
  } finally {
    hideLoadingOverlay();
  }
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function renderCalPrdList(period) {
  const calPrdList = Array.isArray(period.cal_prd_list)
    ? period.cal_prd_list
    : [];

const html = calPrdList.map(item => {
  const status = String(item.sts_cd || "").toUpperCase();
  const showStatus = status === "PAY" || status === "CLAIM";
  const isNotDone = status !== "DONE";

  const currentUserId = user.username || user.user_id || user.id || "";
  const itemUserId = item.usr_id || item.user_id || "";
  const isCurrentUser = String(itemUserId) === String(currentUserId);

  const periodStatus = String(period.sts_cd || "").toUpperCase();

  const canConfirm =
    periodStatus !== "OPEN" &&
    isCurrentUser &&
    (status === "PAY" || status === "CLAIM");

  return `
    <div class="cal-prd-item ${isNotDone ? "cal-prd-warning" : ""} ${isCurrentUser ? "cal-prd-current-user" : ""}">
      <div class="cal-prd-header">
        <div class="cal-prd-user">${item.usr_id || "-"}</div>

        <div class="cal-prd-result">
          ${showStatus ? status + ": " : ""}
          ${formatMoney(Math.abs(Number(item.result || 0)))}
        </div>
      </div>

      <div class="cal-prd-values">
        <span>Pay: ${formatMoney(item.pay)}</span>
        -
        <span>Claim: ${formatMoney(item.claim)}</span>
      </div>

      ${canConfirm ? `
        <button
          type="button"
          class="btn btn-sm btn-success cal-prd-confirm-btn"
          onclick='confirmCalPrd(${JSON.stringify(item)})'
        >
          Confirm ${status}
        </button>
      ` : ""}
    </div>
  `;
}).join("");

  document.getElementById("calPrdList").innerHTML =
    html || `<div class="text-muted small">No cal_prd data</div>`;
}

async function confirmCalPrd(item) {
  const status = String(item.sts_cd || "").toUpperCase();

  if (status !== "PAY" && status !== "CLAIM") return;

  const ok = confirm(`Confirm ${status} for ${item.usr_id}?`);
  if (!ok) return;

  showLoadingOverlay("Confirming...", "App free quite slowly");

  try {
    const result = await apiPost({
      action: "doneCalPrd",
      prd_id: item.prd_id,
      usr_id: item.usr_id
    });

    if (!result.success) {
      showToast(result.message || `Cannot confirm ${status}.`, "danger");
      return;
    }

    localStorage.removeItem("periodList");

    const periodList = await refreshPeriodListStorage();
    renderPeriodList(periodList);

    selectedPeriod = periodList.find(period =>
      String(period.id) === String(item.prd_id)
    );

    if (selectedPeriod) {
      renderCalPrdList(selectedPeriod);
    }

    showToast(result.message || "Done successfully", "success");
  } catch (error) {
    console.error(error);
    showToast(`Cannot confirm ${status}.`, "danger");
  } finally {
    hideLoadingOverlay();
  }
}
