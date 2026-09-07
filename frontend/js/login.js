document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const submitBtn = document.getElementById("loginBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';

    const payload = {
      email: document.getElementById("email").value,
      password: document.getElementById("password").value
    };

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        localStorage.setItem("access_token", result.data.access_token);
        localStorage.setItem("user_info", JSON.stringify(result.data.user));
        
        showToast("Login successful!", "success");
        setTimeout(() => {
          if (result.data.user && result.data.user.role === "admin") {
            window.location.href = "admin.html";
          } else {
            window.location.href = "dashboard.html";
          }
        }, 150);
      } else {
        showToast(result.detail || result.message || "Invalid email or password", "error");
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Login";
      }
    } catch (error) {
      showToast("Network error. Please try again.", "error");
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Login";
    }
  });
});
