-- Shipment logistics: transport metadata + document attachments
-- Files live on disk under SHIPMENT_FILES_DIR; metadata in PostgreSQL.

ALTER TABLE supply_links
    ADD COLUMN IF NOT EXISTS transport_mode TEXT
        CHECK (transport_mode IS NULL OR transport_mode IN ('road', 'rail', 'sea', 'air', 'multimodal')),
    ADD COLUMN IF NOT EXISTS vehicle_number TEXT,
    ADD COLUMN IF NOT EXISTS trailer_number TEXT,
    ADD COLUMN IF NOT EXISTS container_number TEXT,
    ADD COLUMN IF NOT EXISTS seal_number TEXT,
    ADD COLUMN IF NOT EXISTS waybill_number TEXT,
    ADD COLUMN IF NOT EXISTS planned_departure_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS planned_arrival_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS actual_departure_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS actual_arrival_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS logistics_notes TEXT;

CREATE TABLE IF NOT EXISTS shipment_documents (
    id TEXT PRIMARY KEY,
    shipment_id TEXT NOT NULL REFERENCES supply_links(id) ON DELETE CASCADE,
    uploaded_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL DEFAULT 'other'
        CHECK (doc_type IN (
            'waybill', 'cmr', 'invoice', 'packing_list',
            'customs', 'certificate', 'photo', 'other'
        )),
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    mime_type TEXT,
    size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
    storage_path TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipment_documents_shipment
    ON shipment_documents (shipment_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shipment_documents_type
    ON shipment_documents (shipment_id, doc_type);
