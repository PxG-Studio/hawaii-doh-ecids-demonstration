<?php
defined('MOODLE_INTERNAL') || die();

$functions = [
    'local_onsitemonitoring_ingest_data' => [
        'classname'   => 'local_onsitemonitoring\external\ingest_data',
        'methodname'  => 'execute',
        'description' => 'Ingest simulated program, training, or consent data.',
        'type'        => 'write',
        'ajax'        => false,
        'capabilities'=> 'local/onsitemonitoring:ingestdata',
    ],
    'local_onsitemonitoring_get_compliance' => [
        'classname'   => 'local_onsitemonitoring\external\get_compliance',
        'methodname'  => 'execute',
        'description' => 'Get compliance metrics (anonymized for public, full for authorized).',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> 'local/onsitemonitoring:viewanonymized',
    ],
    'local_onsitemonitoring_get_training_needs' => [
        'classname'   => 'local_onsitemonitoring\external\get_training_needs',
        'methodname'  => 'execute',
        'description' => 'Get predictive training needs map data.',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> 'local/onsitemonitoring:viewanonymized',
    ],
    'local_onsitemonitoring_get_consent_status' => [
        'classname'   => 'local_onsitemonitoring\external\get_consent_status',
        'methodname'  => 'execute',
        'description' => 'Get parental consent tracking data.',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> 'local/onsitemonitoring:viewanonymized',
    ],
    'local_onsitemonitoring_get_dashboard' => [
        'classname'   => 'local_onsitemonitoring\external\get_dashboard',
        'methodname'  => 'execute',
        'description' => 'Aggregate dashboard data for all three widgets.',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> 'local/onsitemonitoring:viewdashboard',
    ],
];
