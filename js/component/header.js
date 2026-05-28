document.addEventListener("DOMContentLoaded", () => {

  const user =
    JSON.parse(localStorage.getItem("user") || "{}");

    const openPrdId =
    JSON.parse(localStorage.getItem("openPrdId") || "{}");

  const header = `
    <header class="app-header shadow-sm">

      <div class="header-user">
        Hello,
        <b>${user.username || ""}</b>
      </div>

    <div class="header-user">
        Open Period:
        <b>${openPrdId || ""}</b>
      </div>

      <button
        class="btn btn-outline-danger btn-sm"
        onclick="confirmLogout()"
      >
        Logout
      </button>

    

    </header>
  `;

  document.body.insertAdjacentHTML(
    "afterbegin",
    header
  );

});

function confirmLogout() {

  const ok =
    confirm("Are you sure you want to logout?");

  if (!ok) return;

  const savedUsername = localStorage.getItem("savedUsername");

  localStorage.clear();

  if (savedUsername) {
    localStorage.setItem("savedUsername", savedUsername);
  }

  window.location.href =
    "../html/login.html";
}