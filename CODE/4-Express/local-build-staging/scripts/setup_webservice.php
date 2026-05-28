<?php
define('CLI_SCRIPT', true);
define('NO_OUTPUT_BUFFERING', true);

require('/volume1/web/moodle/config.php');
require_once($CFG->libdir . '/externallib.php');

global $DB, $CFG;

echo "DB configured: " . get_class($DB) . "\n";

$servicename = 'Onsite Monitoring API';
$shortname   = 'onsitemonitoring';

$service = $DB->get_record('external_services', ['shortname' => $shortname]);
if ($service) {
    echo "Service exists (id=$service->id)\n";
} else {
    $service = (object)[
        'name'           => $servicename,
        'shortname'      => $shortname,
        'enabled'        => 1,
        'requiredcapability' => '',
        'restrictedusers' => 0,
        'component'      => 'local_onsitemonitoring',
        'timecreated'    => time(),
        'timemodified'   => time(),
    ];
    $service->id = $DB->insert_record('external_services', $service);
    echo "Created service (id=$service->id)\n";
}

$functions = [
    'local_onsitemonitoring_ingest_data',
    'local_onsitemonitoring_get_compliance',
    'local_onsitemonitoring_get_training_needs',
    'local_onsitemonitoring_get_consent_status',
    'local_onsitemonitoring_get_dashboard',
];

foreach ($functions as $fname) {
    $existing = $DB->get_record('external_services_functions', [
        'externalserviceid' => $service->id,
        'functionname' => $fname,
    ]);
    if ($existing) {
        echo "  Skipping (exists): $fname\n";
    } else {
        $sf = (object)[
            'externalserviceid'   => $service->id,
            'functionname' => $fname,
        ];
        $sf->id = $DB->insert_record('external_services_functions', $sf);
        echo "  Added: $fname\n";
    }
}

$admin = $DB->get_record('user', ['username' => 'admin']);
if (!$admin) {
    $admins = $DB->get_records('user', ['deleted' => 0], 'id ASC', '*', 0, 5);
    foreach ($admins as $u) echo "  user: {$u->id} {$u->username}\n";
    die("No admin user\n");
}

echo "Using admin user: {$admin->id} {$admin->username}\n";

$token = $DB->get_record('external_tokens', [
    'externalserviceid' => $service->id,
    'userid'    => $admin->id,
]);

if ($token) {
    echo "Token exists: {$token->token}\n";
} else {
    $tok = (object)[
        'token'       => bin2hex(random_bytes(32)),
        'userid'      => $admin->id,
        'externalserviceid'   => $service->id,
        'sid'         => md5(uniqid(mt_rand(), true)),
        'tokentype'   => 0,
        'contextid'   => 1,
        'creatorid'   => $admin->id,
        'iprestriction' => '',
        'validuntil'  => 0,
        'timecreated' => time(),
        'timemodified'=> time(),
    ];
    $DB->insert_record('external_tokens', $tok);
    echo "Created token: {$tok->token}\n";
    echo "TOKEN_SECRET={$tok->token}\n";
}

echo "\nDone.\n";
