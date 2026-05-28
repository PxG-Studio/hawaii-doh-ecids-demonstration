<?php
namespace local_onsitemonitoring\external;

defined('MOODLE_INTERNAL') || die();

class get_training_needs extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'tenant_id' => new \external_value(PARAM_ALPHANUM, 'District tenant UUID'),
        ]);
    }

    public static function execute(string $tenant_id): array {
        $params = self::validate_parameters(self::execute_parameters(), ['tenant_id' => $tenant_id]);
        $context = \context_system::instance();
        self::validate_context($context);
        require_capability('local/onsitemonitoring:viewanonymized', $context);

        global $DB;
        $is_pii = has_capability('local/onsitemonitoring:viewpii', $context);
        $training = $DB->get_records('onsitemonitoring_training', ['tenant_id' => $params['tenant_id']]);

        if (!$is_pii) {
            $training = \local_onsitemonitoring\anonymizer\processor::anonymize_batch($training, true);
        }

        $trainingArr = $training ? array_values(array_map(function($r) { return (array)$r; }, $training)) : [];
        $count = max(count($trainingArr), 1);
        $completionSum = array_sum(array_column($trainingArr, 'training_complete_pct')) ?: 0;
        $monthsSum = array_sum(array_column($trainingArr, 'months_since_last_training')) ?: 0;

        $atRisk = array_map(function($t) {
            return [
                'region'               => $t['region'] ?? 'Unknown',
                'completion_pct'       => (float)($t['training_complete_pct'] ?? 0),
                'personnel_count'      => (int)($t['personnel_count'] ?? 0),
                'months_since_training' => (int)($t['months_since_last_training'] ?? 0),
            ];
        }, array_filter($trainingArr, function($t) {
            return ($t['training_complete_pct'] ?? 100) < 50 || ($t['months_since_last_training'] ?? 0) > 12;
        }));

        return [
            'overall_completion_pct'           => round($completionSum / $count, 1),
            'regions_at_risk'                  => array_values($atRisk),
            'state_avg_months_since_training'  => round($monthsSum / $count, 1),
            'anonymized'                       => !$is_pii,
            'timestamp'                        => gmdate('c'),
        ];
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'overall_completion_pct'            => new \external_value(PARAM_FLOAT, 'Completion %'),
            'regions_at_risk'                   => new \external_multiple_structure(
                new \external_single_structure([
                    'region'               => new \external_value(PARAM_TEXT, 'Region'),
                    'completion_pct'       => new \external_value(PARAM_FLOAT, 'Completion %'),
                    'personnel_count'      => new \external_value(PARAM_INT, 'Personnel'),
                    'months_since_training' => new \external_value(PARAM_INT, 'Months'),
                ])
            ),
            'state_avg_months_since_training'   => new \external_value(PARAM_FLOAT, 'State avg'),
            'anonymized'                        => new \external_value(PARAM_BOOL, 'Anonymized'),
            'timestamp'                         => new \external_value(PARAM_TEXT, 'Timestamp'),
        ]);
    }
}
