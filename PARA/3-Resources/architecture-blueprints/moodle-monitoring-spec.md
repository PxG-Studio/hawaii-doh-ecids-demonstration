# State Early Intervention Monitoring & Training Management System
## Moodle Modular Extension — Technical Specification Document

**Version:** 1.0  
**Author:** Solutions Architect / EdTech Developer  
**Audience:** Development Team  
**Compliance Framework:** IDEA Part C, FERPA (34 CFR Part 99), NIST SP 800-53 Rev. 5  

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Moodle Infrastructure & Architecture](#2-moodle-infrastructure--architecture)
3. [FERPA & NIST 800-53 Compliance Layer](#3-ferpa--nist-800-53-compliance-layer)
4. [Custom REST API Endpoint Structure](#4-custom-rest-api-endpoint-structure)
5. [Mobile-Responsive Edge Dashboard](#5-mobile-responsive-edge-dashboard)
6. [Data Anonymization Pipeline](#6-data-anonymization-pipeline)
7. [User Interaction Flow — QR / Ngrok Demo](#7-user-interaction-flow--qr--ngrok-demo)
8. [Simulated Open Data Sources](#8-simulated-open-data-sources)
9. [NotebookLM Podcast Script](#9-notebooklm-podcast-script)
10. [Appendix: Complete File Manifest](#10-appendix-complete-file-manifest)

---

## 1. System Overview

### 1.1 Purpose

Build a proof-of-concept modular extension inside Moodle that demonstrates:

- **On-Site Monitoring:** Track statewide early intervention programs against IDEA Part C federal timelines (45-day evaluation mandate, 30-day IFSP development window).
- **Training Management:** Monitor personnel credentialing, track professional development completion, and predict regions falling behind on compliance training.
- **Secure Data Handling:** Demonstrate FERPA-compliant data ingestion, anonymization, and dashboard rendering with zero PII exposure on public-facing interfaces.

### 1.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL USERS                               │
│              (Phone / Tablet via Ngrok tunnel)                      │
└─────────────────────┬───────────────────────────────────────────────┘
                      │ HTTPS (TLS 1.2+)
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NGINX REVERSE PROXY                              │
│              (SSL termination, rate limiting, WAF)                  │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────────┐
│                         MOODLE INSTANCE                             │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  local_onsite     │  │  local_onsite    │  │  tool_dataprivacy│  │
│  │  /db/services.php │  │  /classes/       │  │  (GDPR/FERPA)    │  │
│  │  (REST endpoints) │  │  external/       │  │                  │  │
│  └──────────────────┘  │  (API handlers)   │  └──────────────────┘  │
│                         └──────────────────┘                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Anonymization   │  │  RLS Policies    │  │  Audit Trail     │  │
│  │  Middleware       │  │  (PostgreSQL)    │  │  (AU-2)          │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────────┐
│                    POSTGRESQL DATABASE                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ tenant_data  │  │ anon_cache   │  │ audit_log    │              │
│  │ (RLS)        │  │ (k-anonymity)│  │ (immutable)  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| CMS | Moodle 4.5+ LTS | Core LMS with plugin architecture |
| Plugin Type | `local_onsitemonitoring` | Custom local plugin |
| Database | PostgreSQL 16+ | RLS, JSONB, audit triggers |
| Frontend | Tailwind CSS 3.4 | Mobile-responsive dashboard |
| Charts | Chart.js 4.4 | Compliance tracker, predictive maps |
| Tunneling | Ngrok 3.x | Secure demo access |
| Auth | Moodle token-based | WSToken for API, QR-bound session |
| Container | Docker Compose | Local dev environment |

---

## 2. Moodle Infrastructure & Architecture

### 2.1 Plugin Directory Structure

```
local/onsitemonitoring/
├── version.php
├── settings.php
├── lib.php
├── db/
│   ├── access.php                # Capability definitions
│   ├── services.php              # REST API registrations
│   ├── install.xml               # Database schema
│   ├── upgrade.php               # Schema migrations
│   └── events.php                # Event observers
├── classes/
│   ├── external/
│   │   ├── ingest_data.php       # POST /ingest — receive simulated data
│   │   ├── get_compliance.php    # GET /compliance — query compliance metrics
│   │   ├── get_training_needs.php# GET /training-needs — predictive map data
│   │   ├── get_consent_status.php# GET /consent — parental consent tracking
│   │   └── get_dashboard.php     # GET /dashboard — aggregate dashboard data
│   ├── anonymizer/
│   │   └── processor.php         # PII masking engine
│   ├── compliance/
│   │   └── calculator.php        # Timeline/benchmark computation
│   └── privacy/
│       └── provider.php          # GDPR/FERPA privacy provider
├── dashboard/
│   ├── index.html                # Edge Dashboard entry point
│   ├── app.js                    # Dashboard JavaScript
│   └── style.css                 # Tailwind build output
└── lang/
    └── en/
        └── local_onsitemonitoring.php
```

### 2.2 Database Schema (`db/install.xml`)

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<XMLDB PATH="local/onsitemonitoring/db" VERSION="20260501"
    COMMENT="State early intervention monitoring tables">

  <TABLE NAME="onsite_programs" COMMENT="Program/district records">
    <FIELDS>
      <FIELD NAME="id" TYPE="int" LENGTH="10" NOTNULL="true" SEQUENCE="true"/>
      <FIELD NAME="tenant_id" TYPE="char" LENGTH="36" NOTNULL="true" COMMENT="District UUID"/>
      <FIELD NAME="program_name" TYPE="char" LENGTH="255" NOTNULL="true"/>
      <FIELD NAME="region" TYPE="char" LENGTH="100" NOTNULL="true"/>
      <FIELD NAME="student_count" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="0"/>
      <FIELD NAME="ei_coverage_pct" TYPE="number" LENGTH="5" NOTNULL="true" DEFAULT="0"/>
      <FIELD NAME="eval_timeline_pct" TYPE="number" LENGTH="5" NOTNULL="true" DEFAULT="0" COMMENT="% evaluations completed within 45-day mandate"/>
      <FIELD NAME="ifsp_timeline_pct" TYPE="number" LENGTH="5" NOTNULL="true" DEFAULT="0" COMMENT="% IFSPs completed within 30-day mandate"/>
      <FIELD NAME="consent_rate_pct" TYPE="number" LENGTH="5" NOTNULL="true" DEFAULT="0"/>
      <FIELD NAME="last_updated" TYPE="int" LENGTH="10" NOTNULL="true"/>
    </FIELDS>
    <KEYS>
      <KEY NAME="primary" TYPE="primary" FIELDS="id"/>
    </KEYS>
    <INDEXES>
      <INDEX NAME="idx_tenant_region" UNIQUE="false" FIELDS="tenant_id, region"/>
    </INDEXES>
  </TABLE>

  <TABLE NAME="onsite_training" COMMENT="Personnel training records">
    <FIELDS>
      <FIELD NAME="id" TYPE="int" LENGTH="10" NOTNULL="true" SEQUENCE="true"/>
      <FIELD NAME="tenant_id" TYPE="char" LENGTH="36" NOTNULL="true"/>
      <FIELD NAME="region" TYPE="char" LENGTH="100" NOTNULL="true"/>
      <FIELD NAME="personnel_count" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="0"/>
      <FIELD NAME="credentialed_pct" TYPE="number" LENGTH="5" NOTNULL="true" DEFAULT="0"/>
      <FIELD NAME="training_complete_pct" TYPE="number" LENGTH="5" NOTNULL="true" DEFAULT="0"/>
      <FIELD NAME="months_since_last_training" TYPE="number" LENGTH="5" NOTNULL="true" DEFAULT="0"/>
      <FIELD NAME="last_updated" TYPE="int" LENGTH="10" NOTNULL="true"/>
    </FIELDS>
    <KEYS>
      <KEY NAME="primary" TYPE="primary" FIELDS="id"/>
    </KEYS>
  </TABLE>

  <TABLE NAME="onsite_consent" COMMENT="Parental consent tracking">
    <FIELDS>
      <FIELD NAME="id" TYPE="int" LENGTH="10" NOTNULL="true" SEQUENCE="true"/>
      <FIELD NAME="tenant_id" TYPE="char" LENGTH="36" NOTNULL="true"/>
      <FIELD NAME="region" TYPE="char" LENGTH="100" NOTNULL="true"/>
      <FIELD NAME="total_families" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="0"/>
      <FIELD NAME="consent_granted" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="0"/>
      <FIELD NAME="consent_denied" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="0"/>
      <FIELD NAME="consent_pending" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="0"/>
      <FIELD NAME="contact_method" TYPE="char" LENGTH="50" NOTNULL="true" COMMENT="email/sms/portal"/>
      <FIELD NAME="last_updated" TYPE="int" LENGTH="10" NOTNULL="true"/>
    </FIELDS>
    <KEYS>
      <KEY NAME="primary" TYPE="primary" FIELDS="id"/>
    </KEYS>
  </TABLE>

  <TABLE NAME="onsite_audit_log" COMMENT="Immutable audit trail (AU-2)">
    <FIELDS>
      <FIELD NAME="id" TYPE="int" LENGTH="10" NOTNULL="true" SEQUENCE="true"/>
      <FIELD NAME="user_id" TYPE="int" LENGTH="10" NOTNULL="true"/>
      <FIELD NAME="action" TYPE="char" LENGTH="100" NOTNULL="true"/>
      <FIELD NAME="resource_type" TYPE="char" LENGTH="50" NOTNULL="true"/>
      <FIELD NAME="resource_id" TYPE="int" LENGTH="10" NOTNULL="true"/>
      <FIELD NAME="ip_address" TYPE="char" LENGTH="45" NOTNULL="true"/>
      <FIELD NAME="details" TYPE="text" NOTNULL="false"/>
      <FIELD NAME="timestamp" TYPE="int" LENGTH="10" NOTNULL="true"/>
    </FIELDS>
    <KEYS>
      <KEY NAME="primary" TYPE="primary" FIELDS="id"/>
      <KEY NAME="fk_user" TYPE="foreign" FIELDS="user_id" REFTABLE="user" REFFIELDS="id"/>
    </KEYS>
    <INDEXES>
      <INDEX NAME="idx_audit_action_time" UNIQUE="false" FIELDS="action, timestamp"/>
    </INDEXES>
  </TABLE>
</XMLDB>
```

### 2.3 Capability Definitions (`db/access.php`)

```php
<?php
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
```

---

## 3. FERPA & NIST 800-53 Compliance Layer

### 3.1 Access Control Implementation (AC-2, AC-3)

#### 3.1.1 Role-Based Access Matrix

| Role | Dashboard View | Anonymized Data | PII Data | Ingest API | Audit Log |
|------|---------------|-----------------|----------|------------|-----------|
| State Monitor (Manager) | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| Regional Coordinator | ALLOWED | ALLOWED | DENIED | DENIED | OWN-ONLY |
| Program Staff | ALLOWED | ALLOWED | DENIED | DENIED | OWN-ONLY |
| API Service Account | DENIED | DENIED | DENIED | ALLOWED | SYSTEM |

#### 3.1.2 PostgreSQL Row-Level Security

```sql
-- ============================================================
-- FERPA COMPLIANCE: Row-Level Security Configuration
-- NIST 800-53 Control AC-3 (Access Enforcement)
-- ============================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE onsitemonitoring_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE onsitemonitoring_programs FORCE ROW LEVEL SECURITY;
ALTER TABLE onsitemonitoring_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE onsitemonitoring_training FORCE ROW LEVEL SECURITY;
ALTER TABLE onsitemonitoring_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE onsitemonitoring_consent FORCE ROW LEVEL SECURITY;

-- Create application roles
CREATE ROLE onsitemonitor_app;
CREATE ROLE onsitemonitor_readonly;

-- Policy: Users see only their tenant's rows
CREATE POLICY tenant_isolation_programs ON onsitemonitoring_programs
    FOR ALL
    TO onsitemonitor_app
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Policy: Read-only role (dashboard queries)
CREATE POLICY tenant_readonly_programs ON onsitemonitoring_programs
    FOR SELECT
    TO onsitemonitor_readonly
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- PII mask policy: non-privileged roles get NULL on PII fields
CREATE POLICY pii_mask_programs ON onsitemonitoring_programs
    FOR SELECT
    TO onsitemonitor_readonly
    USING (true)
    -- Application layer enforces PII mask; DB layer falls back
    -- to anonymized view (see Section 3.3)
    -- Values returned NULL for: student_names, exact_dobs, case_ids
    WHEN (current_setting('app.role') = 'readonly') THEN
        WITH (student_name = NULL, exact_dob = NULL, case_id = NULL);

-- Indexes for RLS performance
CREATE INDEX idx_programs_tenant ON onsitemonitoring_programs (tenant_id);
CREATE INDEX idx_training_tenant ON onsitemonitoring_training (tenant_id);
CREATE INDEX idx_consent_tenant ON onsitemonitoring_consent (tenant_id);
```

#### 3.1.3 Moodle Context Validation (in every external API class)

```php
// Every execute() method must validate context + capability
public static function execute(array $params): array {
    // Validate parameter structure
    $params = self::validate_parameters(self::execute_parameters(), $params);

    // Validate system context
    $context = context_system::instance();
    self::validate_context($context);

    // Check specific capability
    require_capability('local/onsitemonitoring:viewanonymized', $context);

    // Set PostgreSQL session context for RLS
    global $DB;
    $DB->execute("SET LOCAL app.current_tenant_id = ?", [$params['tenant_id']]);
    $DB->execute("SET LOCAL app.role = ?", [has_capability('local/onsitemonitoring:viewpii', $context) ? 'admin' : 'readonly']);

    // ... business logic ...
}
```

### 3.2 Encryption Standards (SC-8, SC-13)

| Layer | Standard | Implementation |
|-------|----------|----------------|
| In Transit | TLS 1.2+ (FIPS 140-2) | Nginx termination, Moodle $CFG->sslproxy=true |
| At Rest (DB) | AES-256-CBC | PostgreSQL pgcrypto extension + application-level field encryption |
| At Rest (Backup) | AES-256 | GPG symmetric encryption with separate key management |
| API Tokens | SHA-256 HMAC | Moodle's built-in token service |
| Session Cookies | Secure + SameSite=Strict | PHP session configuration |

### 3.3 Automated Data Anonymization Pipeline

```php
<?php
// local/onsitemonitoring/classes/anonymizer/processor.php

namespace local_onsitemonitoring\anonymizer;

defined('MOODLE_INTERNAL') || die();

class processor {
    /**
     * Anonymize a program data record before dashboard display.
     * Implements k-anonymity (k >= 5) and field-level suppression.
     *
     * NIST 800-53 Control MP-6 (Media Sanitization) applied to data lifecycle.
     * FERPA 34 CFR 99.31(a)(6) — de-identification for studies exception.
     */

    // Fields that are completely removed (suppression)
    const SUPPRESSED_FIELDS = [
        'student_name',
        'parent_name',
        'case_id',
        'ssn',
        'medical_record_number',
    ];

    // Fields that are blurred (reduced precision)
    const BLURRED_FIELDS = [
        'exact_dob'      => 'year_only',     // 2026-05-15 -> 2026
        'zip_code'       => 'first_3_digits', // 97201 -> 972
        'eval_date'      => 'month_only',     // 2026-05-15 -> 2026-05
        'ifsp_date'      => 'month_only',
    ];

    // Fields to which noise is added (differential privacy for aggregates)
    const NOISE_FIELDS = [
        'student_count'     => 0.05,  // ±5% noise
        'ei_coverage_pct'   => 0.02,  // ±2% noise
        'eval_timeline_pct' => 0.02,
        'ifsp_timeline_pct' => 0.02,
    ];

    /**
     * Process a record through the anonymization pipeline.
     * Called by get_dashboard.php and get_compliance.php
     * before data crosses the API boundary.
     */
    public static function anonymize_record(\stdClass $record, bool $is_public = true): \stdClass {
        if (!$is_public) {
            return $record; // Internal use — skip anonymization
        }

        $anon = clone $record;

        // 1. Suppress direct identifiers
        foreach (self::SUPPRESSED_FIELDS as $field) {
            if (property_exists($anon, $field)) {
                $anon->$field = null;
            }
        }

        // 2. Blur quasi-identifiers
        foreach (self::BLURRED_FIELDS as $field => $method) {
            if (property_exists($anon, $field) && $anon->$field !== null) {
                $anon->$field = self::apply_blur($anon->$field, $method);
            }
        }

        // 3. Add noise to aggregate fields
        foreach (self::NOISE_FIELDS as $field => $noise_pct) {
            if (property_exists($anon, $field) && $anon->$field !== null) {
                $noise = $anon->$field * $noise_pct * (mt_rand(-100, 100) / 100);
                $anon->$field = round(max(0, min(100, $anon->$field + $noise)), 1);
            }
        }

        // 4. K-anonymity check: if cell count < 5 in any region grouping,
        //    suppress the record entirely from public view
        if (self::violates_k_anonymity($anon)) {
            return null; // Record excluded from public dashboard
        }

        return $anon;
    }

    /**
     * Check k-anonymity (k >= 5) for region-level aggregations.
     */
    private static function violates_k_anonymity(\stdClass $record): bool {
        global $DB;
        $count = $DB->get_field_sql(
            "SELECT COUNT(*) FROM {onsitemonitoring_programs}
             WHERE region = ? AND tenant_id = ?",
            [$record->region, $record->tenant_id]
        );
        return $count < 5;
    }

    /**
     * Blur a value according to the specified method.
     */
    private static function apply_blur($value, string $method): string {
        switch ($method) {
            case 'year_only':
                return substr($value, 0, 4);
            case 'month_only':
                return substr($value, 0, 7);
            case 'first_3_digits':
                return substr((string)$value, 0, 3);
            default:
                return $value;
        }
    }

    /**
     * Batch anonymize an array of records (for list endpoints).
     */
    public static function anonymize_batch(array $records, bool $is_public = true): array {
        return array_values(array_filter(array_map(
            fn($r) => self::anonymize_record($r, $is_public),
            $records
        )));
    }
}
```

### 3.4 Audit Trail Configuration (AU-2, AU-3)

```sql
-- ============================================================
-- AUDIT TRAIL: Immutable logging for FERPA disclosure tracking
-- NIST 800-53 Control AU-2 (Event Logging)
-- FERPA 34 CFR 99.32 (Record of Disclosure)
-- ============================================================

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO onsitemonitoring_audit_log (
        user_id, action, resource_type, resource_id,
        ip_address, details, timestamp
    ) VALUES (
        COALESCE(current_setting('app.moodle_user_id')::INT, 0),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        current_setting('app.client_ip'),
        jsonb_build_object(
            'old', row_to_json(OLD),
            'new', row_to_json(NEW)
        )::TEXT,
        EXTRACT(EPOCH FROM NOW())::INT
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to all data tables
CREATE TRIGGER audit_programs
    AFTER INSERT OR UPDATE OR DELETE ON onsitemonitoring_programs
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_training
    AFTER INSERT OR UPDATE OR DELETE ON onsitemonitoring_training
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_consent
    AFTER INSERT OR UPDATE OR DELETE ON onsitemonitoring_consent
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Audit log is APPEND-ONLY (no UPDATE, no DELETE grants to app roles)
REVOKE UPDATE, DELETE ON onsitemonitoring_audit_log FROM onsitemonitor_app;
REVOKE UPDATE, DELETE ON onsitemonitoring_audit_log FROM onsitemonitor_readonly;
```

---

## 4. Custom REST API Endpoint Structure

### 4.1 Endpoint Registry (`db/services.php`)

```php
<?php
// local/onsitemonitoring/db/services.php

$functions = [
    'local_onsitemonitoring_ingest_data' => [
        'classname'   => 'local_onsitemonitoring\external\ingest_data',
        'description' => 'Ingest simulated program, training, or consent data.',
        'type'        => 'write',
        'ajax'        => false,
        'capabilities'=> 'local/onsitemonitoring:ingestdata',
    ],
    'local_onsitemonitoring_get_compliance' => [
        'classname'   => 'local_onsitemonitoring\external\get_compliance',
        'description' => 'Get compliance metrics (anonymized for public, full for authorized).',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> 'local/onsitemonitoring:viewanonymized',
    ],
    'local_onsitemonitoring_get_training_needs' => [
        'classname'   => 'local_onsitemonitoring\external\get_training_needs',
        'description' => 'Get predictive training needs map data.',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> 'local/onsitemonitoring:viewanonymized',
    ],
    'local_onsitemonitoring_get_consent_status' => [
        'classname'   => 'local_onsitemonitoring\external\get_consent_status',
        'description' => 'Get parental consent tracking data.',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> 'local/onsitemonitoring:viewanonymized',
    ],
    'local_onsitemonitoring_get_dashboard' => [
        'classname'   => 'local_onsitemonitoring\external\get_dashboard',
        'description' => 'Aggregate dashboard data for all three widgets.',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities'=> 'local/onsitemonitoring:viewdashboard',
    ],
];
```

### 4.2 Endpoint Specifications

#### `local_onsitemonitoring_ingest_data`
**Method:** POST  
**Auth:** WSToken (Service Account)  

**Request Body:**
```json
{
  "tenant_id": "a1b2c3d4-...",
  "dataset": "programs",
  "records": [
    {
      "region": "Region 5 - Metro East",
      "program_name": "Eastside EI Collaborative",
      "student_count": 247,
      "ei_coverage_pct": 88.5,
      "eval_timeline_pct": 72.3,
      "ifsp_timeline_pct": 65.1,
      "consent_rate_pct": 91.2
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "ingested": 1,
  "rejected": 0,
  "errors": []
}
```

#### `local_onsitemonitoring_get_dashboard`
**Method:** GET  
**Auth:** WSToken (User or Session)

**Response:**
```json
{
  "compliance": {
    "overall_pct": 68.4,
    "by_region": [
      {"region": "Region 1", "eval_pct": 82.1, "ifsp_pct": 74.3, "status": "at_risk"},
      {"region": "Region 2", "eval_pct": 45.2, "ifsp_pct": 38.7, "status": "critical"}
    ],
    "benchmark_eval": 100,
    "benchmark_ifsp": 100,
    "last_updated": "2026-05-27T14:30:00Z"
  },
  "training_needs": {
    "overall_completion_pct": 62.1,
    "regions_at_risk": [
      {"region": "Region 2 - Rural North", "completion_pct": 31.5, "personnel_count": 89, "months_since_training": 14},
      {"region": "Region 4 - West County", "completion_pct": 44.2, "personnel_count": 156, "months_since_training": 11}
    ],
    "state_avg_months_since_training": 8.3
  },
  "consent": {
    "overall_consent_rate_pct": 87.3,
    "total_families": 12500,
    "consent_granted": 10912,
    "consent_denied": 875,
    "consent_pending": 713,
    "by_region": [
      {"region": "Region 1", "consent_pct": 93.1, "pending": 45},
      {"region": "Region 2", "consent_pct": 78.4, "pending": 312}
    ],
    "contact_methods": {
      "email_pct": 52.3,
      "sms_pct": 31.2,
      "portal_pct": 16.5
    }
  },
  "anonymized": true,
  "timestamp": "2026-05-27T14:30:00Z"
}
```

### 4.3 External API Class Template

```php
<?php
// local/onsitemonitoring/classes/external/get_dashboard.php

namespace local_onsitemonitoring\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;

defined('MOODLE_INTERNAL') || die();

class get_dashboard extends external_api {

    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'tenant_id' => new external_value(PARAM_ALPHANUM, 'District tenant UUID'),
        ]);
    }

    public static function execute(string $tenant_id): array {
        // Validate params
        $params = self::validate_parameters(self::execute_parameters(), [
            'tenant_id' => $tenant_id,
        ]);

        // Validate context + capability
        $context = context_system::instance();
        self::validate_context($context);
        require_capability('local/onsitemonitoring:viewdashboard', $context);

        // Set RLS session context
        global $DB;
        $DB->execute("SET LOCAL app.current_tenant_id = ?", [$params['tenant_id']]);
        $is_pii_authorized = has_capability('local/onsitemonitoring:viewpii', $context);
        $DB->execute("SET LOCAL app.role = ?", [$is_pii_authorized ? 'admin' : 'readonly']);

        // Fetch data from all three tables
        $programs = $DB->get_records('onsitemonitoring_programs', ['tenant_id' => $params['tenant_id']]);
        $training = $DB->get_records('onsitemonitoring_training', ['tenant_id' => $params['tenant_id']]);
        $consent  = $DB->get_records('onsitemonitoring_consent', ['tenant_id' => $params['tenant_id']]);

        // Anonymize if user is not PII-authorized
        if (!$is_pii_authorized) {
            $programs = \local_onsitemonitoring\anonymizer\processor::anonymize_batch($programs, true);
            $training = \local_onsitemonitoring\anonymizer\processor::anonymize_batch($training, true);
            $consent  = \local_onsitemonitoring\anonymizer\processor::anonymize_batch($consent, true);
        }

        // Compute compliance, training needs, consent aggregates
        $compliance  = \local_onsitemonitoring\compliance\calculator::compute($programs);
        $needs       = self::compute_training_needs($training);
        $consent_agg = self::compute_consent_aggregates($consent);

        return [
            'compliance'      => $compliance,
            'training_needs'  => $needs,
            'consent'         => $consent_agg,
            'anonymized'      => !$is_pii_authorized,
            'timestamp'       => gmdate('c'),
        ];
    }

    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'compliance'     => new external_single_structure([...]),
            'training_needs' => new external_single_structure([...]),
            'consent'        => new external_single_structure([...]),
            'anonymized'     => new external_value(PARAM_BOOL, 'Whether data is anonymized'),
            'timestamp'      => new external_value(PARAM_TEXT, 'ISO 8601 timestamp'),
        ]);
    }

    private static function compute_training_needs(array $training): array {
        // Predictive logic: flag regions where:
        //   training_complete_pct < 50% OR months_since_last_training > 12
        $at_risk = array_filter($training, fn($t) =>
            $t->training_complete_pct < 50 || $t->months_since_last_training > 12
        );
        return [
            'overall_completion_pct'     => round(array_sum(array_column($training, 'training_complete_pct')) / max(count($training), 1), 1),
            'regions_at_risk'            => array_values($at_risk),
            'state_avg_months_since_training' => round(array_sum(array_column($training, 'months_since_last_training')) / max(count($training), 1), 1),
        ];
    }

    private static function compute_consent_aggregates(array $consent): array {
        $total   = array_sum(array_column($consent, 'total_families'));
        $granted = array_sum(array_column($consent, 'consent_granted'));
        $denied  = array_sum(array_column($consent, 'consent_denied'));
        $pending = array_sum(array_column($consent, 'consent_pending'));
        return [
            'overall_consent_rate_pct' => $total > 0 ? round(($granted / $total) * 100, 1) : 0,
            'total_families'           => $total,
            'consent_granted'          => $granted,
            'consent_denied'           => $denied,
            'consent_pending'          => $pending,
            'by_region'                => array_values($consent),
        ];
    }
}
```

---

## 5. Mobile-Responsive Edge Dashboard

### 5.1 Dashboard HTML (`dashboard/index.html`)

`PARA/1-Projects/opencode-core/dashboard/index.html` — rendered at:
```
https://moodle-instance.local/webservice/restful/server.php/local_onsitemonitoring_get_dashboard
```

This is a **single-page application** optimized for mobile viewports (320px–768px) using Tailwind CSS 3.4 and Chart.js 4.4.

### 5.2 Dashboard JavaScript (`dashboard/app.js`)

```javascript
/**
 * Edge Dashboard — State Early Intervention Monitoring
 * FERPA-compliant, NIST 800-53 AC-3 enforced
 *
 * Features:
 *   a) Real-time compliance tracker (Chart.js gauge + table)
 *   b) Predictive training needs map (color-coded region cards)
 *   c) Parental communication/consent tracking (stacked bar + breakdown)
 */

const STATE = {
    API_TOKEN: new URLSearchParams(window.location.search).get('token'),
    MOODLE_URL: 'https://moodle-instance.local',
    WIDGET_REFRESH_MS: 30000, // 30-second auto-refresh
};

// ─── SECURITY: Validate session token ——————————————————————
async function validateToken() {
    if (!STATE.API_TOKEN) {
        document.getElementById('app').innerHTML = `
            <div class="flex items-center justify-center min-h-screen bg-red-50 p-6">
                <div class="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
                    <div class="text-red-500 text-5xl mb-4">🔒</div>
                    <h2 class="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p class="text-gray-600 text-sm">No valid session token found.
                    Please scan the QR code again or contact your administrator.</p>
                </div>
            </div>`;
        return false;
    }
    return true;
}

// ─── FETCH: Anonymized dashboard data via Moodle REST API ——
async function fetchDashboard() {
    const url = `${STATE.MOODLE_URL}/webservice/rest/server.php`
        + `?wstoken=${STATE.API_TOKEN}`
        + `&wsfunction=local_onsitemonitoring_get_dashboard`
        + `&tenant_id=demo-state-tenant`
        + `&moodlewsrestformat=json`;

    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!resp.ok) throw new Error(`API Error: ${resp.status}`);

    const data = await resp.json();

    // FERPA banner
    document.getElementById('ferpa-banner').textContent =
        data.anonymized
            ? '✅ Data is anonymized. No PII is displayed. (FERPA 34 CFR §99.31)'
            : '⚠️ Authorized view — PII visible.';

    return data;
}

// ─── WIDGET A: Real-Time Compliance Tracker ———————————————
function renderComplianceTracker(data) {
    const el = document.getElementById('widget-compliance');
    const overall = data.compliance.overall_pct;
    const statusColor = overall >= 80 ? 'text-green-600' : overall >= 60 ? 'text-amber-500' : 'text-red-500';

    el.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    📋 Compliance Tracker
                </h3>
                <span class="text-xs text-gray-400">IDEA Part C</span>
            </div>

            <div class="flex items-baseline justify-center mb-4">
                <span class="text-4xl font-bold ${statusColor}">${overall}%</span>
                <span class="text-sm text-gray-500 ml-2">statewide</span>
            </div>

            <div class="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div class="h-3 rounded-full transition-all duration-1000"
                     style="width:${overall}%; background: ${overall >= 80 ? '#16a34a' : overall >= 60 ? '#f59e0b' : '#dc2626'}">
                </div>
            </div>

            <div class="space-y-2">
                ${data.compliance.by_region.map(r => `
                    <div class="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                        <span class="text-gray-600 truncate max-w-[140px]">${r.region}</span>
                        <div class="flex items-center gap-2">
                            <span class="font-mono text-xs ${r.eval_pct >= 80 ? 'text-green-600' : 'text-amber-500'}">
                                ${r.eval_pct}%
                            </span>
                            <span class="inline-block w-2 h-2 rounded-full
                                ${r.status === 'critical' ? 'bg-red-500' : r.status === 'at_risk' ? 'bg-amber-400' : 'bg-green-500'}">
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="mt-3 pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                <span>45-day eval: ${data.compliance.benchmark_eval}% target</span>
                <span>Updated ${new Date(data.timestamp).toLocaleTimeString()}</span>
            </div>
        </div>
    `;
}

// ─── WIDGET B: Predictive Training Needs Map ——————————————
function renderTrainingNeeds(data) {
    const el = document.getElementById('widget-training');
    const atRisk = data.training_needs.regions_at_risk;

    el.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    🎓 Training Needs Map
                </h3>
                <span class="text-xs text-gray-400">Predictive</span>
            </div>

            <div class="flex items-baseline justify-center mb-2">
                <span class="text-4xl font-bold ${data.training_needs.overall_completion_pct >= 70 ? 'text-green-600' : 'text-amber-500'}">
                    ${data.training_needs.overall_completion_pct}%
                </span>
                <span class="text-sm text-gray-500 ml-2">completed</span>
            </div>
            <p class="text-xs text-gray-400 text-center mb-4">
                State avg: ${data.training_needs.state_avg_months_since_training} months since last training
            </p>

            ${atRisk.length === 0 ? `
                <div class="text-center py-6 text-green-600 text-sm">
                    ✅ All regions up-to-date on training requirements.
                </div>
            ` : `
                <div class="space-y-2">
                    ${atRisk.map(r => `
                        <div class="bg-red-50 border border-red-100 rounded-lg p-3">
                            <div class="flex justify-between items-start">
                                <span class="text-sm font-medium text-gray-800">${r.region}</span>
                                <span class="text-xs font-bold ${r.completion_pct < 40 ? 'text-red-600' : 'text-amber-600'}">
                                    ${r.completion_pct}%
                                </span>
                            </div>
                            <div class="flex justify-between text-xs text-gray-500 mt-1">
                                <span>${r.personnel_count} personnel</span>
                                <span>${r.months_since_training} months since training</span>
                            </div>
                            <div class="w-full bg-red-200 rounded-full h-2 mt-2">
                                <div class="h-2 rounded-full bg-red-500" style="width:${r.completion_pct}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
}

// ─── WIDGET C: Parental Communication / Consent Tracking ——
function renderConsentWidget(data) {
    const el = document.getElementById('widget-consent');
    const c = data.consent;

    el.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    📝 Consent Tracking
                </h3>
                <span class="text-xs text-gray-400">FERPA §99.30</span>
            </div>

            <div class="grid grid-cols-3 gap-2 mb-4">
                <div class="text-center bg-green-50 rounded-lg p-2">
                    <div class="text-2xl font-bold text-green-600">${c.consent_granted}</div>
                    <div class="text-xs text-gray-500">Granted</div>
                </div>
                <div class="text-center bg-red-50 rounded-lg p-2">
                    <div class="text-2xl font-bold text-red-500">${c.consent_denied}</div>
                    <div class="text-xs text-gray-500">Denied</div>
                </div>
                <div class="text-center bg-amber-50 rounded-lg p-2">
                    <div class="text-2xl font-bold text-amber-500">${c.consent_pending}</div>
                    <div class="text-xs text-gray-500">Pending</div>
                </div>
            </div>

            <div class="flex items-center justify-between text-sm mb-3">
                <span class="text-gray-600">Overall consent rate</span>
                <span class="text-lg font-bold text-gray-800">${c.overall_consent_rate_pct}%</span>
            </div>

            <div class="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div class="h-3 rounded-full bg-green-500" style="width:${c.overall_consent_rate_pct}%"></div>
            </div>

            ${c.by_region.slice(0, 3).map(r => `
                <div class="flex items-center justify-between text-sm py-1 border-b border-gray-50">
                    <span class="text-gray-600 truncate max-w-[140px]">${r.region}</span>
                    <div class="flex items-center gap-2">
                        <span class="font-mono text-xs text-green-600">${r.consent_pct}%</span>
                        <span class="text-xs text-gray-400">${r.pending} pending</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ─── INIT: Wire up the dashboard ———————————————————————————
async function initDashboard() {
    if (!await validateToken()) return;

    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <div class="bg-indigo-700 text-white p-4 sticky top-0 z-10 shadow-md">
                <div class="flex items-center justify-between max-w-lg mx-auto">
                    <div>
                        <h1 class="text-lg font-bold">State EI Monitor</h1>
                        <p class="text-xs text-indigo-200 opacity-80">IDEA Part C · Demo Instance</p>
                    </div>
                    <div id="ferpa-banner" class="text-xs bg-indigo-800 px-2 py-1 rounded">
                        Loading...
                    </div>
                </div>
            </div>

            <div class="max-w-lg mx-auto p-4">
                <div id="widget-compliance"></div>
                <div id="widget-training"></div>
                <div id="widget-consent"></div>

                <div class="text-center text-xs text-gray-400 py-4">
                    <p>Secured by Moodle REST API · NIST 800-53 AC-3</p>
                    <p>Auto-refreshes every 30s</p>
                </div>
            </div>
        </div>
    `;

    async function refresh() {
        try {
            const data = await fetchDashboard();
            renderComplianceTracker(data);
            renderTrainingNeeds(data);
            renderConsentWidget(data);
        } catch (err) {
            document.getElementById('widget-compliance').innerHTML =
                `<div class="bg-red-50 text-red-600 p-4 rounded-lg text-sm text-center">
                    Connection error: ${err.message}
                </div>`;
        }
    }

    await refresh();
    setInterval(refresh, STATE.WIDGET_REFRESH_MS);
}

document.addEventListener('DOMContentLoaded', initDashboard);
```

### 5.3 Dashboard HTML Entry Point (`dashboard/index.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>State EI Monitor — Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
    <script src="app.js" defer></script>
    <style>
        * { -webkit-tap-highlight-color: transparent; }
        body { overscroll-behavior: none; }
        .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }
    </style>
</head>
<body>
    <div id="app">
        <div class="flex items-center justify-center min-h-screen bg-indigo-50">
            <div class="text-center">
                <div class="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p class="text-indigo-600 text-sm font-medium">Establishing secure session...</p>
            </div>
        </div>
    </div>
</body>
</html>
```

---

## 6. Data Anonymization Pipeline

### 6.1 Pipeline Flow

```
RAW INGEST (REST API)
    │
    ▼
┌─────────────────────────────────────┐
│ raw_data table (write-only)         │
│ Fields: name, DOB, case_id, ...     │
│ Access: ingest service account only │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ ANONYMIZER PROCESSOR                │
│ • Suppress direct identifiers       │
│ • Blur quasi-identifiers            │
│ • Add noise to aggregate vals       │
│ • Check k-anonymity (k >= 5)       │
└─────────────────────────────────────┘
    │
    ├──→ anon_cache table (public dashboard)
    │       Fields: year_only, region_3digit, noise_vals
    │       Access: readonly role
    │
    └──→ audit_log table (immutable, FERPA 99.32)
```

### 6.2 Configuration Script for Cron-Based Anonymization

```bash
#!/bin/bash
# local/onsitemonitoring/scripts/anonymize_cron.sh
# Run every 15 minutes via Moodle cron or systemd timer

MOODLE_DIR="/var/www/moodle"
SCRIPT_DIR="${MOODLE_DIR}/local/onsitemonitoring/scripts"
LOG_FILE="${MOODLE_DIR}/local/onsitemonitoring/logs/anonymize.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting anonymization cycle..." >> "${LOG_FILE}"

# Execute anonymization via Moodle CLI
/usr/bin/php "${MOODLE_DIR}/admin/cli/run_anonymization.php" \
    --plugin="local_onsitemonitoring" \
    --batch-size=500 \
    --k-threshold=5 \
    2>&1 >> "${LOG_FILE}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Anonymization cycle complete." >> "${LOG_FILE}"
```

---

## 7. User Interaction Flow — QR / Ngrok Demo

### 7.1 Local Development Setup

```bash
#!/bin/bash
# scripts/setup-demo.sh — One-shot demo environment bootstrap

echo "=== State EI Monitoring Demo :: Environment Setup ==="

# 1. Start Moodle Docker stack
echo "[1/4] Starting Moodle + PostgreSQL containers..."
docker compose -f docker/docker-compose.yml up -d

# 2. Install the plugin
echo "[2/4] Installing local_onsitemonitoring plugin..."
docker exec moodle php admin/cli/plugin_install.php \
    --component=local_onsitemonitoring

# 3. Seed simulated data
echo "[3/4] Seeding demo dataset..."
docker exec moodle php local/onsitemonitoring/scripts/seed_demo_data.php

# 4. Start Ngrok tunnel
echo "[4/4] Starting Ngrok secure tunnel to Moodle..."
nohup ngrok http 8080 --host-header=rewrite \
    --domain=state-ei-demo.ngrok-free.app \
    --log=logs/ngrok.log &

NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')
echo ""
echo "=== DEMO READY ==="
echo "Dashboard URL: ${NGROK_URL}/local/onsitemonitoring/dashboard/index.html"
echo ""

# Generate QR code
echo "Generating QR code for mobile access..."
qrencode -o docs/demo-qr.png "${NGROK_URL}/local/onsitemonitoring/dashboard/index.html?token=DEMO_TOKEN_2026"
echo "QR code saved to: docs/demo-qr.png"
echo "Show this QR code to your interviewer."
```

### 7.2 QR Code Generation (Alternative — No CLI Tool)

Generate a QR code for the demo URL using an online service or `qrencode`:

```bash
# Install: brew install qrencode (macOS) or apt install qrencode (Linux)
qrencode -s 8 -o docs/demo-qr.png \
    "https://state-ei-demo.ngrok-free.app/local/onsitemonitoring/dashboard/index.html?token=DEMO_TOKEN_2026"
```

Or use Python:
```python
# scripts/generate_qr.py
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer

url = "https://state-ei-demo.ngrok-free.app/local/onsitemonitoring/dashboard/index.html?token=DEMO_TOKEN_2026"

qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H)
qr.add_data(url)

img = qr.make_image(
    image_factory=StyledPilImage,
    module_drawer=RoundedModuleDrawer(),
    fill_color="indigo",
    back_color="white"
)
img.save("docs/demo-qr.png")
print(f"QR code saved. URL: {url}")
```

### 7.3 Session Token Security Flow

```
1. Interviewer scans QR code
           │
           ▼
2. Phone hits Ngrok tunnel → Nginx → Moodle
           │
           ▼
3. Moodle validates session token from URL param
   - Token: DEMO_TOKEN_2026 (pre-generated, time-limited)
   - Validates against moodle_user token table
   - Maps to 'demo_interviewer' role (CAP_ALLOW: viewdashboard + viewanonymized)
           │
           ▼
4. Dashboard JS fetches /webservice/rest/server.php
   - wstoken=DEMO_TOKEN_2026
   - wsfunction=local_onsitemonitoring_get_dashboard
   - tenant_id=demo-state-tenant
           │
           ▼
5. Moodle REST handler:
   - Validates token and capability
   - Sets PostgreSQL session context (tenant_id, role=readonly)
   - Queries anon_cache tables (PII fields = NULL)
   - Returns anonymized JSON response
           │
           ▼
6. Dashboard renders on phone — ZERO PII exposed
   - "Anonymized" banner visible at top
   - All student names, exact DOBs, case IDs = NULL
```

---

## 8. Simulated Open Data Sources

### 8.1 Data Generation Script

```php
<?php
// local/onsitemonitoring/scripts/seed_demo_data.php

defined('MOODLE_INTERNAL') || die();

/**
 * Seed demo data using realistic but synthetic values.
 * Inspired by:
 *   - EDFacts (https://www2.ed.gov/about/inits/ed/edfacts)
 *   - OSEP Fast Facts (https://sites.ed.gov/osep)
 *   - NCES Common Core of Data (https://nces.ed.gov/ccd)
 */

$regions = [
    ['name' => 'Region 1 - Metro Central',     'programs' => 12, 'students' => 3840],
    ['name' => 'Region 2 - Rural North',        'programs' => 8,  'students' => 1240],
    ['name' => 'Region 3 - Coastal South',      'programs' => 15, 'students' => 4210],
    ['name' => 'Region 4 - West County',        'programs' => 10, 'students' => 2150],
    ['name' => 'Region 5 - Metro East',         'programs' => 14, 'students' => 3620],
    ['name' => 'Region 6 - Mountain Corridor',  'programs' => 6,  'students' => 890],
];

$program_names = [
    'Early Start Collaborative',
    'Family Resource Network',
    'Infant Toddler Connection',
    'Community EI Partnership',
    'Developmental Supports Initiative',
    'Family-Centered Intervention Program',
];

echo "Seeding demo data...\n";

foreach ($regions as $region) {
    for ($p = 0; $p < $region['programs']; $p++) {
        $students_per_program = round($region['students'] / $region['programs'] * (0.8 + mt_rand(0, 40) / 100));

        $eval_pct   = round(mt_rand(300, 950) / 10, 1);
        $ifsp_pct   = round(mt_rand(250, 920) / 10, 1);
        $consent_pct = round(mt_rand(650, 970) / 10, 1);
        $coverage_pct = round(mt_rand(500, 980) / 10, 1);

        $record = (object)[
            'tenant_id'        => 'demo-state-tenant',
            'program_name'     => $program_names[array_rand($program_names)] . ' - ' . chr(65 + $p),
            'region'           => $region['name'],
            'student_count'    => $students_per_program,
            'ei_coverage_pct'  => $coverage_pct,
            'eval_timeline_pct' => $eval_pct,
            'ifsp_timeline_pct' => $ifsp_pct,
            'consent_rate_pct'  => $consent_pct,
            'last_updated'     => time(),
        ];

        $DB->insert_record('onsitemonitoring_programs', $record);
    }

    // Training records
    $training = (object)[
        'tenant_id'                  => 'demo-state-tenant',
        'region'                     => $region['name'],
        'personnel_count'            => round($region['students'] / 8),
        'credentialed_pct'           => round(mt_rand(400, 950) / 10, 1),
        'training_complete_pct'      => round(mt_rand(250, 950) / 10, 1),
        'months_since_last_training'  => round(mt_rand(1, 24)),
        'last_updated'               => time(),
    ];
    $DB->insert_record('onsitemonitoring_training', $training);

    // Consent records
    $total_fams = round($region['students'] * 0.85);
    $granted    = round($total_fams * (mt_rand(650, 950) / 1000));
    $denied     = round($total_fams * (mt_rand(20, 150) / 1000));
    $pending    = $total_fams - $granted - $denied;

    $consent = (object)[
        'tenant_id'       => 'demo-state-tenant',
        'region'          => $region['name'],
        'total_families'  => $total_fams,
        'consent_granted' => $granted,
        'consent_denied'  => $denied,
        'consent_pending' => max(0, $pending),
        'contact_method'  => ['email', 'sms', 'portal'][array_rand(['email', 'sms', 'portal'])],
        'last_updated'    => time(),
    ];
    $DB->insert_record('onsitemonitoring_consent', $consent);
}

echo "Done. Seeded " . count($regions) . " regions with demo data.\n";
```

### 8.2 Sample Data Characteristics

| Metric | Range | Source Inspiration |
|--------|-------|-------------------|
| 45-day eval compliance | 30%–95% | OSEP Part C Indicator 1 |
| 30-day IFSP compliance | 25%–92% | OSEP Part C Indicator 7 |
| EI coverage rate | 50%–98% | EDFacts Child Count |
| Training completion | 25%–95% | State professional dev records |
| Consent rate | 65%–97% | Program-level enrollment data |
| Personnel-to-child ratio | 1:8 | DEC Recommended Practices |

---

## 9. NotebookLM Podcast Script

Generate a 90-second podcast segment using Google NotebookLM or similar AI audio tool. Feed the following script as the episode content:

```text
---
title: "State EI Monitoring Demo — Moodle Training Module Walkthrough"
duration: 90 seconds
format: Two-host conversational podcast
---

HOST 1: Welcome back to the EdTech Leaders Briefing. Today we're looking at something genuinely practical — a state-level early intervention monitoring system built right inside Moodle.

HOST 2: And the best part? It's designed for people who aren't software engineers. We're talking about regional coordinators who just want to know: "Is my district meeting the 45-day evaluation timeline?" without wrestling with spreadsheets.

HOST 1: Exactly. The system we're demonstrating ingests data through a secure REST API — think of it as a digital dropbox for compliance data. A coordinator uploads their student counts, evaluation dates, and training completions.

HOST 2: And here's where it gets interesting. The data flows through an automated anonymization pipeline. Names, exact birthdates, case IDs — all stripped before anything hits a dashboard. Full FERPA compliance, no manual effort.

HOST 1: Speaking of the dashboard — it's mobile-first. So a program director in a rural district can pull out their phone, scan a QR code, and see their region's compliance status in real time.

HOST 2: The compliance tracker shows you exactly which programs are falling behind on federal timelines. The training needs map predicts which regions are at risk based on completion rates and months since last training.

HOST 1: And every single data point respects the anonymity controls. You see trends, not individual student names. That's the NIST 800-53 security framework in action — access control, encryption, audit logging.

HOST 2: So for a state administrator, this means: less time chasing paper, more time intervening where it matters. The system flags the problems, and you go solve them.

HOST 1: That's the power of taking a platform educators already use — Moodle — and extending it with purpose-built compliance modules. No rip-and-replace. No new tool to learn.

HOST 2: It's the difference between hoping everyone is on track — and actually knowing.

HOST 1: Couldn't have said it better. Thanks for listening to the EdTech Leaders Briefing.
```

**Instructions:** Paste this script into NotebookLM (notebooklm.google.com) or your preferred AI audio generator. Select "Conversation" / "Deep Dive" mode. Use the generated audio as your 2-minute demo segment in Phase 3 of the interview presentation.

---

## 10. Appendix: Complete File Manifest

### Moodle Plugin (`local/onsitemonitoring/`)

```
local/onsitemonitoring/
├── version.php
├── settings.php
├── lib.php
├── db/
│   ├── access.php
│   ├── services.php
│   ├── install.xml
│   ├── upgrade.php
│   └── events.php
├── classes/
│   ├── external/
│   │   ├── ingest_data.php
│   │   ├── get_compliance.php
│   │   ├── get_training_needs.php
│   │   ├── get_consent_status.php
│   │   └── get_dashboard.php
│   ├── anonymizer/
│   │   └── processor.php
│   ├── compliance/
│   │   └── calculator.php
│   └── privacy/
│       └── provider.php
├── dashboard/
│   ├── index.html
│   ├── app.js
│   └── style.css
├── scripts/
│   ├── seed_demo_data.php
│   ├── anonymize_cron.sh
│   └── generate_qr.py
├── lang/
│   └── en/
│       └── local_onsitemonitoring.php
└── docs/
    ├── demo-qr.png
    └── demo-script.md
```

### Database Migration Sequence

```
version.php:   $plugin->version = 2026050100
               $plugin->requires = 2024100100 (Moodle 4.5)
               $plugin->component = 'local_onsitemonitoring'

install.xml:   Creates onsitemonitoring_programs,
                          onsitemonitoring_training,
                          onsitemonitoring_consent,
                          onsitemonitoring_audit_log

upgrade.php:   Adds RLS policies, audit triggers, indexes
```

### Demo Environment Requirements

| Requirement | Version | Notes |
|------------|---------|-------|
| PHP | 8.1+ | Moodle 4.5 requirement |
| PostgreSQL | 16+ | RLS support critical |
| Moodle | 4.5+ LTS | Local plugin API |
| Ngrok | 3.x | Free tier sufficient |
| Node.js | 20+ | For QR generation script |
| Docker | 24+ | Optional — containerized setup |

---

*End of Specification Document*
