function ensureLoadingOverlay() {
  let overlayEl = document.getElementById("loadingOverlay");

  if (overlayEl) return overlayEl;

  overlayEl = document.createElement("div");
  overlayEl.id = "loadingOverlay";
  overlayEl.className = "loading-overlay d-none";
  overlayEl.innerHTML = `
    <div class="spinner-border text-primary" role="status"></div>
    <div class="mt-3 fw-semibold" id="loadingTitle">Loading...</div>
    <div class="small text-muted" id="loadingNote">App free quite slowly</div>
  `;

  document.body.appendChild(overlayEl);
  return overlayEl;
}

function showLoadingOverlay(title = "Loading...", note = "App free quite slowly") {
  const overlayEl = ensureLoadingOverlay();

  document.getElementById("loadingTitle").textContent = title;
  document.getElementById("loadingNote").textContent = note;

  overlayEl.classList.remove("d-none");
}

function hideLoadingOverlay() {
  const overlayEl = document.getElementById("loadingOverlay");
  if (!overlayEl) return;

  overlayEl.classList.add("d-none");
}