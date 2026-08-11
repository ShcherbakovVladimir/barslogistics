-- Operational fields on shipment events (actual times, progress, transport snapshot)
ALTER TABLE shipment_events ADD COLUMN IF NOT EXISTS actual_departure_at TIMESTAMPTZ;
ALTER TABLE shipment_events ADD COLUMN IF NOT EXISTS actual_arrival_at TIMESTAMPTZ;
ALTER TABLE shipment_events ADD COLUMN IF NOT EXISTS progress_pct NUMERIC;
ALTER TABLE shipment_events ADD COLUMN IF NOT EXISTS vehicle_number TEXT;
ALTER TABLE shipment_events ADD COLUMN IF NOT EXISTS trailer_number TEXT;
ALTER TABLE shipment_events ADD COLUMN IF NOT EXISTS container_number TEXT;
ALTER TABLE shipment_events ADD COLUMN IF NOT EXISTS waybill_number TEXT;
ALTER TABLE shipment_events ADD COLUMN IF NOT EXISTS driver_info TEXT;
ALTER TABLE shipment_events ADD COLUMN IF NOT EXISTS apply_transport_to_shipment BOOLEAN NOT NULL DEFAULT FALSE;
