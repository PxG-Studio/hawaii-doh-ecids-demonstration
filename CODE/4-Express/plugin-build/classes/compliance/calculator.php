<?php
namespace local_onsitemonitoring\compliance;

defined('MOODLE_INTERNAL') || die();

class calculator {

    public static function compute(array $programs): array {
        $count = max(count($programs), 1);

        $evalSum  = array_sum(array_column($programs, 'eval_timeline_pct')) ?: 0;
        $ifspSum  = array_sum(array_column($programs, 'ifsp_timeline_pct')) ?: 0;
        $overall  = round(($evalSum + $ifspSum) / (2 * $count), 1);

        $byRegion = [];
        foreach ($programs as $p) {
            $region = $p['region'] ?? 'Unknown';
            if (!isset($byRegion[$region])) {
                $byRegion[$region] = ['eval_sum' => 0, 'ifsp_sum' => 0, 'count' => 0];
            }
            $byRegion[$region]['eval_sum'] += $p['eval_timeline_pct'] ?? 0;
            $byRegion[$region]['ifsp_sum'] += $p['ifsp_timeline_pct'] ?? 0;
            $byRegion[$region]['count']++;
        }

        $regionData = [];
        foreach ($byRegion as $region => $data) {
            $evalPct = round($data['eval_sum'] / $data['count'], 1);
            $ifspPct = round($data['ifsp_sum'] / $data['count'], 1);
            $avgPct  = ($evalPct + $ifspPct) / 2;
            $status  = $avgPct >= 80 ? 'on_track' : ($avgPct >= 60 ? 'at_risk' : 'critical');
            $regionData[] = [
                'region'   => $region,
                'eval_pct' => $evalPct,
                'ifsp_pct' => $ifspPct,
                'status'   => $status,
            ];
        }

        return [
            'overall_pct'    => $overall,
            'by_region'      => $regionData,
            'benchmark_eval' => 100,
            'benchmark_ifsp' => 100,
        ];
    }
}
