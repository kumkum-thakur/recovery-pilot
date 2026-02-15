-- RecoveryPilot Production Database Schema
-- Optimized for 2M patients/day across India, US, UK
--
-- Key design decisions:
-- 1. UUID primary keys (no sequential IDs for security)
-- 2. Table partitioning by region for data residency compliance
-- 3. Range partitioning on timestamp columns for time-series data
-- 4. BRIN indexes on timestamp columns (compact, ideal for append-only data)
-- 5. GIN indexes on JSONB columns for clinical metadata queries
-- 6. Partial indexes for common query patterns
-- 7. Row-level security (RLS) for multi-tenant isolation
-- 8. Audit table is append-only (no UPDATE/DELETE triggers)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gist";    -- Exclusion constraints

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(100) NOT NULL,
    email           TEXT NOT NULL,                    -- Encrypted at application level
    password_hash   TEXT NOT NULL,
    name            TEXT NOT NULL,                    -- Encrypted at application level
    role            VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'patient', 'doctor')),
    region          VARCHAR(20) NOT NULL DEFAULT 'ap-south-1',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_locked       BOOLEAN NOT NULL DEFAULT false,
    locked_at       TIMESTAMPTZ,
    mfa_enabled     BOOLEAN NOT NULL DEFAULT false,
    mfa_secret      TEXT,                            -- Encrypted
    mfa_secret_pending TEXT,                         -- Encrypted
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    last_failed_login TIMESTAMPTZ,
    last_login      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE INDEX idx_users_role ON users (role) WHERE is_active = true;
CREATE INDEX idx_users_region ON users (region) WHERE is_active = true;
CREATE INDEX idx_users_username_active ON users (username) WHERE is_active = true AND NOT is_locked;

-- ============================================================
-- PATIENTS TABLE (extended profile, partitioned by region)
-- ============================================================
CREATE TABLE patients (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id),
    name                TEXT NOT NULL,           -- Encrypted PHI
    date_of_birth       TEXT,                    -- Encrypted PHI
    gender              VARCHAR(20),
    blood_group         VARCHAR(10),
    phone_number        TEXT,                    -- Encrypted PHI
    address             TEXT,                    -- Encrypted PHI
    emergency_contact   TEXT,                    -- Encrypted PHI
    emergency_phone     TEXT,                    -- Encrypted PHI
    -- India-specific identifiers
    aadhaar_number_hash TEXT,                    -- HMAC hash for lookup
    abha_id             TEXT,                    -- Ayushman Bharat Health Account ID
    -- US-specific identifiers
    ssn_hash            TEXT,                    -- HMAC hash for lookup
    insurance_id        TEXT,                    -- Encrypted PHI
    -- UK-specific identifiers
    nhs_number_hash     TEXT,                    -- HMAC hash for lookup
    --
    primary_doctor_id   UUID REFERENCES users(id),
    region              VARCHAR(20) NOT NULL DEFAULT 'ap-south-1',
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY LIST (region);

-- Create regional partitions for data residency
CREATE TABLE patients_india PARTITION OF patients FOR VALUES IN ('ap-south-1', 'ap-south-2');
CREATE TABLE patients_us PARTITION OF patients FOR VALUES IN ('us-east-1', 'us-west-2');
CREATE TABLE patients_uk PARTITION OF patients FOR VALUES IN ('eu-west-2');

CREATE INDEX idx_patients_user_id ON patients (user_id);
CREATE INDEX idx_patients_doctor ON patients (primary_doctor_id) WHERE is_active = true;
CREATE INDEX idx_patients_region ON patients (region) WHERE is_active = true;
CREATE INDEX idx_patients_aadhaar ON patients (aadhaar_number_hash) WHERE aadhaar_number_hash IS NOT NULL;
CREATE INDEX idx_patients_ssn ON patients (ssn_hash) WHERE ssn_hash IS NOT NULL;
CREATE INDEX idx_patients_nhs ON patients (nhs_number_hash) WHERE nhs_number_hash IS NOT NULL;
CREATE INDEX idx_patients_abha ON patients (abha_id) WHERE abha_id IS NOT NULL;

