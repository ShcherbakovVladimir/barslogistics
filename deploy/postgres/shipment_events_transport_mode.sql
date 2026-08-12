-- Transport mode snapshot on shipment events (road / rail / …)
ALTER TABLE shipment_events
  ADD COLUMN IF NOT EXISTS transport_mode TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'shipment_events_transport_mode_check'
  ) THEN
    ALTER TABLE shipment_events
      ADD CONSTRAINT shipment_events_transport_mode_check
      CHECK (
        transport_mode IS NULL
        OR transport_mode IN ('road', 'rail', 'sea', 'air', 'multimodal')
      );
  END IF;
END $$;
