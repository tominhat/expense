requireLogin();
refreshGlobalState();

init();

function init() {
  const tjList = JSON.parse(localStorage.getItem("tjList") || "[]");

  if (!window.openPrdId) {
    document.getElementById("tjList").innerHTML =
      `<div class="text-muted">No open period</div>`;

    return;
  }

  renderTjList(tjList);
}

function renderTjList(list) {
  const html = list.map(item => {
    const amount = Number(item.amt || 0).toLocaleString("vi-VN");
    const excText = item.exc ? ` Except: ${item.exc}` : "";

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

         <div class="d-flex align-items-start justify-content-between gap-2">
          <div class="small text-muted text-truncate mt-1">
            ${item.payer || "-"}
          </div>

          <div class="small text-muted text-truncate mt-1">
           ${formatDate(item.tj_dt)}
          </div>
        </div>
         <div class="small text-muted text-truncate mt-1">
          ${excText}
        </div>
      </div>
    `;
  }).join("");

  document.getElementById("tjList").innerHTML =
    html || `<div class="text-muted">No data</div>`;
}

function formatDate(value) {

  if (!value) return "";

  return String(value).slice(0, 10);
}

function goPaying() {
  window.location.href = "./paying.html";
}

async function refreshHomeTjList() {
  showLoadingOverlay("Refreshing...", "App free quite slowly");

  try {
    await refreshTjListStorage();

    const tjList = JSON.parse(localStorage.getItem("tjList") || "[]");
    renderTjList(tjList);
  } catch (error) {
    console.error(error);
    alert("Cannot refresh transaction list.");
  } finally {
    hideLoadingOverlay();
  }
}
