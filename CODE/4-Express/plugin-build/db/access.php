<?php
defined('MOODLE_INTERNAL') || die();

$capabilities = [
    'local/onsitemonitoring:viewdashboard' => [
        'captype'      => 'read',
        'contextlevel' => CONTEXT_SYSTEM,
        'archetypes'   => ['manager' => CAP_ALLOW, 'teacher' => CAP_ALLOW],
    ],
    'local/onsitemonitoring:ingestdata' => [
        'captype'      => 'write',
        'contextlevel' => CONTEXT_SYSTEM,
        'archetypes'   => ['manager' => CAP_ALLOW],
    ],
    'local/onsitemonitoring:viewanonymized' => [
        'captype'      => 'read',
        'contextlevel' => CONTEXT_SYSTEM,
        'archetypes'   => ['manager' => CAP_ALLOW, 'teacher' => CAP_ALLOW],
    ],
    'local/onsitemonitoring:viewpii' => [
        'captype'      => 'read',
        'contextlevel' => CONTEXT_SYSTEM,
        'archetypes'   => ['manager' => CAP_ALLOW],
        'riskbitmask'  => RISK_PERSONAL,
    ],
];
