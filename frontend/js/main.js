// Base API URL config - dynamic same-origin avoids CORS preflight OPTIONS requests
const API_BASE_URL = (typeof window !== "undefined" && window.location.origin && window.location.origin.startsWith("http")) 
    ? `${window.location.origin}/api` 
    : "http://127.0.0.1:8000/api";

// DOMContentLoaded wrapper
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initMobileNav();
  checkAuthStatus();
  initPasswordToggles();
});

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem("ui-style") || "fresh";
  const savedColorScheme = localStorage.getItem("color-scheme") || "light";
  const savedAnimations = localStorage.getItem("animations") || "enabled";

  document.documentElement.setAttribute("data-theme", savedTheme);
  document.documentElement.setAttribute("data-color-scheme", savedColorScheme);
  document.documentElement.setAttribute("data-animations", savedAnimations);
}

// Mobile Navigation
function initMobileNav() {
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("nav-active");
      
      // Change icon
      const icon = hamburger.querySelector("i");
      if (icon) {
        if (navLinks.classList.contains("nav-active")) {
          icon.classList.remove("fa-bars");
          icon.classList.add("fa-xmark");
        } else {
          icon.classList.remove("fa-xmark");
          icon.classList.add("fa-bars");
        }
      }
    });

    // Close on click link
    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("nav-active");
        const icon = hamburger.querySelector("i");
        if (icon) {
          icon.classList.remove("fa-xmark");
          icon.classList.add("fa-bars");
        }
      });
    });
  }
}

// Toast Notifications
function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let iconClass = "fa-info-circle";
  if (type === "success") iconClass = "fa-check-circle";
  if (type === "error") iconClass = "fa-exclamation-circle";

  toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${message}</span>`;
  
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3300);
}

// Auth State Management
function checkAuthStatus() {
  const token = localStorage.getItem("access_token");
  const authLinks = document.querySelectorAll(".auth-link");
  const guestLinks = document.querySelectorAll(".guest-link");

  if (token) {
    authLinks.forEach(el => el.classList.remove("hidden"));
    guestLinks.forEach(el => el.classList.add("hidden"));
  } else {
    authLinks.forEach(el => el.classList.add("hidden"));
    guestLinks.forEach(el => el.classList.remove("hidden"));
  }
}

window.logout = function() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_info");
  showToast("Logout successful", "success");
  
  setTimeout(() => {
    window.location.href = "login.html";
  }, 1000);
}

// Password toggle helper
function initPasswordToggles() {
  const toggles = document.querySelectorAll(".toggle-password");
  toggles.forEach(toggle => {
    toggle.addEventListener("click", (e) => {
      const input = e.target.parentElement.querySelector("input");
      if(input) {
        if(input.type === "password") {
          input.type = "text";
          e.target.classList.remove("fa-eye");
          e.target.classList.add("fa-eye-slash");
        } else {
          input.type = "password";
          e.target.classList.remove("fa-eye-slash");
          e.target.classList.add("fa-eye");
        }
      }
    });
  });
}
