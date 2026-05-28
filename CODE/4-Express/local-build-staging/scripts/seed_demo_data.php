<?php
define('CLI_SCRIPT', true);
define('NO_OUTPUT_BUFFERING', true);

require('/volume1/web/moodle/config.php');

global $DB;

$tenant = 'DEMO001';
$now = time();

echo "Seeding data for tenant: $tenant\n";

$programs = [
    (object)[
        'tenant_id' => $tenant,
        'program_name' => 'North Region EI',
        'region' => 'North',
        'student_count' => 85,
        'eval_timeline_pct' => 88,
        'ifsp_timeline_pct' => 92,
        'status' => 'active',
        'timecreated' => $now,
    ],
    (object)[
        'tenant_id' => $tenant,
        'program_name' => 'South Region EI',
        'region' => 'South',
        'student_count' => 120,
        'eval_timeline_pct' => 72,
        'ifsp_timeline_pct' => 68,
        'status' => 'active',
        'timecreated' => $now,
    ],
    (object)[
        'tenant_id' => $tenant,
        'program_name' => 'East Region EI',
        'region' => 'East',
        'student_count' => 60,
        'eval_timeline_pct' => 95,
        'ifsp_timeline_pct' => 90,
        'status' => 'active',
        'timecreated' => $now,
    ],
    (object)[
        'tenant_id' => $tenant,
        'program_name' => 'West Region EI',
        'region' => 'West',
        'student_count' => 95,
        'eval_timeline_pct' => 45,
        'ifsp_timeline_pct' => 52,
        'status' => 'active',
        'timecreated' => $now,
    ],
];

$training = [
    (object)[
        'tenant_id' => $tenant,
        'region' => 'North',
        'personnel_count' => 25,
        'training_complete_pct' => 92,
        'months_since_last_training' => 3,
        'timecreated' => $now,
    ],
    (object)[
        'tenant_id' => $tenant,
        'region' => 'South',
        'personnel_count' => 35,
        'training_complete_pct' => 65,
        'months_since_last_training' => 11,
        'timecreated' => $now,
    ],
    (object)[
        'tenant_id' => $tenant,
        'region' => 'East',
        'personnel_count' => 18,
        'training_complete_pct' => 98,
        'months_since_last_training' => 2,
        'timecreated' => $now,
    ],
    (object)[
        'tenant_id' => $tenant,
        'region' => 'West',
        'personnel_count' => 30,
        'training_complete_pct' => 35,
        'months_since_last_training' => 14,
        'timecreated' => $now,
    ],
];

$consent = [
    (object)[
        'tenant_id' => $tenant,
        'family_id' => 'FAM001',
        'region' => 'North',
        'consent_status' => 'granted',
        'consent_date' => $now - 86400 * 30,
        'timecreated' => $now,
    ],
    (object)[
        'tenant_id' => $tenant,
        'family_id' => 'FAM002',
        'region' => 'North',
        'consent_status' => 'granted',
        'consent_date' => $now - 86400 * 25,
        'timecreated' => $now,
    ],
    (object)[
        'tenant_id' => $tenant,
        'family_id' => 'FAM003',
        'region' => 'South',
        'consent_status' => 'granted',
        'consent_date' => $now - 86400 * 20,
        'timecreated' => $now,
    ],
    (object)[
        'tenant_id' => $tenant,
        'family_id' => 'FAM004',
        'region' => 'South',
        'consent_status' => 'denied',
        'consent_date' => $now - 86400 * 15,
        'timecreated' => $now,
    ],
    (object)[
        'tenant_id' => $tenant,
        'family_id' => 'FAM005',
        'region' => 'East',
        'consent_status' => 'granted',
        'consent_date' => $now - 86400 * 10,
        'timecreated' => $now,
    ],
    (object)[
        'tenant_id' => $tenant,
        'family_id' => 'FAM006',
        'region' => 'East',
        'consent_status' => 'pending',
        'consent_date' => null,
        'timecreated' => $now,
    ],
    (object)[
        'tenant_id' => $tenant,
        'family_id' => 'FAM007',
        'region' => 'West',
        'consent_status' => 'pending',
        'consent_date' => null,
        'timecreated' => $now,
    ],
    (object)[
        'tenant_id' => $tenant,
        'family_id' => 'FAM008',
        'region' => 'West',
        'consent_status' => 'pending',
        'consent_date' => null,
        'timecreated' => $now,
    ],
];

$DB->delete_records('onsitemonitoring_programs', ['tenant_id' => $tenant]);
$DB->delete_records('onsitemonitoring_training', ['tenant_id' => $tenant]);
$DB->delete_records('onsitemonitoring_consent', ['tenant_id' => $tenant]);

$p = 0; foreach ($programs as $r) { $DB->insert_record('onsitemonitoring_programs', $r); $p++; }
$t = 0; foreach ($training as $r) { $DB->insert_record('onsitemonitoring_training', $r); $t++; }
$c = 0; foreach ($consent as $r) { $DB->insert_record('onsitemonitoring_consent', $r); $c++; }

echo "Inserted: {$p} programs, {$t} training records, {$c} consent records\n";

echo "\nDone. Run the following to verify:\n";
echo '  curl -sk --resolve vault.pxg.studio:443:192.168.86.28 "https://vault.pxg.studio/moodle/webservice/rest/server.php?wstoken=d3m0_tok3n_2026_onsitemonitoring_d3m0&wsfunction=local_onsitemonitoring_get_dashboard&moodlewsrestformat=json&tenant_id=DEMO001" | python3 -m json.tool' . "\n";