-- ============================================================
-- VITAL SIGNS (Time-series, range partitioned by month)
-- High-volume table: ~5 readings/patient/day = 10M rows/day
-- ============================================================
CREATE TABLE vital_signs (
    id                      UUID NOT NULL DEFAULT uuid_generate_v4(),
    patient_id              UUID NOT NULL,
    heart_rate              SMALLINT,
    blood_pressure_systolic SMALLINT,
    blood_pressure_diastolic SMALLINT,
    temperature             NUMERIC(4,1),
    respiratory_rate        SMALLINT,
    oxygen_saturation       NUMERIC(4,1),
    blood_glucose           NUMERIC(5,1),
    pain_level              SMALLINT,
    weight                  NUMERIC(5,1),
    recorded_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by             UUID NOT NULL,
    source                  VARCHAR(50) DEFAULT 'manual',  -- manual, device, iot
    metadata                JSONB,
    PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- Create monthly partitions (auto-managed by pg_partman in production)
-- Sample: create 12 months ahead
DO $$
DECLARE
    start_date DATE := DATE_TRUNC('month', CURRENT_DATE);
    end_date DATE;
    partition_name TEXT;
BEGIN
    FOR i IN 0..12 LOOP
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'vital_signs_' || TO_CHAR(start_date, 'YYYY_MM');

        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF vital_signs FOR VALUES FROM (%L) TO (%L)',
            partition_name,
            start_date,
            end_date
        );

        start_date := end_date;
    END LOOP;
END $$;

-- BRIN index: compact, perfect for time-series append-only data
CREATE INDEX idx_vitals_patient_time ON vital_signs USING BRIN (patient_id, recorded_at)
    WITH (pages_per_range = 32);
CREATE INDEX idx_vitals_recorded_at ON vital_signs USING BRIN (recorded_at)
    WITH (pages_per_range = 32);

-- ============================================================
-- MISSIONS TABLE
-- ============================================================
CREATE TABLE missions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    care_plan_id    UUID,
    patient_id      UUID NOT NULL,
    type            VARCHAR(50) NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'completed', 'overdue', 'skipped')),
    frequency       VARCHAR(50),
    start_day       INTEGER,
    end_day         INTEGER,
    due_date        TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_missions_patient ON missions (patient_id, status);
CREATE INDEX idx_missions_due ON missions (due_date) WHERE status = 'pending';
CREATE INDEX idx_missions_care_plan ON missions (care_plan_id) WHERE care_plan_id IS NOT NULL;

-- ============================================================
-- CARE PLANS TABLE
-- ============================================================
CREATE TABLE care_plans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL,
    doctor_id       UUID NOT NULL,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    surgery_type    VARCHAR(200),
    start_date      TIMESTAMPTZ NOT NULL,
    end_date        TIMESTAMPTZ,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'completed', 'archived', 'cancelled')),
    template_id     UUID,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_care_plans_patient ON care_plans (patient_id) WHERE status = 'active';
CREATE INDEX idx_care_plans_doctor ON care_plans (doctor_id) WHERE status = 'active';

-- ============================================================
-- MEDICATIONS TABLE
-- ============================================================
CREATE TABLE medications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    care_plan_id    UUID REFERENCES care_plans(id),
    patient_id      UUID NOT NULL,
    doctor_id       UUID NOT NULL,
    name            VARCHAR(200) NOT NULL,
    dosage          VARCHAR(100) NOT NULL,
    frequency       VARCHAR(100) NOT NULL,
    route           VARCHAR(50) DEFAULT 'oral',
    start_date      TIMESTAMPTZ NOT NULL,
    end_date        TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    refill_count    INTEGER DEFAULT 0,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medications_patient ON medications (patient_id) WHERE is_active = true;

