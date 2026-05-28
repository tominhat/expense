document.addEventListener("DOMContentLoaded", () => {

  const navbar = `
    <nav class="bottom-navbar">

      <button onclick="goHome()">
        <i class="bi bi-house-door-fill"></i>
        <span>Home</span>
      </button>

      <button onclick="goPaying()">
        <i class="bi bi-cash-stack"></i>
        <span>Pay</span>
      </button>

      <button onclick="goPeriod()">
        <i class="bi bi-calendar-range-fill"></i>
        <span>Period</span>
      </button>

    </nav>
  `;

  document.body.insertAdjacentHTML("beforeend", navbar);

});

function goHome() {
  window.location.href = "./home.html";
}

function goPaying() {
  window.location.href = "./paying.html";
}

function goPeriod() {
  window.location.href = "./period.html";
}