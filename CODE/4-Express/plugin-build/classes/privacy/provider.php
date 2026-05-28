<?php
namespace local_onsitemonitoring\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\approved_userlist;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\userlist;

defined('MOODLE_INTERNAL') || die();

class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\plugin\provider {

    public static function get_metadata(collection $collection): collection {
        $collection->add_database_table(
            'onsitemonitoring_audit_log',
            [
                'user_id'    => 'privacy:metadata:audit_log:user_id',
                'action'     => 'privacy:metadata:audit_log:action',
                'ip_address' => 'privacy:metadata:audit_log:ip_address',
                'timestamp'  => 'privacy:metadata:audit_log:timestamp',
            ],
            'privacy:metadata:audit_log'
        );
        return $collection;
    }

    public static function get_contexts_for_userid(int $userid): contextlist {
        $contextlist = new contextlist();
        $contextlist->add_system_context();
        return $contextlist;
    }

    public static function get_users_in_context(\core_privacy\local\request\userlist $userlist) {
        $context = \context_system::instance();
        if ($userlist->has_user_that_has_capability('local/onsitemonitoring:viewdashboard', $context)) {
            $userlist->add_from_sql('userid', 'SELECT DISTINCT user_id FROM {onsitemonitoring_audit_log}', []);
        }
    }

    public static function export_user_data(approved_contextlist $contextlist) {
        global $DB;
        $userid = $contextlist->get_user()->id;
        $records = $DB->get_records('onsitemonitoring_audit_log', ['user_id' => $userid]);
        if ($records) {
            $context = \context_system::instance();
            \core_privacy\local\request\writer::with_context($context)
                ->export_data([get_string('privacy:metadata:audit_log', 'local_onsitemonitoring')], (object)[
                    'logs' => array_values($records),
                ]);
        }
    }

    public static function delete_data_for_all_users_in_context(\context $context) {
        global $DB;
        if ($context instanceof \context_system) {
            $DB->delete_records('onsitemonitoring_audit_log');
        }
    }

    public static function delete_data_for_user(approved_contextlist $contextlist) {
        global $DB;
        $userid = $contextlist->get_user()->id;
        $DB->delete_records('onsitemonitoring_audit_log', ['user_id' => $userid]);
    }
}