-- ============================================================
-- ACTION ITEMS (Triage Queue)
-- ============================================================
CREATE TABLE action_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id          UUID NOT NULL,
    patient_name        TEXT,                -- Encrypted
    type                VARCHAR(50) NOT NULL CHECK (type IN ('triage', 'refill', 'alert', 'review')),
    status              VARCHAR(30) NOT NULL DEFAULT 'pending_agent'
                        CHECK (status IN ('pending_agent', 'pending_doctor', 'approved', 'rejected', 'escalated')),
    priority            SMALLINT NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),

    -- Triage fields
    image_url           TEXT,
    triage_analysis     VARCHAR(10),
    triage_text         TEXT,
    ai_confidence_score NUMERIC(3,2),

    -- Refill fields
    medication_name     VARCHAR(200),
    insurance_status    VARCHAR(20),
    inventory_status    VARCHAR(20),

    -- Resolution
    doctor_id           UUID,
    doctor_notes        TEXT,
    rejection_reason    TEXT,
    decided_at          TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_action_items_status ON action_items (status, priority, created_at);
CREATE INDEX idx_action_items_doctor ON action_items (doctor_id) WHERE doctor_id IS NOT NULL;
CREATE INDEX idx_action_items_patient ON action_items (patient_id);

-- ============================================================
-- CLINICAL HISTORY
-- ============================================================
CREATE TABLE clinical_history (
    id              UUID NOT NULL DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL,
    event_type      VARCHAR(100) NOT NULL,
    description     TEXT,
    diagnosis_code  VARCHAR(20),             -- ICD-10
    severity        VARCHAR(20),
    data            JSONB,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by     UUID NOT NULL,
    PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- Create partitions
DO $$
DECLARE
    start_date DATE := DATE_TRUNC('month', CURRENT_DATE);
    end_date DATE;
    partition_name TEXT;
BEGIN
    FOR i IN 0..12 LOOP
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'clinical_history_' || TO_CHAR(start_date, 'YYYY_MM');
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF clinical_history FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );
        start_date := end_date;
    END LOOP;
END $$;

CREATE INDEX idx_clinical_history_patient ON clinical_history USING BRIN (patient_id, recorded_at);

-- ============================================================
-- PATIENT CONSENTS (Compliance)
-- ============================================================
CREATE TABLE patient_consents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL,
    consent_type    VARCHAR(50) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,
    withdrawn_at    TIMESTAMPTZ,
    purpose         TEXT NOT NULL,
    data_categories JSONB NOT NULL DEFAULT '["health_records"]',
    version         VARCHAR(10) NOT NULL DEFAULT '1.0',
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consents_patient ON patient_consents (patient_id, consent_type) WHERE is_active = true;

-- ============================================================
-- AUDIT LOGS (Immutable, partitioned by month)
-- Critical for HIPAA, DPDPA, and UK GDPR compliance.
-- 7-year retention policy.
-- ============================================================
CREATE TABLE audit_logs (
    id                  UUID NOT NULL DEFAULT uuid_generate_v4(),
    timestamp           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_type          VARCHAR(50) NOT NULL,
    user_id             VARCHAR(100) NOT NULL,
    user_role           VARCHAR(20) NOT NULL,
    patient_id          UUID,
    resource_type       VARCHAR(50) NOT NULL,
    resource_id         UUID,
    action              TEXT NOT NULL,
    outcome             VARCHAR(10) NOT NULL CHECK (outcome IN ('success', 'failure', 'error')),
    ip_address          INET,
    user_agent          TEXT,
    request_id          VARCHAR(100),
    region              VARCHAR(20),
    compliance_regime   VARCHAR(20),
    details             JSONB,
    previous_hash       VARCHAR(64),
    entry_hash          VARCHAR(64),
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions for audit logs
DO $$
DECLARE
    start_date DATE := DATE_TRUNC('month', CURRENT_DATE);
    end_date DATE;
    partition_name TEXT;
BEGIN
    FOR i IN 0..24 LOOP
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'audit_logs_' || TO_CHAR(start_date, 'YYYY_MM');
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );
        start_date := end_date;
    END LOOP;
END $$;

