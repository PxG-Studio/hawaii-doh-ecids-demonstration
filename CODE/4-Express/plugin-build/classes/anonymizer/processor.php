<?php
namespace local_onsitemonitoring\anonymizer;

defined('MOODLE_INTERNAL') || die();

class processor {

    const SUPPRESSED_FIELDS = [
        'student_name',
        'parent_name',
        'case_id',
        'ssn',
        'medical_record_number',
    ];

    const BLURRED_FIELDS = [
        'exact_dob' => 'year_only',
        'zip_code'  => 'first_3_digits',
        'eval_date' => 'month_only',
        'ifsp_date' => 'month_only',
    ];

    const NOISE_FIELDS = [
        'student_count'     => 0.05,
        'ei_coverage_pct'   => 0.02,
        'eval_timeline_pct' => 0.02,
        'ifsp_timeline_pct' => 0.02,
    ];

    public static function anonymize_record($record, bool $is_public = true) {
        if (!$is_public) {
            return $record;
        }

        $record = (object)(array)$record;
        $anon = clone $record;

        foreach (self::SUPPRESSED_FIELDS as $field) {
            if (property_exists($anon, $field)) {
                $anon->$field = null;
            }
        }

        foreach (self::BLURRED_FIELDS as $field => $method) {
            if (property_exists($anon, $field) && $anon->$field !== null) {
                $anon->$field = self::apply_blur($anon->$field, $method);
            }
        }

        foreach (self::NOISE_FIELDS as $field => $noise_pct) {
            if (property_exists($anon, $field) && $anon->$field !== null) {
                $noise = $anon->$field * $noise_pct * (mt_rand(-100, 100) / 100);
                $anon->$field = round(max(0, min(100, $anon->$field + $noise)), 1);
            }
        }

        if (self::violates_k_anonymity($anon)) {
            return null;
        }

        return $anon;
    }

    public static function anonymize_batch(array $records, bool $is_public = true): array {
        $result = [];
        foreach ($records as $r) {
            $anon = self::anonymize_record($r, $is_public);
            if ($anon !== null) {
                $result[] = $anon;
            }
        }
        return $result;
    }

    private static function violates_k_anonymity($record): bool {
        if (!isset($record->region) || !isset($record->tenant_id)) {
            return false;
        }
        global $DB;
        $tables = ['onsitemonitoring_programs', 'onsitemonitoring_training', 'onsitemonitoring_consent'];
        $total = 0;
        foreach ($tables as $table) {
            $total += $DB->count_records($table, [
                'region' => $record->region,
                'tenant_id' => $record->tenant_id,
            ]);
        }
        return $total < 3;
    }

    private static function apply_blur($value, string $method): string {
        $s = (string)$value;
        switch ($method) {
            case 'year_only':
                return substr($s, 0, 4);
            case 'month_only':
                return substr($s, 0, 7);
            case 'first_3_digits':
                return substr($s, 0, 3);
            default:
                return $s;
        }
    }
}
