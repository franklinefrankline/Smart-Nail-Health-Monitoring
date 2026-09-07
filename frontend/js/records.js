document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  loadRecords(token);
});

async function loadRecords(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.status === 401) {
      window.logout();
      return;
    }
    if (!response.ok) throw new Error("Unable to load reports");
    const result = await response.json();
    renderRecords(Array.isArray(result.data) ? result.data : []);
  } catch (error) {
    document.getElementById("reportCount").textContent = "Unavailable";
    document.getElementById("recordsList").innerHTML = '<div class="empty-state">Unable to load reports. Please try again.</div>';
    showToast("Unable to load reports.", "error");
  }
}

function renderRecords(reports) {
  const count = document.getElementById("reportCount");
  const list = document.getElementById("recordsList");
  count.textContent = `${reports.length} ${reports.length === 1 ? "report" : "reports"}`;
  if (!reports.length) {
    list.innerHTML = '<div class="empty-state">No reports found. <a href="upload.html">Analyze your first image</a></div>';
    return;
  }
  list.innerHTML = reports.map(report => {
    const risk = String(report.risk_level || "Unknown").toLowerCase();
    const riskClass = risk.includes("high") ? "high" : risk.includes("moderate") ? "moderate" : "low";
    const date = new Date(report.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    return `<article class="record-row"><div class="record-id"><span class="record-icon"><i class="fa-solid fa-file-waveform"></i></span><div><strong>Report #${report.id}</strong><span>${date}</span></div></div><div class="record-metric"><small>Health score</small><strong>${report.health_score}<em>/100</em></strong></div><div class="record-metric"><small>Risk level</small><span class="risk-badge ${riskClass}">${report.risk_level || "Unknown"}</span></div><a class="record-view" href="result.html?id=${encodeURIComponent(report.id)}">View <span aria-hidden="true">↗</span></a></article>`;
  }).join("");
}
