/**
 * Edge Dashboard — State Early Intervention Monitoring
 * FERPA-compliant, NIST 800-53 AC-3 enforced
 *
 * Features:
 *   a) Real-time compliance tracker (regions + benchmarks)
 *   b) Predictive training needs map (color-coded risk cards)
 *   c) Parental communication/consent tracking (breakdown)
 */

const STATE = {
    API_TOKEN: new URLSearchParams(window.location.search).get('token'),
    MOODLE_URL: 'https://moodle-instance.local',
    WIDGET_REFRESH_MS: 30000,
};

async function validateToken() {
    if (!STATE.API_TOKEN) {
        document.getElementById('app').innerHTML = `
            <div class="flex items-center justify-center min-h-screen bg-red-50 p-6">
                <div class="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
                    <div class="text-red-500 text-5xl mb-4">🔒</div>
                    <h2 class="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p class="text-gray-600 text-sm">No valid session token found.
                    Please scan the QR code again or contact your administrator.</p>
                </div>
            </div>`;
        return false;
    }
    return true;
}

async function fetchDashboard() {
    const url = `${STATE.MOODLE_URL}/webservice/rest/server.php`
        + `?wstoken=${STATE.API_TOKEN}`
        + `&wsfunction=local_onsitemonitoring_get_dashboard`
        + `&tenant_id=demo-state-tenant`
        + `&moodlewsrestformat=json`;

    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!resp.ok) throw new Error(`API Error: ${resp.status}`);
    const data = await resp.json();

    document.getElementById('ferpa-banner').textContent =
        data.anonymized
            ? '✅ Data is anonymized. No PII is displayed. (FERPA 34 CFR §99.31)'
            : '⚠️ Authorized view — PII visible.';

    return data;
}

