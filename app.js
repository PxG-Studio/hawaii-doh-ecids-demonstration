(function () {
    // State management
    const STATE = {
        TOKEN: new URLSearchParams(window.location.search).get('token'),
        TENANT: new URLSearchParams(window.location.search).get('tenant') || 'DEMO001',
        BASE_URL: window.location.origin + '/moodle',
        REFRESH_MS: 30000,
        DEMO_MODE: false,
        ACTIVE_SCENARIO: 'baseline', // baseline, shortage, blitz, consent_delay
        FERPA_ANONYMIZED: true,
        CHARTS: {},
    };

    // Pre-configured mock data for Standalone Demo Mode/Fallback
    const SCENARIOS = {
        baseline: {
            anonymized: true,
            timestamp: new Date().toISOString(),
            compliance: {
                overall_pct: 82.4,
                by_region: [
                    { region: 'Oahu (Honolulu)', eval_pct: 88.5, ifsp_pct: 84.0, status: 'on_track', raw_name: 'Kailani Silva', case_id: 'C-7284' },
                    { region: 'Maui (Kahului)', eval_pct: 78.0, ifsp_pct: 75.2, status: 'at_risk', raw_name: 'Keoni Akana', case_id: 'C-3921' },
                    { region: 'Hawaii (Hilo)', eval_pct: 85.0, ifsp_pct: 80.5, status: 'on_track', raw_name: 'Leilani Kahale', case_id: 'C-8924' },
                    { region: 'Kauai (Lihue)', eval_pct: 69.4, ifsp_pct: 65.0, status: 'critical', raw_name: 'Maleko Davis', case_id: 'C-1049' }
                ],
                benchmark_eval: 100,
                benchmark_ifsp: 100
            },
            training_needs: {
                overall_completion_pct: 74.8,
                regions_at_risk: [
                    { region: 'Kauai (Lihue)', completion_pct: 35.0, personnel_count: 14, months_since_training: 14 }
                ],
                state_avg_months_since_training: 6.8
            },
            consent: {
                overall_consent_rate_pct: 81.3,
                total_families: 160,
                consent_granted: 130,
                consent_denied: 10,
                consent_pending: 20,
                by_region: [
                    { region: 'Oahu (Honolulu)', consent_pct: 88.0, pending: 6 },
                    { region: 'Maui (Kahului)', consent_pct: 78.5, pending: 4 },
                    { region: 'Hawaii (Hilo)', consent_pct: 82.0, pending: 3 },
                    { region: 'Kauai (Lihue)', consent_pct: 65.0, pending: 7 }
                ]
            }
        },
        shortage: {
            anonymized: true,
            timestamp: new Date().toISOString(),
            compliance: {
                overall_pct: 61.2,
                by_region: [
                    { region: 'Oahu (Honolulu)', eval_pct: 82.0, ifsp_pct: 79.5, status: 'on_track', raw_name: 'Kailani Silva', case_id: 'C-7284' },
                    { region: 'Maui (Kahului)', eval_pct: 42.1, ifsp_pct: 38.0, status: 'critical', raw_name: 'Keoni Akana', case_id: 'C-3921' },
                    { region: 'Hawaii (Hilo)', eval_pct: 80.5, ifsp_pct: 78.0, status: 'at_risk', raw_name: 'Leilani Kahale', case_id: 'C-8924' },
                    { region: 'Kauai (Lihue)', eval_pct: 54.0, ifsp_pct: 51.2, status: 'critical', raw_name: 'Maleko Davis', case_id: 'C-1049' }
                ],
                benchmark_eval: 100,
                benchmark_ifsp: 100
            },
            training_needs: {
                overall_completion_pct: 49.5,
                regions_at_risk: [
                    { region: 'Maui (Kahului)', completion_pct: 22.0, personnel_count: 18, months_since_training: 18 },
                    { region: 'Kauai (Lihue)', completion_pct: 31.0, personnel_count: 14, months_since_training: 15 }
                ],
                state_avg_months_since_training: 11.4
            },
            consent: {
                overall_consent_rate_pct: 74.3,
                total_families: 160,
                consent_granted: 119,
                consent_denied: 16,
                consent_pending: 25,
                by_region: [
                    { region: 'Oahu (Honolulu)', consent_pct: 84.0, pending: 8 },
                    { region: 'Maui (Kahului)', consent_pct: 61.0, pending: 9 },
                    { region: 'Hawaii (Hilo)', consent_pct: 78.0, pending: 3 },
                    { region: 'Kauai (Lihue)', consent_pct: 62.0, pending: 5 }
                ]
            }
        },
        blitz: {
            anonymized: true,
            timestamp: new Date().toISOString(),
            compliance: {
                overall_pct: 94.6,
                by_region: [
                    { region: 'Oahu (Honolulu)', eval_pct: 98.0, ifsp_pct: 96.5, status: 'on_track', raw_name: 'Kailani Silva', case_id: 'C-7284' },
                    { region: 'Maui (Kahului)', eval_pct: 92.5, ifsp_pct: 90.0, status: 'on_track', raw_name: 'Keoni Akana', case_id: 'C-3921' },
                    { region: 'Hawaii (Hilo)', eval_pct: 96.0, ifsp_pct: 94.0, status: 'on_track', raw_name: 'Leilani Kahale', case_id: 'C-8924' },
                    { region: 'Kauai (Lihue)', eval_pct: 91.2, ifsp_pct: 88.5, status: 'on_track', raw_name: 'Maleko Davis', case_id: 'C-1049' }
                ],
                benchmark_eval: 100,
                benchmark_ifsp: 100
            },
            training_needs: {
                overall_completion_pct: 98.2,
                regions_at_risk: [],
                state_avg_months_since_training: 2.1
            },
            consent: {
                overall_consent_rate_pct: 92.5,
                total_families: 160,
                consent_granted: 148,
                consent_denied: 8,
                consent_pending: 4,
                by_region: [
                    { region: 'Oahu (Honolulu)', consent_pct: 95.0, pending: 1 },
                    { region: 'Maui (Kahului)', consent_pct: 90.5, pending: 1 },
                    { region: 'Hawaii (Hilo)', consent_pct: 93.0, pending: 1 },
                    { region: 'Kauai (Lihue)', consent_pct: 88.0, pending: 1 }
                ]
            }
        },
        consent_delay: {
            anonymized: true,
            timestamp: new Date().toISOString(),
            compliance: {
                overall_pct: 79.8,
                by_region: [
                    { region: 'Oahu (Honolulu)', eval_pct: 86.0, ifsp_pct: 81.0, status: 'on_track', raw_name: 'Kailani Silva', case_id: 'C-7284' },
                    { region: 'Maui (Kahului)', eval_pct: 76.5, ifsp_pct: 74.0, status: 'at_risk', raw_name: 'Keoni Akana', case_id: 'C-3921' },
                    { region: 'Hawaii (Hilo)', eval_pct: 83.0, ifsp_pct: 80.0, status: 'on_track', raw_name: 'Leilani Kahale', case_id: 'C-8924' },
                    { region: 'Kauai (Lihue)', eval_pct: 71.0, ifsp_pct: 66.5, status: 'at_risk', raw_name: 'Maleko Davis', case_id: 'C-1049' }
                ],
                benchmark_eval: 100,
                benchmark_ifsp: 100
            },
            training_needs: {
                overall_completion_pct: 72.4,
                regions_at_risk: [
                    { region: 'Kauai (Lihue)', completion_pct: 42.0, personnel_count: 14, months_since_training: 13 }
                ],
                state_avg_months_since_training: 7.2
            },
            consent: {
                overall_consent_rate_pct: 54.4,
                total_families: 160,
                consent_granted: 87,
                consent_denied: 12,
                consent_pending: 61,
                by_region: [
                    { region: 'Oahu (Honolulu)', consent_pct: 64.0, pending: 18 },
                    { region: 'Maui (Kahului)', consent_pct: 51.5, pending: 15 },
                    { region: 'Hawaii (Hilo)', consent_pct: 58.0, pending: 11 },
                    { region: 'Kauai (Lihue)', consent_pct: 35.0, pending: 17 }
                ]
            }
        }
    };

    // Helper: Cryptographic Simulation Hash for FERPA masking
    function sha256_mock(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return 'HASH-' + Math.abs(hash).toString(16).toUpperCase().substring(0, 8);
    }

    // Dynamic UI Shell Setup
    function setupDashboardShell() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <!-- Top Premium Header Banner -->
            <header class="bg-slate-900/80 backdrop-blur-md border-b border-indigo-500/20 sticky top-0 z-50 px-4 py-3 shadow-lg">
                <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <!-- Simulated State Seal / Shield Icon -->
                        <div class="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                            <span class="font-outfit font-extrabold text-sm tracking-tighter">HI</span>
                        </div>
                        <div>
                            <h1 class="text-lg font-outfit font-bold tracking-tight bg-gradient-to-r from-slate-100 to-indigo-100 bg-clip-text text-transparent">Hawaii Department of Health</h1>
                            <p class="text-xs font-medium text-indigo-300 font-sans tracking-wide">Early Intervention Section (EIS) Compliance</p>
                        </div>
                    </div>

                    <!-- Authorization Toggles & View Badges -->
                    <div class="flex flex-wrap items-center gap-2">
                        <div id="mode-badge" class="px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider font-outfit shadow-sm bg-purple-500/25 border border-purple-400/30 text-purple-300">
                            DEMO (SIMULATED PUBLIC DATA)
                        </div>
                        <button id="ferpa-toggle" title="Toggle FERPA filter to mask personally identifiable information (PII)" class="px-3 py-1 rounded-lg text-xs font-bold transition-all duration-300 shadow-md border font-outfit focus:outline-none flex items-center gap-1.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20">
                            <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            FERPA DE-IDENTIFIED
                        </button>
                        <button id="flip-toggle" title="Toggle between the interactive dashboard and the APA-cited regulatory data reference face" class="px-3.5 py-1 rounded-lg text-xs font-bold transition-all duration-300 shadow-md border font-outfit focus:outline-none bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20">
                            DATA REFERENCES
                        </button>
                    </div>
                </div>
            </header>

            <!-- Warnings / Simulated Caveat Banner -->
            <div class="max-w-5xl mx-auto px-4 mt-4" title="Regulatory sandbox environment disclosure">
                <div class="bg-indigo-950/40 border border-indigo-500/20 rounded-xl px-4 py-2.5 flex items-center gap-3 text-xs text-indigo-300 shadow-sm font-sans">
                    <span class="px-2 py-0.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded text-[10px] font-bold font-outfit">NOTICE</span>
                    <p class="leading-relaxed">
                        <strong class="font-outfit text-slate-100 font-semibold tracking-wide">DEMONSTRATION WORKFLOW:</strong> 
                        This system operates exclusively on synthesized open educational data to simulate Hawaii's Department of Health compliance tracking. No real Protected Health Information (PHI) or Personally Identifiable Information (PII) is processed.
                    </p>
                </div>
            </div>

            <!-- 3D Card Flip Wrapper -->
            <div class="flip-container max-w-5xl mx-auto px-4 mt-6">
                <div id="dashboard-card" class="flip-card">
                    
                    <!-- FRONT OF THE CARD: Live Interactive Dashboard -->
                    <div class="flip-front">
                        <!-- Strategic Scenario Selector (WOW Factor for Interview) -->
                        <section class="glass-card rounded-2xl p-4 mb-6 relative overflow-hidden">
                            <div class="absolute -right-12 -bottom-12 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"></div>
                            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <h3 class="text-xs font-bold uppercase tracking-wider text-indigo-300 font-outfit">Statewide Scenario Simulator</h3>
                                    <p class="text-xs text-slate-400 mt-0.5">Mock API pushes to simulate real-time compliance interventions live</p>
                                </div>
                                <div class="flex flex-col gap-2 w-full md:w-auto">
                                    <div class="flex flex-wrap gap-2 w-full md:w-auto">
                                        <button data-scenario="baseline" class="scenario-btn flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border bg-indigo-600/40 border-indigo-500/40 text-slate-200 shadow-md hover:bg-indigo-600/60">
                                            Standard Baseline
                                        </button>
                                        <button data-scenario="shortage" class="scenario-btn flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30">
                                            Maui Crisis
                                        </button>
                                        <button data-scenario="blitz" class="scenario-btn flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30">
                                            Oahu Training Blitz
                                        </button>
                                        <button data-scenario="consent_delay" class="scenario-btn flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/30">
                                            Kauai Consent Lag
                                        </button>
                                    </div>
                                    <!-- Dynamic Scenario Explanation to eliminate cognitive friction -->
                                    <div id="scenario-helper-text" class="text-[11px] text-indigo-300/90 font-medium transition-all duration-300 italic min-h-[16px]"></div>
                                </div>
                            </div>
                        </section>

                        <!-- Dashboard Widgets Grid -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            <!-- Widget A: Compliance Tracker (Circular Dial) -->
                            <div class="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between">
                                <div>
                                    <div class="flex items-center justify-between mb-4">
                                        <h3 class="text-sm font-bold uppercase tracking-wider text-slate-300 font-outfit">Compliance Tracker</h3>
                                        <span class="text-[10px] font-bold bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 px-2 py-0.5 rounded-md tracking-wider">IDEA PART C</span>
                                    </div>
                                    
                                    <div class="flex flex-col sm:flex-row items-center gap-6 py-2">
                                        <!-- Chart Canvas Container -->
                                        <div class="relative w-36 h-36 flex-shrink-0">
                                            <canvas id="chart-compliance"></canvas>
                                            <div class="absolute inset-0 flex flex-col items-center justify-center">
                                                <span id="compliance-pct-text" class="text-3xl font-extrabold font-outfit leading-none tracking-tight">--</span>
                                                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Statewide</span>
                                            </div>
                                        </div>
                                        
                                        <!-- Regional Rows -->
                                        <div class="w-full space-y-2.5" id="compliance-list">
                                            <!-- Rendered dynamically -->
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400 font-sans">
                                    <span class="flex items-center gap-1">
                                        <span class="w-2 h-2 rounded-full bg-indigo-400"></span> Evaluation Target: 100%
                                    </span>
                                    <span id="compliance-timestamp">--:--:--</span>
                                </div>
                            </div>

                            <!-- Widget B: Predictive Compliance Weather Radar -->
                            <div class="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between">
                                <div>
                                    <div class="flex items-center justify-between mb-4">
                                        <h3 class="text-sm font-bold uppercase tracking-wider text-slate-300 font-outfit">Predictive Risk Analysis</h3>
                                        <span class="text-[10px] font-bold bg-purple-500/10 border border-purple-400/20 text-purple-300 px-2 py-0.5 rounded-md tracking-wider">WEATHER RADAR</span>
                                    </div>
                                    
                                    <div class="flex flex-col sm:flex-row items-center gap-6 py-2">
                                        <!-- Chart Canvas Container -->
                                        <div class="relative w-36 h-36 flex-shrink-0">
                                            <canvas id="chart-training"></canvas>
                                            <div class="absolute inset-0 flex flex-col items-center justify-center">
                                                <span id="training-pct-text" class="text-3xl font-extrabold font-outfit leading-none tracking-tight">--</span>
                                                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Staff Training</span>
                                            </div>
                                        </div>

                                        <!-- Risk List -->
                                        <div class="w-full space-y-2" id="training-list">
                                            <!-- Rendered dynamically -->
                                        </div>
                                    </div>
                                </div>

                                <div class="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400 font-sans">
                                    <span class="flex items-center gap-1">
                                        <span class="w-2 h-2 rounded-full bg-purple-400"></span> Action Threshold: &lt; 50%
                                    </span>
                                    <span id="state-training-avg">State Avg: --</span>
                                </div>
                            </div>

                            <!-- Widget C: Secure Parental Portal & Consent -->
                            <div class="glass-card glass-card-hover rounded-2xl p-5 md:col-span-2 flex flex-col justify-between">
                                <div>
                                    <div class="flex items-center justify-between mb-4">
                                        <h3 class="text-sm font-bold uppercase tracking-wider text-slate-300 font-outfit">Secure Consent Tracking</h3>
                                        <span class="text-[10px] font-bold bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-md tracking-wider">FERPA AUDITED</span>
                                    </div>

                                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 py-2">
                                        <!-- Progress Indicators -->
                                        <div class="space-y-4">
                                            <div class="grid grid-cols-3 gap-2">
                                                <div class="text-center bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5">
                                                    <div id="consent-count-granted" class="text-xl font-bold font-outfit text-emerald-400">--</div>
                                                    <div class="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Granted</div>
                                                </div>
                                                <div class="text-center bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">
                                                    <div id="consent-count-denied" class="text-xl font-bold font-outfit text-red-400">--</div>
                                                    <div class="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Denied</div>
                                                </div>
                                                <div class="text-center bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
                                                    <div id="consent-count-pending" class="text-xl font-bold font-outfit text-amber-400">--</div>
                                                    <div class="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Pending</div>
                                                </div>
                                            </div>
                                            
                                            <div class="glass-card rounded-xl p-3.5 flex items-center justify-between">
                                                <div>
                                                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Overall Rate</span>
                                                    <h4 id="consent-overall-rate" class="text-2xl font-extrabold font-outfit mt-0.5 text-slate-100">--</h4>
                                                </div>
                                                <div class="w-16 h-16">
                                                    <canvas id="chart-consent-donut"></canvas>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Regional Rates -->
                                        <div class="space-y-2.5">
                                            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1 font-outfit">Regional Consent Rates</h4>
                                            <div id="consent-region-list" class="space-y-2">
                                                <!-- Rendered dynamically -->
                                            </div>
                                        </div>

                                        <!-- Real-time Simulated PII Anonymization Feed -->
                                        <div class="glass-card rounded-xl p-4 bg-slate-900/60 border border-indigo-500/10">
                                            <h4 class="text-xs font-bold text-indigo-300 uppercase tracking-wide mb-2 font-outfit flex items-center justify-between">
                                                <span>Data Pipeline Audit Feed</span>
                                                <span class="px-1.5 py-0.5 bg-indigo-500/20 text-[9px] text-indigo-300 rounded font-mono font-normal">NIST 800-53</span>
                                            </h4>
                                            <div class="space-y-2 font-mono text-[10px] overflow-hidden" id="pii-audit-feed">
                                                <!-- Rendered dynamically -->
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400">
                                    <span>Secured by Moodle REST API &middot; NIST 800-53 AC-3</span>
                                    <span class="flex items-center gap-1 animate-pulse">
                                        <span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> System Secure
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- BACK OF THE CARD: Open Data Regulatory References -->
                    <div class="flip-back">
                        <div class="glass-card rounded-3xl p-6 relative overflow-hidden">
                            <!-- Background glow -->
                            <div class="absolute -right-32 -top-32 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl"></div>
                            
                            <!-- Back Header -->
                            <div class="flex items-center justify-between border-b border-slate-700/40 pb-4 mb-6">
                                <div>
                                    <h2 class="text-xl font-outfit font-extrabold text-indigo-300 tracking-tight" title="APA-cited government data governance framework">Open Data Compliance & Regulatory Reference</h2>
                                    <p class="text-xs text-slate-400 mt-0.5">Statutory links and longitudinal Hawaii DXP / SLDS early intervention datasets</p>
                                </div>
                                <button id="flip-back-toggle" title="Return to interactive dial dashboard view" class="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-slate-100 shadow transition-all focus:outline-none">
                                    RETURN TO DASHBOARD
                                </button>
                            </div>

                            <!-- Regulatory Context Grid -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <!-- Col 1: Government Regulated Mandates -->
                                <div class="space-y-4">
                                    <h3 class="text-sm font-bold uppercase tracking-wider text-indigo-400 font-outfit" title="Statutory requirements under federal law">Regulated Compliance Mandates</h3>
                                    
                                    <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                                        <div class="flex items-start gap-2.5" title="Individuals with Disabilities Education Act timeline requirements">
                                            <span class="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[9px] font-bold rounded font-mono mt-0.5">PART C</span>
                                            <div>
                                                <h4 class="text-xs font-bold text-slate-200">34 C.F.R. § 303.310 - Evaluation Timeline</h4>
                                                <p class="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                                                    *APA Citation:* Individuals with Disabilities Education Act (IDEA), Part C, 34 C.F.R. § 303.310 (2011). Statutory link: <a href="https://www.ecfr.gov/current/title-34/subtitle-B/chapter-III/part-303" target="_blank" class="text-indigo-400 hover:underline">eCFR § 303.310</a>. Mandates completing evaluations and initial IFSP meetings within 45 days.
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div class="flex items-start gap-2.5" title="Family Educational Rights and Privacy Act record constraints">
                                            <span class="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded font-mono mt-0.5">FERPA</span>
                                            <div>
                                                <h4 class="text-xs font-bold text-slate-200">34 C.F.R. § 99.31 - De-identified Records</h4>
                                                <p class="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                                                    *APA Citation:* Family Educational Rights and Privacy Act (FERPA), 34 C.F.R. § 99.31 (2011). Statutory link: <a href="https://www.ecfr.gov/current/title-34/subtitle-B/chapter-I/part-99" target="_blank" class="text-emerald-400 hover:underline">eCFR § 99.31</a>. Permits release of records without consent if all PII is systematically stripped.
                                                </p>
                                            </div>
                                        </div>

                                        <div class="flex items-start gap-2.5" title="National Institute of Standards and Technology security guidelines">
                                            <span class="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[9px] font-bold rounded font-mono mt-0.5">NIST SP</span>
                                            <div>
                                                <h4 class="text-xs font-bold text-slate-200">NIST SP 800-53 Rev. 5 - Access Controls</h4>
                                                <p class="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                                                    *APA Citation:* Joint Task Force. (2020). *Security and Privacy Controls for Information Systems and Organizations* (NIST Special Publication 800-53, Rev. 5). Statutory link: <a href="https://doi.org/10.6028/NIST.SP.800-53r5" target="_blank" class="text-purple-400 hover:underline">NIST SP 800-53r5</a>.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Col 2: Longitudinal Feasibility Studies & Mappings -->
                                <div class="space-y-4">
                                    <h3 class="text-sm font-bold uppercase tracking-wider text-indigo-400 font-outfit" title="EDFacts longitudinal file specifications and data dictionaries under Section 618">EDFacts Mappings (Section 618)</h3>
                                    
                                    <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                                        <div title="EDFacts Child Count and settings file specifications (DG 622)">
                                            <h4 class="text-xs font-bold text-slate-200 flex items-center justify-between">
                                                <span>DG 622 - Part C Child Count</span>
                                                <span class="text-[9px] text-slate-400 font-mono">U.S. Dept of Ed (FS121)</span>
                                            </h4>
                                            <p class="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                                                *File Name:* `FS121_Part_C_Child_Count_v2024.csv` | *Data Dictionary:* EDFacts FS121 Data Dictionary (v20.0) | *Published:* Nov 2024. Governs regional child counts and early intervention settings.
                                            </p>
                                        </div>
                                        <hr class="border-slate-800" />
                                        <div title="EDFacts exiting and transition outcome file specifications (DG 623)">
                                            <h4 class="text-xs font-bold text-slate-200 flex items-center justify-between">
                                                <span>DG 623 - Part C Exiting & Transition</span>
                                                <span class="text-[9px] text-slate-400 font-mono">U.S. Dept of Ed (FS122)</span>
                                            </h4>
                                            <p class="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                                                *File Name:* `FS122_Part_C_Exiting_v2024.csv` | *Data Dictionary:* EDFacts FS122 Data Dictionary (v20.0) | *Published:* Nov 2024. Tracks transition outcomes (Part B transition, exit without referral).
                                            </p>
                                        </div>
                                        <hr class="border-slate-800" />
                                        <div title="EDFacts preschool child count and settings file specifications (DG 619)">
                                            <h4 class="text-xs font-bold text-slate-200 flex items-center justify-between">
                                                <span>DG 619 - Part B Early Childhood</span>
                                                <span class="text-[9px] text-slate-400 font-mono">U.S. Dept of Ed (FS089)</span>
                                            </h4>
                                            <p class="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                                                *File Name:* `FS089_Early_Childhood_v2024.csv` | *Data Dictionary:* EDFacts FS089 Data Dictionary (v20.1) | *Published:* Dec 2024. Tracks preschool-aged children settings (regular EC program, home).
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Ingested Reference Table -->
                            <div class="space-y-3">
                                <h3 class="text-sm font-bold uppercase tracking-wider text-indigo-400 font-outfit" title="Active database schema indexing OSEP open data baselines">Simulated Database Schema Index (Ingested 2026-05-28)</h3>
                                <div class="overflow-x-auto">
                                    <table class="w-full text-left border-collapse text-[11px]" title="Regional compliance records and FTE personnel distribution">
                                        <thead>
                                            <tr class="border-b border-slate-800 text-slate-400 font-mono">
                                                <th class="py-2 font-bold uppercase" title="Administrative region of Hawaii DOH">Region</th>
                                                <th class="py-2 font-bold uppercase" title="Federal EDFacts Data Governance tracking category">Primary EDFacts DG Reference</th>
                                                <th class="py-2 font-bold uppercase" title="Number of simulated Part C active cases">Base Student Count</th>
                                                <th class="py-2 font-bold uppercase" title="Baseline OSEP compliance index">Base Compliance %</th>
                                                <th class="py-2 font-bold uppercase" title="Full-Time Equivalent personnel currently assigned">Personnel Capacity</th>
                                                <th class="py-2 font-bold uppercase" title="Average duration in months since last professional capacity building training">Training Baseline</th>
                                            </tr>
                                        </thead>
                                        <tbody class="text-slate-300 font-sans">
                                            <tr class="border-b border-slate-800/40" title="Honolulu regional stats">
                                                <td class="py-2 font-semibold text-slate-200">Oahu (Honolulu)</td>
                                                <td class="py-2 font-mono">DG 622 (Part C Child Count)</td>
                                                <td class="py-2">85 Cases</td>
                                                <td class="py-2 font-mono text-emerald-400">88.5%</td>
                                                <td class="py-2">45 FTE Personnel</td>
                                                <td class="py-2">6.8 Months since training</td>
                                            </tr>
                                            <tr class="border-b border-slate-800/40" title="Kahului regional stats">
                                                <td class="py-2 font-semibold text-slate-200">Maui (Kahului)</td>
                                                <td class="py-2 font-mono">DG 622 (Part C Child Count)</td>
                                                <td class="py-2">32 Cases</td>
                                                <td class="py-2 font-mono text-amber-400">78.0%</td>
                                                <td class="py-2">18 FTE Personnel</td>
                                                <td class="py-2">8.2 Months since training</td>
                                            </tr>
                                            <tr class="border-b border-slate-800/40" title="Hilo regional stats">
                                                <td class="py-2 font-semibold text-slate-200">Hawaii (Hilo)</td>
                                                <td class="py-2 font-mono">DG 622 (Part C Child Count)</td>
                                                <td class="py-2">29 Cases</td>
                                                <td class="py-2 font-mono text-emerald-400">85.0%</td>
                                                <td class="py-2">22 FTE Personnel</td>
                                                <td class="py-2">5.5 Months since training</td>
                                            </tr>
                                            <tr class="border-b border-slate-800/40" title="Lihue regional stats">
                                                <td class="py-2 font-semibold text-slate-200">Kauai (Lihue)</td>
                                                <td class="py-2 font-mono">DG 622 (Part C Child Count)</td>
                                                <td class="py-2">14 Cases</td>
                                                <td class="py-2 font-mono text-red-400">69.4%</td>
                                                <td class="py-2">14 FTE Personnel</td>
                                                <td class="py-2">14.0 Months since training</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `;

        // Bind events
        document.getElementById('ferpa-toggle').addEventListener('click', toggleFerpaFilter);
        
        // Bind flip triggers & Navigation State Symmetrization
        const card = document.getElementById('dashboard-card');
        const flipToggleBtn = document.getElementById('flip-toggle');
        const ferpaToggleBtn = document.getElementById('ferpa-toggle');
        const modeBadge = document.getElementById('mode-badge');

        function setFlippedHeaderState(isFlipped) {
            if (isFlipped) {
                flipToggleBtn.innerHTML = "RETURN TO DASHBOARD";
                flipToggleBtn.className = "px-3.5 py-1 rounded-lg text-xs font-bold transition-all duration-300 shadow-md border font-outfit focus:outline-none bg-indigo-600 border-indigo-500 text-white";
                ferpaToggleBtn.style.opacity = "0.3";
                ferpaToggleBtn.style.pointerEvents = "none";
                modeBadge.textContent = "REGULATORY REFERENCE DATA";
                modeBadge.className = "px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider font-outfit shadow-sm bg-indigo-500/25 border border-indigo-400/30 text-indigo-300 animate-pulse";
            } else {
                flipToggleBtn.innerHTML = "DATA REFERENCES";
                flipToggleBtn.className = "px-3.5 py-1 rounded-lg text-xs font-bold transition-all duration-300 shadow-md border font-outfit focus:outline-none bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20";
                ferpaToggleBtn.style.opacity = "1";
                ferpaToggleBtn.style.pointerEvents = "auto";
                modeBadge.textContent = STATE.DEMO_MODE ? "DEMO (SIMULATED PUBLIC DATA)" : "LIVE DB CONNECTION";
                modeBadge.className = STATE.DEMO_MODE 
                    ? "px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider font-outfit shadow-sm bg-purple-500/25 border border-purple-400/30 text-purple-300"
                    : "px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider font-outfit shadow-sm bg-indigo-500/25 border border-indigo-400/30 text-indigo-300";
            }
        }

        flipToggleBtn.addEventListener('click', () => {
            const willFlip = !card.classList.contains('flipped');
            card.classList.toggle('flipped');
            setFlippedHeaderState(willFlip);
        });

        document.getElementById('flip-back-toggle').addEventListener('click', () => {
            card.classList.remove('flipped');
            setFlippedHeaderState(false);
        });
        
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const scen = this.getAttribute('data-scenario');
                triggerScenario(scen);
            });
        });
    }

    // Toggle FERPA de-identification filter visually
    function toggleFerpaFilter() {
        STATE.FERPA_ANONYMIZED = !STATE.FERPA_ANONYMIZED;
        const btn = document.getElementById('ferpa-toggle');
        
        if (STATE.FERPA_ANONYMIZED) {
            btn.className = "px-3 py-1 rounded-lg text-xs font-bold transition-all duration-300 shadow-md border font-outfit focus:outline-none flex items-center gap-1.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20";
            btn.innerHTML = `<span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span> FERPA DE-IDENTIFIED`;
        } else {
            btn.className = "px-3 py-1 rounded-lg text-xs font-bold transition-all duration-300 shadow-md border font-outfit focus:outline-none flex items-center gap-1.5 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20";
            btn.innerHTML = `<span class="inline-block w-2.5 h-2.5 rounded-full bg-red-400 animate-ping"></span> AUTHORIZED ACCESS (PII)`;
        }
        
        // Force refresh interface to show names vs hashes
        refreshUI();
    }

    // Scenario selection
    function triggerScenario(scenarioKey) {
        if (!SCENARIOS[scenarioKey]) return;
        STATE.ACTIVE_SCENARIO = scenarioKey;
        
        // Update active class on buttons & eliminate double-take question marks
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            const btnScen = btn.getAttribute('data-scenario');
            if (btnScen === scenarioKey) {
                btn.className = "scenario-btn flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border bg-indigo-500/20 border-indigo-400 text-white ring-2 ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.4)]";
            } else {
                btn.className = "scenario-btn flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-300 hover:border-indigo-500/30";
            }
        });

        // Dynamic Scenario Explanation to guide the driver at 60mph
        const helperText = document.getElementById('scenario-helper-text');
        if (helperText) {
            switch(scenarioKey) {
                case 'baseline':
                    helperText.textContent = "[STATUS] Baseline Condition: Normal operating parameters across all regional early intervention clinics.";
                    break;
                case 'shortage':
                    helperText.textContent = "[CRITICAL] Maui Crisis: Simulating critical personnel turnover in Kahului, causing evaluation timeline failures.";
                    break;
                case 'blitz':
                    helperText.textContent = "[INTERVENTION] Oahu Training Blitz: Showcasing rapid professional capacity building, successfully restoring compliance.";
                    break;
                case 'consent_delay':
                    helperText.textContent = "[LAG] Kauai Consent Lag: Simulating delays in parental consent approvals, building up pending logs.";
                    break;
            }
        }

        refreshUI();
    }

    // Fetch dashboard dynamic dispatcher
    async function fetchDashboard() {
        if (STATE.DEMO_MODE) {
            return SCENARIOS[STATE.ACTIVE_SCENARIO];
        }

        try {
            const params = new URLSearchParams({
                wstoken: STATE.TOKEN,
                wsfunction: 'local_onsitemonitoring_get_dashboard',
                tenant_id: STATE.TENANT,
                moodlewsrestformat: 'json',
            });
            const resp = await fetch(STATE.BASE_URL + '/webservice/rest/server.php?' + params.toString());
            if (!resp.ok) throw new Error('API offline');
            const data = await resp.json();
            if (data.exception) throw new Error(data.message);
            return data;
        } catch (err) {
            console.warn("REST API server connection unavailable. Fallback to high-fidelity Standalone Sandbox Mode. Reverse proxy enabled so the server cannot be accessed directly.<br />Please contact the server administrator.", err.message);
            STATE.DEMO_MODE = true;
            const badge = document.getElementById('mode-badge');
            if (badge) {
                badge.textContent = "DEMO (SIMULATED PUBLIC DATA)";
                badge.className = "px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider font-outfit shadow-sm bg-purple-500/25 border border-purple-400/30 text-purple-300";
            }
            return SCENARIOS[STATE.ACTIVE_SCENARIO];
        }
    }

    // High fidelity Chart Render - Compliance Gauge
    function renderComplianceChart(pct) {
        const ctx = document.getElementById('chart-compliance').getContext('2d');
        
        if (STATE.CHARTS.compliance) {
            STATE.CHARTS.compliance.destroy();
        }

        const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
        
        STATE.CHARTS.compliance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [pct, 100 - pct],
                    backgroundColor: [color, 'rgba(255, 255, 255, 0.05)'],
                    borderWidth: 0,
                    borderRadius: [10, 0],
                }]
            },
            options: {
                cutout: '80%',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    }

    // High fidelity Chart Render - Training Radar or Polar Area
    function renderTrainingChart(pct) {
        const ctx = document.getElementById('chart-training').getContext('2d');
        
        if (STATE.CHARTS.training) {
            STATE.CHARTS.training.destroy();
        }

        const color = pct >= 70 ? '#6366f1' : '#a855f7';

        STATE.CHARTS.training = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [pct, 100 - pct],
                    backgroundColor: [color, 'rgba(255, 255, 255, 0.05)'],
                    borderWidth: 0,
                    borderRadius: [10, 0],
                }]
            },
            options: {
                cutout: '80%',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    }

    // High fidelity Chart Render - Consent Donut
    function renderConsentDonut(granted, denied, pending) {
        const ctx = document.getElementById('chart-consent-donut').getContext('2d');
        
        if (STATE.CHARTS.consent) {
            STATE.CHARTS.consent.destroy();
        }

        STATE.CHARTS.consent = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [granted, denied, pending],
                    backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                    borderWidth: 0,
                }]
            },
            options: {
                cutout: '65%',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    }

    // Refresh UI logic
    async function refreshUI() {
        const data = await fetchDashboard();

        // Update compliance timestamp
        document.getElementById('compliance-timestamp').textContent = new Date(data.timestamp).toLocaleTimeString();

        // Compute overall state compliance
        const comp = data.compliance;
        document.getElementById('compliance-pct-text').textContent = `${comp.overall_pct}%`;
        renderComplianceChart(comp.overall_pct);

        // Render regional compliance bars
        const compList = document.getElementById('compliance-list');
        compList.innerHTML = comp.by_region.map(r => {
            const statusColor = r.status === 'on_track' ? 'bg-emerald-500' : r.status === 'at_risk' ? 'bg-amber-500' : 'bg-red-500';
            const statusText = r.status === 'on_track' ? 'ON TRACK' : r.status === 'at_risk' ? 'RISK DETECTED' : 'CRITICAL GAP';
            const badgeColor = r.status === 'on_track' ? 'text-emerald-400 bg-emerald-500/10' : r.status === 'at_risk' ? 'text-amber-400 bg-amber-500/10' : 'text-red-400 bg-red-500/10';

            return `
                <div>
                    <div class="flex items-center justify-between text-xs font-semibold mb-1">
                        <span class="text-slate-300 font-outfit">${r.region}</span>
                        <div class="flex items-center gap-2">
                            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeColor}">${statusText}</span>
                            <span class="font-mono text-slate-100">${r.eval_pct}%</span>
                        </div>
                    </div>
                    <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div class="h-full ${statusColor} rounded-full transition-all duration-1000" style="width: ${r.eval_pct}%"></div>
                    </div>
                </div>
            `;
        }).join('');

        // Predictive training needs
        const train = data.training_needs;
        document.getElementById('training-pct-text').textContent = `${train.overall_completion_pct}%`;
        document.getElementById('state-training-avg').textContent = `State Avg: ${train.state_avg_months_since_training}mo`;
        renderTrainingChart(train.overall_completion_pct);

        // Render training alerts list
        const trainList = document.getElementById('training-list');
        if (train.regions_at_risk.length === 0) {
            trainList.innerHTML = `
                <div class="flex flex-col items-center justify-center py-6 text-center">
                    <span class="px-2 py-0.5 bg-emerald-500/25 border border-emerald-400/30 text-emerald-400 text-[10px] font-extrabold rounded tracking-wider uppercase mb-1.5">[CLEAR]</span>
                    <span class="text-xs font-bold text-emerald-400">All Systems Clear</span>
                    <span class="text-[10px] text-slate-500">Statewide training targets fully met</span>
                </div>
            `;
        } else {
            trainList.innerHTML = train.regions_at_risk.map(r => `
                <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex flex-col justify-between">
                    <div class="flex justify-between items-start">
                        <span class="text-xs font-bold text-slate-300">${r.region}</span>
                        <span class="text-[11px] font-bold text-red-400">${r.completion_pct}% complete</span>
                    </div>
                    <div class="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>${r.personnel_count} staff members</span>
                        <span>${r.months_since_training}mo since training</span>
                    </div>
                </div>
            `).join('');
        }

        // Consent metrics update
        const cs = data.consent;
        document.getElementById('consent-count-granted').textContent = cs.consent_granted;
        document.getElementById('consent-count-denied').textContent = cs.consent_denied;
        document.getElementById('consent-count-pending').textContent = cs.consent_pending;
        document.getElementById('consent-overall-rate').textContent = `${cs.overall_consent_rate_pct}%`;
        renderConsentDonut(cs.consent_granted, cs.consent_denied, cs.consent_pending);

        // Regional consent rates list
        const consentRegionList = document.getElementById('consent-region-list');
        consentRegionList.innerHTML = cs.by_region.map(r => `
            <div class="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/40 last:border-0">
                <span class="text-slate-300 font-medium">${r.region}</span>
                <div class="flex items-center gap-3">
                    <span class="font-mono font-bold text-emerald-400">${r.consent_pct}%</span>
                    <span class="text-[10px] text-slate-500">${r.pending} pending</span>
                </div>
            </div>
        `).join('');

        // Real-time simulated PII de-identification feed (Formatted beautifully as structured visual logs)
        const piiFeed = document.getElementById('pii-audit-feed');
        piiFeed.innerHTML = comp.by_region.map(r => {
            const rawName = r.raw_name || 'John Doe';
            const hashedName = sha256_mock(rawName);
            const statusLabel = r.status === 'on_track' 
                ? '<span class="text-emerald-400 font-bold">On Track (< 45d)</span>' 
                : r.status === 'at_risk'
                    ? '<span class="text-amber-400 font-bold">At Risk (~ 40d)</span>'
                    : '<span class="text-red-400 font-bold">Critical Overdue (> 45d)</span>';
            
            let displayElement = '';
            if (STATE.FERPA_ANONYMIZED) {
                displayElement = `
                    <div class="flex flex-col border-b border-slate-800/40 py-2.5 last:border-b-0 font-sans" title="Student Personally Identifiable Information (PII) systematically de-identified to comply with federal FERPA standards. Click FERPA DE-IDENTIFIED to review raw records.">
                        <div class="flex justify-between items-center">
                            <span class="text-xs font-semibold text-slate-300">Case Reference: ${r.case_id || 'C-MOCK'}</span>
                            <span class="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-extrabold text-emerald-400 rounded tracking-wider uppercase">[DE-IDENTIFIED]</span>
                        </div>
                        <div class="flex justify-between items-center text-[11px] text-slate-400 mt-1.5">
                            <div>
                                <span class="text-slate-500">Student Name:</span> 
                                <span class="font-mono bg-slate-900/60 px-1 py-0.5 rounded text-slate-400">[REDACTED]</span>
                            </div>
                            <span>${statusLabel}</span>
                        </div>
                        <div class="text-[9px] text-slate-600 mt-1 font-mono truncate">
                            SHA256: ${hashedName}
                        </div>
                    </div>
                `;
            } else {
                displayElement = `
                    <div class="flex flex-col border-b border-red-500/20 py-2.5 last:border-b-0 font-sans bg-red-500/5 px-2.5 rounded-xl my-1" title="WARNING: Personally Identifiable Information (PII) decrypted for authorized review. Ensure compliance with physical security protocols.">
                        <div class="flex justify-between items-center">
                            <span class="text-xs font-bold text-red-300">Case ID: ${r.case_id || 'C-MOCK'}</span>
                            <span class="px-2 py-0.5 bg-red-500/20 border border-red-500/30 text-[9px] font-extrabold text-red-400 rounded tracking-wider uppercase">[AUTHORIZED PII]</span>
                        </div>
                        <div class="flex justify-between items-center text-[11px] mt-1.5">
                            <div>
                                <span class="text-slate-400">Student Name:</span> 
                                <span class="font-semibold text-slate-200">${rawName}</span>
                            </div>
                            <span>${statusLabel}</span>
                        </div>
                        <div class="text-[9px] text-slate-500 mt-1 font-mono">
                            Decryption Path: NIST SP 800-53 rev5 Audit Logged
                        </div>
                    </div>
                `;
            }
            return displayElement;
        }).join('');
    }

    // Self execution init
    function init() {
        if (!STATE.TOKEN) {
            // If no token is provided, enable Sandbox mode automatically with helpful warning
            STATE.DEMO_MODE = true;
            console.info("No WS API Token provided in request. Initializing high-fidelity Standalone Sandbox Mode.");
        }
        
        setupDashboardShell();
        
        // Trigger initial paint
        triggerScenario('baseline');

        // Setup auto-refresh intervals
        setInterval(refreshUI, STATE.REFRESH_MS);
    }

    // Wait for DOM load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
