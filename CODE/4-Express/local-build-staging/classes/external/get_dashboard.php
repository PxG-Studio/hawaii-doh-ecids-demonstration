<?php
namespace local_onsitemonitoring\external;

defined('MOODLE_INTERNAL') || die();

class get_dashboard extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'tenant_id' => new \external_value(PARAM_ALPHANUM, 'District tenant UUID'),
        ]);
    }

    public static function execute(string $tenant_id): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'tenant_id' => $tenant_id,
        ]);

        $context = \context_system::instance();
        self::validate_context($context);
        require_capability('local/onsitemonitoring:viewdashboard', $context);

        global $DB;

        $is_pii_authorized = has_capability('local/onsitemonitoring:viewpii', $context);

        $programs = $DB->get_records('onsitemonitoring_programs', ['tenant_id' => $params['tenant_id']]);
        $training = $DB->get_records('onsitemonitoring_training', ['tenant_id' => $params['tenant_id']]);
        $consent  = $DB->get_records('onsitemonitoring_consent', ['tenant_id' => $params['tenant_id']]);

        if (!$is_pii_authorized) {
            $programs = \local_onsitemonitoring\anonymizer\processor::anonymize_batch($programs, true);
            $training = \local_onsitemonitoring\anonymizer\processor::anonymize_batch($training, true);
            $consent  = \local_onsitemonitoring\anonymizer\processor::anonymize_batch($consent, true);
        }

        $programsArr = $programs ? array_values(array_map(function($r) { return (array)$r; }, $programs)) : [];
        $trainingArr = $training ? array_values(array_map(function($r) { return (array)$r; }, $training)) : [];
        $consentArr  = $consent  ? array_values(array_map(function($r) { return (array)$r; }, $consent)) : [];

        $compliance = \local_onsitemonitoring\compliance\calculator::compute($programsArr);
        $needs      = self::compute_training_needs($trainingArr);
        $consentAgg = self::compute_consent_aggregates($consentArr);

        return [
            'compliance'     => $compliance,
            'training_needs' => $needs,
            'consent'        => $consentAgg,
            'anonymized'     => !$is_pii_authorized,
            'timestamp'      => gmdate('c'),
        ];
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'compliance' => new \external_single_structure([
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
            ]),
            'training_needs' => new \external_single_structure([
                'overall_completion_pct'       => new \external_value(PARAM_FLOAT, 'Training completion %'),
                'regions_at_risk'              => new \external_multiple_structure(
                    new \external_single_structure([
                        'region'               => new \external_value(PARAM_TEXT, 'Region'),
                        'completion_pct'       => new \external_value(PARAM_FLOAT, 'Completion %'),
                        'personnel_count'      => new \external_value(PARAM_INT, 'Personnel count'),
                        'months_since_training' => new \external_value(PARAM_INT, 'Months since training'),
                    ])
                ),
                'state_avg_months_since_training' => new \external_value(PARAM_FLOAT, 'State avg months'),
            ]),
            'consent' => new \external_single_structure([
                'overall_consent_rate_pct' => new \external_value(PARAM_FLOAT, 'Consent rate %'),
                'total_families'           => new \external_value(PARAM_INT, 'Total families'),
                'consent_granted'          => new \external_value(PARAM_INT, 'Consent granted'),
                'consent_denied'           => new \external_value(PARAM_INT, 'Consent denied'),
                'consent_pending'          => new \external_value(PARAM_INT, 'Consent pending'),
                'by_region'               => new \external_multiple_structure(
                    new \external_single_structure([
                        'region'      => new \external_value(PARAM_TEXT, 'Region'),
                        'consent_pct' => new \external_value(PARAM_FLOAT, 'Consent %'),
                        'pending'     => new \external_value(PARAM_INT, 'Pending count'),
                    ])
                ),
            ]),
            'anonymized' => new \external_value(PARAM_BOOL, 'Whether data is anonymized'),
            'timestamp'  => new \external_value(PARAM_TEXT, 'ISO 8601 timestamp'),
        ]);
    }

    private static function compute_training_needs(array $training): array {
        $count = max(count($training), 1);
        $completionSum = array_sum(array_column($training, 'training_complete_pct')) ?: 0;
        $monthsSum = array_sum(array_column($training, 'months_since_last_training')) ?: 0;

        $atRisk = array_values(array_map(function($t) {
            return [
                'region'               => $t['region'] ?? 'Unknown',
                'completion_pct'       => (float)($t['training_complete_pct'] ?? 0),
                'personnel_count'      => (int)($t['personnel_count'] ?? 0),
                'months_since_training' => (int)($t['months_since_last_training'] ?? 0),
            ];
        }, array_filter($training, function($t) {
            return ($t['training_complete_pct'] ?? 100) < 50 || ($t['months_since_last_training'] ?? 0) > 12;
        })));

        return [
            'overall_completion_pct'             => round($completionSum / $count, 1),
            'regions_at_risk'                    => $atRisk,
            'state_avg_months_since_training'    => round($monthsSum / $count, 1),
        ];
    }

    private static function compute_consent_aggregates(array $consent): array {
        $byFamily = [];
        foreach ($consent as $r) {
            $fid = $r['family_id'] ?? null;
            if (!$fid) continue;
            if (!isset($byFamily[$fid])) {
                $byFamily[$fid] = [
                    'family_id' => $fid,
                    'region' => $r['region'] ?? 'Unknown',
                    'consent_status' => $r['consent_status'] ?? 'pending',
                ];
            }
        }

        $total   = count($byFamily);
        $granted = count(array_filter($byFamily, fn($f) => $f['consent_status'] === 'granted'));
        $denied  = count(array_filter($byFamily, fn($f) => $f['consent_status'] === 'denied'));
        $pending = count(array_filter($byFamily, fn($f) => $f['consent_status'] === 'pending'));

        $regionGroups = [];
        foreach ($byFamily as $f) {
            $reg = $f['region'];
            if (!isset($regionGroups[$reg])) {
                $regionGroups[$reg] = ['total' => 0, 'granted' => 0, 'pending' => 0];
            }
            $regionGroups[$reg]['total']++;
            if ($f['consent_status'] === 'granted') $regionGroups[$reg]['granted']++;
            if ($f['consent_status'] === 'pending') $regionGroups[$reg]['pending']++;
        }

        $byRegion = [];
        foreach ($regionGroups as $region => $g) {
            $byRegion[] = [
                'region'      => $region,
                'consent_pct' => $g['total'] > 0 ? round(($g['granted'] / $g['total']) * 100, 1) : 0,
                'pending'     => $g['pending'],
            ];
        }

        return [
            'overall_consent_rate_pct' => $total > 0 ? round(($granted / $total) * 100, 1) : 0,
            'total_families'           => $total,
            'consent_granted'          => $granted,
            'consent_denied'           => $denied,
            'consent_pending'          => $pending,
            'by_region'                => $byRegion,
        ];
    }
}