function renderComplianceTracker(data) {
    const el = document.getElementById('widget-compliance');
    const overall = data.compliance.overall_pct;
    const statusColor = overall >= 80 ? 'text-green-600' : overall >= 60 ? 'text-amber-500' : 'text-red-500';

    el.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    📋 Compliance Tracker
                </h3>
                <span class="text-xs text-gray-400">IDEA Part C</span>
            </div>
            <div class="flex items-baseline justify-center mb-4">
                <span class="text-4xl font-bold ${statusColor}">${overall}%</span>
                <span class="text-sm text-gray-500 ml-2">statewide</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div class="h-3 rounded-full transition-all duration-1000"
                     style="width:${overall}%; background: ${overall >= 80 ? '#16a34a' : overall >= 60 ? '#f59e0b' : '#dc2626'}">
                </div>
            </div>
            <div class="space-y-2">
                ${data.compliance.by_region.map(r => `
                    <div class="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                        <span class="text-gray-600 truncate max-w-[140px]">${r.region}</span>
                        <div class="flex items-center gap-2">
                            <span class="font-mono text-xs ${r.eval_pct >= 80 ? 'text-green-600' : 'text-amber-500'}">
                                ${r.eval_pct}%
                            </span>
                            <span class="inline-block w-2 h-2 rounded-full
                                ${r.status === 'critical' ? 'bg-red-500' : r.status === 'at_risk' ? 'bg-amber-400' : 'bg-green-500'}">
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="mt-3 pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                <span>45-day eval: ${data.compliance.benchmark_eval}% target</span>
                <span>Updated ${new Date(data.timestamp).toLocaleTimeString()}</span>
            </div>
        </div>
    `;
}

function renderTrainingNeeds(data) {
    const el = document.getElementById('widget-training');
    const atRisk = data.training_needs.regions_at_risk;

    el.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    🎓 Training Needs Map
                </h3>
                <span class="text-xs text-gray-400">Predictive</span>
            </div>
            <div class="flex items-baseline justify-center mb-2">
                <span class="text-4xl font-bold ${data.training_needs.overall_completion_pct >= 70 ? 'text-green-600' : 'text-amber-500'}">
                    ${data.training_needs.overall_completion_pct}%
                </span>
                <span class="text-sm text-gray-500 ml-2">completed</span>
            </div>
            <p class="text-xs text-gray-400 text-center mb-4">
                State avg: ${data.training_needs.state_avg_months_since_training} months since last training
            </p>
            ${atRisk.length === 0 ? `
                <div class="text-center py-6 text-green-600 text-sm">
                    ✅ All regions up-to-date on training requirements.
                </div>
            ` : `
                <div class="space-y-2">
                    ${atRisk.map(r => `
                        <div class="bg-red-50 border border-red-100 rounded-lg p-3">
                            <div class="flex justify-between items-start">
                                <span class="text-sm font-medium text-gray-800">${r.region}</span>
                                <span class="text-xs font-bold ${r.completion_pct < 40 ? 'text-red-600' : 'text-amber-600'}">
                                    ${r.completion_pct}%
                                </span>
                            </div>
                            <div class="flex justify-between text-xs text-gray-500 mt-1">
                                <span>${r.personnel_count} personnel</span>
                                <span>${r.months_since_training} months since training</span>
                            </div>
                            <div class="w-full bg-red-200 rounded-full h-2 mt-2">
                                <div class="h-2 rounded-full bg-red-500" style="width:${r.completion_pct}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
}

function renderConsentWidget(data) {
    const el = document.getElementById('widget-consent');
    const c = data.consent;

    el.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    📝 Consent Tracking
                </h3>
                <span class="text-xs text-gray-400">FERPA §99.30</span>
            </div>
            <div class="grid grid-cols-3 gap-2 mb-4">
                <div class="text-center bg-green-50 rounded-lg p-2">
                    <div class="text-2xl font-bold text-green-600">${c.consent_granted}</div>
                    <div class="text-xs text-gray-500">Granted</div>
                </div>
                <div class="text-center bg-red-50 rounded-lg p-2">
                    <div class="text-2xl font-bold text-red-500">${c.consent_denied}</div>
                    <div class="text-xs text-gray-500">Denied</div>
                </div>
                <div class="text-center bg-amber-50 rounded-lg p-2">
                    <div class="text-2xl font-bold text-amber-500">${c.consent_pending}</div>
                    <div class="text-xs text-gray-500">Pending</div>
                </div>
            </div>
            <div class="flex items-center justify-between text-sm mb-3">
                <span class="text-gray-600">Overall consent rate</span>
                <span class="text-lg font-bold text-gray-800">${c.overall_consent_rate_pct}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div class="h-3 rounded-full bg-green-500" style="width:${c.overall_consent_rate_pct}%"></div>
            </div>
            ${c.by_region.slice(0, 3).map(r => `
                <div class="flex items-center justify-between text-sm py-1 border-b border-gray-50">
                    <span class="text-gray-600 truncate max-w-[140px]">${r.region}</span>
                    <div class="flex items-center gap-2">
                        <span class="font-mono text-xs text-green-600">${r.consent_pct}%</span>
                        <span class="text-xs text-gray-400">${r.pending} pending</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function initDashboard() {
    if (!await validateToken()) return;

    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <div class="bg-indigo-700 text-white p-4 sticky top-0 z-10 shadow-md">
                <div class="flex items-center justify-between max-w-lg mx-auto">
                    <div>
                        <h1 class="text-lg font-bold">State EI Monitor</h1>
                        <p class="text-xs text-indigo-200 opacity-80">IDEA Part C · Demo Instance</p>
                    </div>
                    <div id="ferpa-banner" class="text-xs bg-indigo-800 px-2 py-1 rounded">
                        Loading...
                    </div>
                </div>
            </div>
            <div class="max-w-lg mx-auto p-4">
                <div id="widget-compliance"></div>
                <div id="widget-training"></div>
                <div id="widget-consent"></div>
                <div class="text-center text-xs text-gray-400 py-4">
                    <p>Secured by Moodle REST API · NIST 800-53 AC-3</p>
                    <p>Auto-refreshes every 30s</p>
                </div>
            </div>
        </div>
    `;

    async function refresh() {
        try {
            const data = await fetchDashboard();
            renderComplianceTracker(data);
            renderTrainingNeeds(data);
            renderConsentWidget(data);
        } catch (err) {
            document.getElementById('widget-compliance').innerHTML =
                `<div class="bg-red-50 text-red-600 p-4 rounded-lg text-sm text-center">
                    Connection error: ${err.message}
                </div>`;
        }
    }

    await refresh();
    setInterval(refresh, STATE.WIDGET_REFRESH_MS);
}

document.addEventListener('DOMContentLoaded', initDashboard);
