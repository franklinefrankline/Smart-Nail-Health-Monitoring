document.addEventListener("DOMContentLoaded", () => {
    // Check auth
    if (!localStorage.getItem("access_token")) {
        window.location.href = "login.html";
        return;
    }

    setupOptionGroup("uiStyleSettings", "ui-style", "fresh", (val) => {
        document.documentElement.setAttribute("data-theme", val);
    });

    setupOptionGroup("themeSettings", "color-scheme", "light", (val) => {
        document.documentElement.setAttribute("data-color-scheme", val);
    });

    setupOptionGroup("animSettings", "animations", "enabled", (val) => {
        document.documentElement.setAttribute("data-animations", val);
    });
});

function setupOptionGroup(groupId, storageKey, defaultValue, onApply) {
    const container = document.getElementById(groupId);
    if(!container) return;

    const options = container.querySelectorAll(".option-card");
    const currentValue = localStorage.getItem(storageKey) || defaultValue;

    options.forEach(opt => {
        if(opt.dataset.value === currentValue) {
            opt.classList.add("selected");
        }
        
        opt.addEventListener("click", () => {
            options.forEach(o => o.classList.remove("selected"));
            opt.classList.add("selected");
            
            const newValue = opt.dataset.value;
            localStorage.setItem(storageKey, newValue);
            onApply(newValue);
            
            showToast("Settings updated successfully", "success");
        });
    });
}
