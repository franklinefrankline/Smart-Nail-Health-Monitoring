document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("access_token");
  if (!token) { window.location.href = "login.html"; return; }
  const user = JSON.parse(localStorage.getItem("user_info") || "{}");
  setUserDetails(user);
  setupSidebar();
  loadDashboardData(token);
});

function setUserDetails(user) {
  const name = user.name || "User";
  const firstName = name.split(/\s+/)[0];
  ["sidebarName", "headerName"].forEach(id => document.getElementById(id).textContent = name);
  document.getElementById("sidebarEmail").textContent = user.email || "Signed-in user";
  document.getElementById("welcomeName").textContent = firstName;
  ["sidebarAvatar", "headerAvatar"].forEach(id => document.getElementById(id).textContent = name.charAt(0).toUpperCase());
}

function setupSidebar() {
  const toggle = document.getElementById("dashboardMenuToggle");
  const sidebar = document.getElementById("dashboardSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  const close = () => { sidebar.classList.remove("open"); backdrop.classList.remove("visible"); toggle.setAttribute("aria-expanded", "false"); };
  toggle.addEventListener("click", () => { const open = sidebar.classList.toggle("open"); backdrop.classList.toggle("visible", open); toggle.setAttribute("aria-expanded", String(open)); });
  backdrop.addEventListener("click", close);
  document.getElementById("logoutButton").addEventListener("click", () => window.logout());
}

async function loadDashboardData(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/history`, { headers: { "Authorization": `Bearer ${token}` } });
    if (response.status === 401) { window.logout(); return; }
    if (!response.ok) throw new Error("Unable to load reports");
    const result = await response.json();
    const reports = Array.isArray(result.data) ? result.data : [];
    updateSummaryCards(reports); updateChart(reports); updateRiskSummary(reports); updateHistory(reports);
  } catch (error) {
    document.getElementById("historyList").innerHTML = '<div class="empty-state">Unable to load reports. Please try again.</div>';
    document.getElementById("healthChart").innerHTML = '<div class="empty-state">Unable to load analysis history.</div>';
    showToast("Unable to load dashboard data.", "error");
  }
}

function updateSummaryCards(reports) {
  document.getElementById("totalReports").textContent = reports.length;
  if (!reports.length) return;
  const latest = reports[0];
  document.getElementById("latestScoreValue").innerHTML = `${latest.health_score}<em>/100</em>`;
  document.getElementById("latestRiskLevel").textContent = latest.risk_level || "Unknown";
  document.getElementById("scoreHint").textContent = "Latest image-based result";
  document.getElementById("lastAnalysis").textContent = formatDate(latest.created_at, { month: "short", day: "numeric" });
  document.getElementById("lastAnalysisTime").textContent = formatDate(latest.created_at, { hour: "numeric", minute: "2-digit" });
}

function formatDate(value, options = {}) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "--" : date.toLocaleDateString(undefined, options); }
function riskKey(value) { const risk = String(value || "").toLowerCase(); return risk.includes("moderate") ? "moderate" : risk.includes("high") ? "high" : "low"; }

function updateChart(reports) {
  const container = document.getElementById("healthChart");
  if (!reports.length) { container.innerHTML = '<div class="empty-state">No analysis history available</div>'; return; }
  const points = reports.slice(0, 8).reverse(); const width = 680; const height = 220; const left = 38; const right = 10; const top = 12; const bottom = 28; const plotWidth = width - left - right; const plotHeight = height - top - bottom;
  const pointData = points.map((report, index) => ({ report, x: left + (points.length === 1 ? plotWidth / 2 : index * plotWidth / (points.length - 1)), y: top + (100 - Number(report.health_score || 0)) / 100 * plotHeight }));
  const line = pointData.map(point => `${point.x},${point.y}`).join(" "); const area = `${left},${height - bottom} ${line} ${left + plotWidth},${height - bottom}`;
  const grid = [0, 25, 50, 75, 100].map(score => { const y = top + (100 - score) / 100 * plotHeight; return `<line class="chart-grid-line" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"/><text class="chart-score" x="${left - 8}" y="${y + 3}">${score}</text>`; }).join("");
  const labels = pointData.map(point => `<text class="chart-label" x="${point.x}" y="${height - 7}" text-anchor="middle">${formatDate(point.report.created_at, { month: "short", day: "numeric" })}</text><circle class="chart-point" cx="${point.x}" cy="${point.y}" r="4"/>`).join("");
  container.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Health score history"><defs><linearGradient id="scoreFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#0f9d8a" stop-opacity=".2"/><stop offset="1" stop-color="#0f9d8a" stop-opacity="0"/></linearGradient></defs>${grid}<polygon class="chart-area" points="${area}"/><polyline class="chart-line" points="${line}"/>${labels}</svg>`;
}

function updateRiskSummary(reports) {
  const counts = { low: 0, moderate: 0, high: 0 }; reports.forEach(report => counts[riskKey(report.risk_level)]++); const total = reports.length;
  document.getElementById("riskTotal").textContent = total;
  if (!total) { document.getElementById("riskEmpty").style.display = "block"; document.getElementById("riskDonut").style.background = "var(--dashboard-line)"; return; }
  document.getElementById("riskEmpty").style.display = "none"; let start = 0; const colors = { low: "var(--success)", moderate: "var(--warning)", high: "var(--danger)" }; const stops = Object.keys(counts).map(key => { const end = start + counts[key] / total * 100; const range = `${colors[key]} ${start}% ${end}%`; start = end; return range; }); document.getElementById("riskDonut").style.background = `conic-gradient(${stops.join(", ")})`;
  Object.keys(counts).forEach(key => { document.querySelector(`#riskList .risk-dot.${key}`).parentElement.nextElementSibling.textContent = `${Math.round(counts[key] / total * 100)}%`; });
}

function updateHistory(reports) {
  const container = document.getElementById("historyList"); if (!reports.length) { container.innerHTML = '<div class="empty-state">No analysis reports found. <a href="upload.html">Analyze your first image</a></div>'; return; }
  container.innerHTML = ""; reports.slice(0, 5).forEach(report => { const item = document.createElement("div"); item.className = "recent-item"; const image = document.createElement("img"); image.className = "nail-thumb"; image.alt = "Nail analysis thumbnail"; image.src = report.image_path ? `${API_BASE_URL.replace("/api", "")}/api/${report.image_path}` : ""; image.onerror = () => { image.style.visibility = "hidden"; }; item.append(image); const details = document.createElement("div"); details.innerHTML = `<span class="record-title">Report #${report.id}</span><span class="record-meta">${formatDate(report.created_at, { month: "short", day: "numeric", year: "numeric" })}</span>`; item.append(details); const score = document.createElement("div"); score.className = "record-stat"; score.innerHTML = `<span class="record-label">Score</span><span class="record-value">${report.health_score}/100</span>`; item.append(score); const risk = document.createElement("div"); risk.className = "record-stat"; risk.innerHTML = `<span class="record-label">Risk</span><span class="risk-badge ${riskKey(report.risk_level)}">${report.risk_level || "Unknown"}</span>`; item.append(risk); const status = document.createElement("div"); status.className = "record-stat"; status.innerHTML = '<span class="record-label">Status</span><span class="record-value">Completed</span>'; item.append(status); const view = document.createElement("a"); view.className = "view-link"; view.href = `result.html?id=${encodeURIComponent(report.id)}`; view.textContent = "View"; item.append(view); container.append(item); });
}
