document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");
  const strengthBar = document.getElementById("passwordStrengthBar");
  const submitBtn = document.getElementById("signupBtn");

  // Password strength logic
  password.addEventListener("input", (e) => {
    const val = e.target.value;
    let strength = 0;
    if (val.length >= 8) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[a-z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;

    strengthBar.className = "password-strength-bar";
    if (strength <= 1 && val.length > 0) strengthBar.classList.add("weak");
    else if (strength === 2 || strength === 3) strengthBar.classList.add("medium");
    else if (strength >= 4) strengthBar.classList.add("strong");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    if (password.value !== confirmPassword.value) {
      showToast("Passwords do not match", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    const payload = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      password: password.value
    };

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        showToast("Registration successful! Redirecting...", "success");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 1500);
      } else {
        showToast(result.detail || result.message || "Registration failed", "error");
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Create Account";
      }
    } catch (error) {
      showToast("Network error. Please try again.", "error");
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Create Account";
    }
  });
});
