requireLogin();

let currentData = null;

init();

function init() {
  currentData = JSON.parse(
    localStorage.getItem("selectedTransactionPeriod") || "null"
  );

  if (!currentData || !currentData.prd) {
    document.getElementById("periodInfo").innerHTML = "";
    document.getElementById("transactionList").innerHTML =
      `<div class="text-muted">No period selected</div>`;
    return;
  }

  renderPeriodInfo(currentData.prd);
  renderRefreshButton(currentData.prd);
  renderTransactionList(currentData.tjList || []);
}

function renderPeriodInfo(prd) {
  const status = prd.sts_cd || "";
  const dateRange = prd.end_dt
    ? `${formatDate(prd.st_dt)} - ${formatDate(prd.end_dt)}`
    : `${formatDate(prd.st_dt)} - Now`;

  document.getElementById("periodInfo").innerHTML = `
    <div class="border rounded-2 px-3 py-2 bg-light">
      <div class="d-flex align-items-center justify-content-between gap-2">
        <span class="fw-semibold text-dark">
          ${prd.id || ""}
        </span>

        <span class="badge ${getStatusClass(status)}">
          ${status}
        </span>
      </div>

      <div class="small text-muted mt-1">
        <i class="bi bi-calendar3"></i>
        ${dateRange}
      </div>
    </div>
  `;
}

function renderRefreshButton(prd) {
  const refreshBtn = document.getElementById("refreshBtn");

  if (prd.sts_cd === "OPEN") {
    refreshBtn.classList.remove("d-none");
  } else {
    refreshBtn.classList.add("d-none");
  }
}

function renderTransactionList(list) {
  const html = list.map(item => {
    const amount = Number(item.amt || 0).toLocaleString("vi-VN");
    const excText = item.exc ? ` · Except: ${item.exc}` : "";

    return `
      <div class="border rounded-2 px-3 py-2 mb-2 bg-white">
        <div class="d-flex align-items-start justify-content-between gap-2">
          <div class="fw-semibold text-truncate min-w-0">
            ${item.what || "No description"}
          </div>

          <div class="fw-semibold text-nowrap">
            ${amount} VND
          </div>
        </div>

        <div class="small text-muted text-truncate mt-1">
          ${item.payer || "-"} · ${formatDate(item.tj_dt)}${excText}
        </div>
      </div>
    `;
  }).join("");

  document.getElementById("transactionList").innerHTML =
    html || `<div class="text-muted">No transaction</div>`;
}

async function refreshOpenPeriodTransactions() {
  if (!currentData || !currentData.prd) return;
  if (currentData.prd.sts_cd !== "OPEN") return;

  showLoadingOverlay("Refreshing...", "App free quite slowly");

  try {
    const result = await apiPost({
      action: "getTjByPrdId",
      prd_id: currentData.prd.id
    });

    if (!result.success) {
      alert(result.message);
      return;
    }

    currentData = {
      ...currentData,
      tjList: result.data || []
    };

    const storageKey = getTransactionPeriodStorageKey(currentData.prd.id);

    localStorage.setItem(storageKey, JSON.stringify(currentData));
    localStorage.setItem("selectedTransactionPeriod", JSON.stringify(currentData));

    renderTransactionList(currentData.tjList);
  } catch (error) {
    console.error(error);
    alert("Cannot refresh transaction list.");
  } finally {
    hideLoadingOverlay();
  }
}

function getTransactionPeriodStorageKey(prdId) {
  return `transactionPeriod_${prdId}`;
}

function getStatusClass(status) {
  if (status === "OPEN") return "text-bg-success";
  if (status === "END") return "text-bg-secondary";
  if (status === "LOCK") return "text-bg-dark";
  return "text-bg-light";
}

function formatDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function goBackPeriod() {
  window.location.href = "./period.html";
}