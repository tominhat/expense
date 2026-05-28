function refreshGlobalState() {

  window.user =
    JSON.parse(localStorage.getItem("user") || "{}");

  window.activeUsers =
    JSON.parse(localStorage.getItem("activeUsers") || "[]");

  window.openPrdId =
    localStorage.getItem("openPrdId") || "";
}

async function apiPost(payload) {
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

async function refreshTjListStorage(prdId) {
  const openPrdId = prdId || localStorage.getItem("openPrdId") || "";

  if (!openPrdId) {
    localStorage.setItem("tjList", "[]");
    return [];
  }

  const result = await apiPost({
    action: "getTjByPrdId",
    prd_id: openPrdId
  });

  if (!result.success) {
    throw new Error(result.message || "Cannot load transaction list.");
  }

  const tjList = result.data || [];
  localStorage.setItem("tjList", JSON.stringify(tjList));

  return tjList;
}

function showSuccessToast() {
  const toastEl = document.getElementById("successToast");
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");

  toast.className = `position-fixed bottom-0 start-50 translate-middle-x mb-3 alert alert-${type}`;
  toast.style.zIndex = "9999";
  toast.innerText = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2500);
}

