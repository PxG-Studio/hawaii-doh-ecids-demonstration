<?php
namespace local_onsitemonitoring\external;

defined('MOODLE_INTERNAL') || die();

class ingest_data extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'tenant_id' => new \external_value(PARAM_ALPHANUM, 'District tenant UUID'),
            'dataset'   => new \external_value(PARAM_ALPHA, 'Dataset name: programs, training, consent'),
            'records'   => new \external_multiple_structure(
                new \external_single_structure([
                    'region'        => new \external_value(PARAM_TEXT, 'Region name'),
                    'program_name'  => new \external_value(PARAM_TEXT, 'Program name', VALUE_OPTIONAL),
                    'student_count' => new \external_value(PARAM_INT, 'Student count', VALUE_OPTIONAL),
                    'personnel_count' => new \external_value(PARAM_INT, 'Personnel count', VALUE_OPTIONAL),
                    'total_families'  => new \external_value(PARAM_INT, 'Total families', VALUE_OPTIONAL),
                    'eval_timeline_pct'    => new \external_value(PARAM_FLOAT, 'Eval timeline %', VALUE_OPTIONAL),
                    'ifsp_timeline_pct'    => new \external_value(PARAM_FLOAT, 'IFSP timeline %', VALUE_OPTIONAL),
                    'training_complete_pct' => new \external_value(PARAM_FLOAT, 'Training completion %', VALUE_OPTIONAL),
                    'months_since_last_training' => new \external_value(PARAM_INT, 'Months since training', VALUE_OPTIONAL),
                    'consent_rate_pct'     => new \external_value(PARAM_FLOAT, 'Consent rate %', VALUE_OPTIONAL),
                    'family_id'      => new \external_value(PARAM_ALPHANUM, 'Family ID', VALUE_OPTIONAL),
                    'consent_status' => new \external_value(PARAM_ALPHA, 'Consent status: granted, denied, pending', VALUE_OPTIONAL),
                    'consent_date'   => new \external_value(PARAM_INT, 'Consent date unix timestamp', VALUE_OPTIONAL),
                ])
            ),
        ]);
    }

    public static function execute(string $tenant_id, string $dataset, array $records): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'tenant_id' => $tenant_id,
            'dataset'   => $dataset,
            'records'   => $records,
        ]);

        $context = \context_system::instance();
        self::validate_context($context);
        require_capability('local/onsitemonitoring:ingestdata', $context);

        global $DB, $USER;

        $ingested = 0;
        $rejected = 0;
        $errors   = [];
        $now      = time();

        foreach ($params['records'] as $i => $record) {
            try {
                $record['tenant_id'] = $params['tenant_id'];

                switch ($params['dataset']) {
                    case 'programs':
                        $rid = $DB->insert_record('onsitemonitoring_programs', (object)[
                            'tenant_id'       => $params['tenant_id'],
                            'program_name'    => $record['program_name'] ?? '',
                            'region'          => $record['region'],
                            'student_count'   => $record['student_count'] ?? 0,
                            'eval_timeline_pct' => $record['eval_timeline_pct'] ?? 0,
                            'ifsp_timeline_pct' => $record['ifsp_timeline_pct'] ?? 0,
                            'status'          => 'active',
                            'timecreated'     => $now,
                        ]);
                        break;
                    case 'training':
                        $rid = $DB->insert_record('onsitemonitoring_training', (object)[
                            'tenant_id'                 => $params['tenant_id'],
                            'region'                    => $record['region'],
                            'personnel_count'           => $record['personnel_count'] ?? 0,
                            'training_complete_pct'     => $record['training_complete_pct'] ?? 0,
                            'months_since_last_training' => $record['months_since_last_training'] ?? 0,
                            'timecreated'               => $now,
                        ]);
                        break;
                    case 'consent':
                        $rid = $DB->insert_record('onsitemonitoring_consent', (object)[
                            'tenant_id'      => $params['tenant_id'],
                            'region'         => $record['region'],
                            'family_id'      => $record['family_id'] ?? ('FAM-' . uniqid()),
                            'consent_status' => $record['consent_status'] ?? 'pending',
                            'consent_date'   => $record['consent_date'] ?? null,
                            'timecreated'    => $now,
                        ]);
                        break;
                    default:
                        throw new \moodle_exception('invalid_dataset', 'local_onsitemonitoring');
                }
                $ingested++;

                $DB->insert_record('onsitemonitoring_audit_log', (object)[
                    'user_id'       => $USER->id,
                    'action'        => 'ingest',
                    'resource_type' => $params['dataset'],
                    'resource_id'   => $rid,
                    'ip_address'    => getremoteaddr(),
                    'details'       => json_encode($record),
                    'timestamp'     => $now,
                ]);
            } catch (\Exception $e) {
                $rejected++;
                $errors[] = "Record $i: " . $e->getMessage();
            }
        }

        return [
            'status'   => $rejected > 0 ? 'partial' : 'success',
            'ingested' => $ingested,
            'rejected' => $rejected,
            'errors'   => $errors,
        ];
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'status'   => new \external_value(PARAM_ALPHA, 'Status: success, partial, error'),
            'ingested' => new \external_value(PARAM_INT, 'Records ingested'),
            'rejected' => new \external_value(PARAM_INT, 'Records rejected'),
            'errors'   => new \external_multiple_structure(
                new \external_value(PARAM_TEXT, 'Error message')
            ),
        ]);
    }
}
