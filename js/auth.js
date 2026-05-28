async function login(username, password) {
  const res = await fetch(window.API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      action: "login",
      username,
      password
    })
  });

  return await res.json();
}

function logout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("user");
  window.location.href = "../html/login.html";
}

function requireLogin() {
  if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "../html/login.html";
  }
}