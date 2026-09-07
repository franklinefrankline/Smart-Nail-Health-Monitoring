import pytest
from playwright.sync_api import Page, expect

# Assuming the frontend is served locally on port 5500 (e.g. using VS Code Live Server)
BASE_URL = "http://127.0.0.1:5500/frontend"

def test_homepage_loads(page: Page):
    page.goto(f"{BASE_URL}/index.html")
    expect(page).to_have_title("Smart Nail Health Monitoring System")
    expect(page.locator("h1")).to_contain_text("Understand Your Nail Health")

def test_navigation(page: Page):
    page.goto(f"{BASE_URL}/index.html")
    page.click("text=Login")
    expect(page).to_have_url(f"{BASE_URL}/login.html")
    
    page.click("text=Create Account")
    expect(page).to_have_url(f"{BASE_URL}/signup.html")

def test_responsive_mobile_menu(page: Page):
    page.set_viewport_size({"width": 375, "height": 812}) # Mobile viewport
    page.goto(f"{BASE_URL}/index.html")
    
    menu = page.locator(".nav-links")
    # Menu might be initially hidden on mobile (handled by CSS)
    
    # Click hamburger
    page.click(".hamburger")
    expect(menu).to_have_class(re.compile(r"active"))

def test_login_validation_errors(page: Page):
    page.goto(f"{BASE_URL}/login.html")
    page.click("button:has-text('Login')")
    # HTML5 validation should prevent submission, checking if form is still there
    expect(page.locator("#loginForm")).to_be_visible()
