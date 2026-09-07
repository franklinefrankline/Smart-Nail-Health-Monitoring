document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');

    if (!reportId) {
        showToast("No report ID provided", "error");
        setTimeout(() => window.location.href = "dashboard.html", 1500);
        return;
    }

    loadReport(reportId, token);

    document.getElementById("downloadPdfBtn").addEventListener("click", () => {
        downloadPDF(reportId, token);
    });
});

async function loadReport(reportId, token) {
    try {
        const response = await fetch(`${API_BASE_URL}/analysis/${reportId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            populateData(result.data);
            document.getElementById("loadingState").style.display = "none";
            document.getElementById("resultContent").style.display = "block";
        } else {
            showToast(result.detail || "Report not found", "error");
            setTimeout(() => window.location.href = "dashboard.html", 1500);
        }
    } catch (error) {
        showToast("Network error", "error");
    }
}

function populateData(data) {
    document.getElementById("reportDate").innerText = `Analyzed on ${new Date(data.created_at).toLocaleString()}`;
    
    document.getElementById("healthScore").innerText = data.health_score;
    const riskBadge = document.getElementById("riskBadge");
    riskBadge.innerText = data.risk_level;
    
    const circle = document.getElementById("scoreCircle");
    
    if (data.risk_level.toLowerCase().includes("low")) {
        riskBadge.className = "risk-badge risk-low";
        circle.style.borderColor = "var(--success)";
        circle.style.color = "var(--success)";
    } else if (data.risk_level.toLowerCase().includes("moderate")) {
        riskBadge.className = "risk-badge risk-moderate";
        circle.style.borderColor = "var(--warning)";
        circle.style.color = "var(--warning)";
    } else {
        riskBadge.className = "risk-badge risk-high";
        circle.style.borderColor = "var(--danger)";
        circle.style.color = "var(--danger)";
    }

    document.getElementById("analyzedImage").src = API_BASE_URL.replace('/api', '') + data.image_url;
    
    document.getElementById("moistureVal").innerText = data.moisture_indicator;
    document.getElementById("brightnessVal").innerText = data.brightness;
    document.getElementById("contrastVal").innerText = data.contrast;
    document.getElementById("colorVarVal").innerText = data.color_variation;
    document.getElementById("textureVal").innerText = data.texture_score;
    
    document.getElementById("recommendationsText").innerText = data.recommendation;
}

function downloadPDF(reportId, token) {
    showToast("Preparing print view...", "info");
    window.print();
}
