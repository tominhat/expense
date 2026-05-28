let currentUsername = "";
let pin = "";

document.addEventListener("DOMContentLoaded", () => {
  const savedUsername = localStorage.getItem("savedUsername") || "";

  if (savedUsername) {
    currentUsername = savedUsername;
    showPasswordScreen();
  }
});

function goPasswordScreen() {
  const username = document.getElementById("username").value.trim();

  if (!username) {
    alert("Please enter username.");
    return;
  }

  currentUsername = username;
  localStorage.setItem("savedUsername", currentUsername);

  showPasswordScreen();
}

// function showPasswordScreen() {
//   document.getElementById("usernameScreen").classList.add("d-none");
//   document.getElementById("passwordScreen").classList.remove("d-none");

//   document.getElementById("helloUsername").textContent = currentUsername;

//   pin = "";
//   renderPinDots();
// }

function changeUsername() {
  document.body.classList.remove("pin-active");

  currentUsername = "";
  pin = "";

  document.getElementById("username").value = "";
  document.getElementById("usernameScreen").classList.remove("d-none");
  document.getElementById("passwordScreen").classList.add("d-none");

  localStorage.removeItem("savedUsername");
}

function pressPin(number) {
  if (pin.length >= 4) return;

  pin += number;
  renderPinDots();
  renderLoginButton();
}

function deletePin() {
  pin = pin.slice(0, -1);
  renderPinDots();
  renderLoginButton();
}

function clearPin() {
  pin = "";
  renderPinDots();
  renderLoginButton();
}

function renderLoginButton() {
  const loginBtn = document.getElementById("loginBtn");
  if (!loginBtn) return;

  loginBtn.disabled = pin.length !== 4;
}

function renderPinDots() {
  const dots = document.querySelectorAll("#pinDots span");

  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index < pin.length);
  });
}

async function submitLogin() {
  if (pin.length !== 4) return;

  showLoadingOverlay("Logging in...", "App free quite slowly");

  try {
    const result = await login(currentUsername, pin);

    if (!result.success) {
      alert(result.message);
      clearPin();
      return;
    }

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("savedUsername", currentUsername);
    localStorage.setItem("user", JSON.stringify(result.user));
    localStorage.setItem("activeUsers", JSON.stringify(result.activeUsers));
    localStorage.setItem("openPrdId", result.openPrdId || "");

    refreshGlobalState();

    try {
      await refreshTjListStorage(result.openPrdId || "");
    } catch (error) {
      console.error(error);
      localStorage.setItem("tjList", "[]");
    }

    window.location.href = "../html/home.html";
  } catch (error) {
    console.error(error);
    alert("Login failed. Please try again.");
    clearPin();
  } finally {
    hideLoadingOverlay();
  }
}

function showPasswordScreen() {
  document.body.classList.add("pin-active");

  document.getElementById("usernameScreen").classList.add("d-none");
  document.getElementById("passwordScreen").classList.remove("d-none");

  document.getElementById("helloUsername").textContent = currentUsername;

  pin = "";
  renderPinDots();
  renderLoginButton();
}