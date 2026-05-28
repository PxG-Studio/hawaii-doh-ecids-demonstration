<?php
namespace local_onsitemonitoring\external;

defined('MOODLE_INTERNAL') || die();

class get_consent_status extends \external_api {

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
        $consent = $DB->get_records('onsitemonitoring_consent', ['tenant_id' => $params['tenant_id']]);

        if (!$is_pii) {
            $consent = \local_onsitemonitoring\anonymizer\processor::anonymize_batch($consent, true);
        }

        $consentArr = $consent ? array_values(array_map(function($r) { return (array)$r; }, $consent)) : [];

        usort($consentArr, fn($a, $b) => ($b['timecreated'] ?? 0) - ($a['timecreated'] ?? 0));
        $byFamily = [];
        foreach ($consentArr as $r) {
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
            'anonymized'               => !$is_pii,
            'timestamp'                => gmdate('c'),
        ];
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'overall_consent_rate_pct' => new \external_value(PARAM_FLOAT, 'Overall rate'),
            'total_families'           => new \external_value(PARAM_INT, 'Total'),
            'consent_granted'          => new \external_value(PARAM_INT, 'Granted'),
            'consent_denied'           => new \external_value(PARAM_INT, 'Denied'),
            'consent_pending'          => new \external_value(PARAM_INT, 'Pending'),
            'by_region'               => new \external_multiple_structure(
                new \external_single_structure([
                    'region'      => new \external_value(PARAM_TEXT, 'Region'),
                    'consent_pct' => new \external_value(PARAM_FLOAT, 'Rate'),
                    'pending'     => new \external_value(PARAM_INT, 'Pending'),
                ])
            ),
            'anonymized' => new \external_value(PARAM_BOOL, 'Anonymized'),
            'timestamp'  => new \external_value(PARAM_TEXT, 'Timestamp'),
        ]);
    }
}