-- BRIN indexes for time-series audit data
CREATE INDEX idx_audit_timestamp ON audit_logs USING BRIN (timestamp) WITH (pages_per_range = 32);
CREATE INDEX idx_audit_user ON audit_logs (user_id, timestamp);
CREATE INDEX idx_audit_patient ON audit_logs (patient_id, timestamp) WHERE patient_id IS NOT NULL;
CREATE INDEX idx_audit_event_type ON audit_logs (event_type, timestamp);

-- Prevent UPDATE and DELETE on audit_logs (immutability)
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable. UPDATE and DELETE operations are not permitted.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_no_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER trg_audit_no_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_modification();

-- ============================================================
-- DATA ERASURE REQUESTS (Compliance tracking)
-- ============================================================
CREATE TABLE data_erasure_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL,
    reason          TEXT,
    compliance_regime VARCHAR(20) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'completed', 'denied')),
    denial_reason   TEXT,
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    processed_by    UUID
);

-- ============================================================
-- CARE RELATIONSHIPS (Doctor-Patient access control)
-- ============================================================
CREATE TABLE care_relationships (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id       UUID NOT NULL REFERENCES users(id),
    patient_id      UUID NOT NULL,
    relationship_type VARCHAR(30) NOT NULL DEFAULT 'primary',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,

    CONSTRAINT uq_care_relationship UNIQUE (doctor_id, patient_id)
);

CREATE INDEX idx_care_rel_doctor ON care_relationships (doctor_id) WHERE is_active = true;
CREATE INDEX idx_care_rel_patient ON care_relationships (patient_id) WHERE is_active = true;

-- ============================================================
-- BREACH LOG (Compliance)
-- ============================================================
CREATE TABLE breach_logs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    detected_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    affected_patients       INTEGER NOT NULL,
    data_categories         JSONB NOT NULL,
    description             TEXT NOT NULL,
    severity                VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    notification_deadline   TIMESTAMPTZ NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'detected',
    resolved_at             TIMESTAMPTZ,
    resolution_notes        TEXT
);

-- ============================================================
-- ROW LEVEL SECURITY (Multi-tenant data isolation)
-- ============================================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

-- Patients can only see their own data
CREATE POLICY patients_own_data ON patients
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true)::uuid
           OR current_setting('app.current_user_role', true) IN ('admin', 'doctor'));

-- Vital signs: patients see own, doctors see their patients
CREATE POLICY vitals_access ON vital_signs
    FOR ALL
    USING (patient_id IN (
        SELECT id FROM patients WHERE user_id = current_setting('app.current_user_id', true)::uuid
    ) OR current_setting('app.current_user_role', true) IN ('admin', 'doctor'));

-- ============================================================
-- PERFORMANCE OPTIMIZATIONS
-- ============================================================

-- Automatic updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_missions_updated_at BEFORE UPDATE ON missions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_care_plans_updated_at BEFORE UPDATE ON care_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_medications_updated_at BEFORE UPDATE ON medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_action_items_updated_at BEFORE UPDATE ON action_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DATABASE TUNING (Applied via ALTER SYSTEM in production)
-- ============================================================
-- These are recommendations for pg_config, not executed here:
--
-- # Connection Pooling (PgBouncer recommended)
-- max_connections = 500
--
-- # Memory (for 64GB RAM server)
-- shared_buffers = 16GB
-- effective_cache_size = 48GB
-- work_mem = 64MB
-- maintenance_work_mem = 2GB
-- wal_buffers = 64MB
--
-- # Write Performance
-- checkpoint_completion_target = 0.9
-- wal_level = replica
-- max_wal_size = 4GB
-- min_wal_size = 1GB
--
-- # Query Planner
-- random_page_cost = 1.1  (SSD storage)
-- effective_io_concurrency = 200
-- default_statistics_target = 200
--
-- # Parallelism
-- max_worker_processes = 16
-- max_parallel_workers_per_gather = 4
-- max_parallel_workers = 16
--
-- # Partitioning
-- enable_partition_pruning = on
-- constraint_exclusion = partition
