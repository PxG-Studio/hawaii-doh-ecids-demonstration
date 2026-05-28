<?php
namespace local_onsitemonitoring\external;

defined('MOODLE_INTERNAL') || die();

class get_compliance extends \external_api {

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
        $programs = $DB->get_records('onsitemonitoring_programs', ['tenant_id' => $params['tenant_id']]);

        if (!$is_pii) {
            $programs = \local_onsitemonitoring\anonymizer\processor::anonymize_batch($programs, true);
        }

        $progArr = $programs ? array_values(array_map(function($r) { return (array)$r; }, $programs)) : [];
        $compliance = \local_onsitemonitoring\compliance\calculator::compute($progArr);
        $compliance['anonymized'] = !$is_pii;
        $compliance['timestamp']  = gmdate('c');
        return $compliance;
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'overall_pct'    => new \external_value(PARAM_FLOAT, 'Overall compliance %'),
            'by_region'      => new \external_multiple_structure(
                new \external_single_structure([
                    'region'   => new \external_value(PARAM_TEXT, 'Region'),
                    'eval_pct' => new \external_value(PARAM_FLOAT, 'Eval timeline %'),
                    'ifsp_pct' => new \external_value(PARAM_FLOAT, 'IFSP timeline %'),
                    'status'   => new \external_value(PARAM_TEXT, 'Status'),
                ])
            ),
            'benchmark_eval' => new \external_value(PARAM_INT, '45-day eval target'),
            'benchmark_ifsp' => new \external_value(PARAM_INT, '30-day IFSP target'),
            'anonymized'     => new \external_value(PARAM_BOOL, 'Whether data is anonymized'),
            'timestamp'      => new \external_value(PARAM_TEXT, 'ISO 8601 timestamp'),
        ]);
    }
}
