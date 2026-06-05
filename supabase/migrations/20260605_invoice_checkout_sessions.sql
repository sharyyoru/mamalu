-- Track invoice checkout sessions and service booking invoice links.
-- This detects the table schemas because some Supabase environments do not
-- expose these tables under the public schema in SQL Editor.

DO $$
DECLARE
  invoice_table REGCLASS;
  booking_table REGCLASS;
BEGIN
  SELECT format('%I.%I', table_schema, table_name)::REGCLASS
  INTO invoice_table
  FROM information_schema.tables
  WHERE table_name = 'invoices'
    AND table_type = 'BASE TABLE'
  ORDER BY CASE WHEN table_schema = 'public' THEN 0 ELSE 1 END, table_schema
  LIMIT 1;

  SELECT format('%I.%I', table_schema, table_name)::REGCLASS
  INTO booking_table
  FROM information_schema.tables
  WHERE table_name = 'service_bookings'
    AND table_type = 'BASE TABLE'
  ORDER BY CASE WHEN table_schema = 'public' THEN 0 ELSE 1 END, table_schema
  LIMIT 1;

  IF invoice_table IS NULL THEN
    RAISE EXCEPTION 'Could not find invoices table';
  END IF;

  IF booking_table IS NULL THEN
    RAISE EXCEPTION 'Could not find service_bookings table';
  END IF;

  EXECUTE format(
    'ALTER TABLE %s
      ADD COLUMN IF NOT EXISTS service_booking_id UUID REFERENCES %s(id),
      ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT',
    invoice_table,
    booking_table
  );

  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS idx_invoices_stripe_checkout_session ON %s(stripe_checkout_session_id)',
    invoice_table
  );

  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS idx_invoices_service_booking ON %s(service_booking_id)',
    invoice_table
  );

  EXECUTE format(
    'ALTER TABLE %s
      ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES %s(id),
      ADD COLUMN IF NOT EXISTS invoice_number TEXT',
    booking_table,
    invoice_table
  );

  EXECUTE format(
    $sql$
      WITH matched_service_invoices AS (
        SELECT DISTINCT ON (i.id)
          i.id AS invoice_id,
          i.invoice_number,
          sb.id AS service_booking_id
        FROM %s i
        JOIN %s sb
          ON lower(i.customer_email) = lower(sb.customer_email)
         AND COALESCE(i.source_type, 'service_booking') = 'service_booking'
         AND i.created_at BETWEEN sb.created_at - INTERVAL '10 minutes' AND sb.created_at + INTERVAL '30 minutes'
         AND (
          abs(COALESCE(i.amount, 0) - COALESCE(sb.deposit_amount, 0)) < 0.01
          OR abs(COALESCE(i.amount, 0) - COALESCE(sb.total_amount, 0)) < 0.01
         )
        WHERE i.service_booking_id IS NULL
        ORDER BY i.id, abs(EXTRACT(EPOCH FROM (i.created_at - sb.created_at)))
      )
      UPDATE %s i
      SET service_booking_id = matched.service_booking_id
      FROM matched_service_invoices matched
      WHERE i.id = matched.invoice_id
    $sql$,
    invoice_table,
    booking_table,
    invoice_table
  );

  EXECUTE format(
    $sql$
      UPDATE %s sb
      SET
        invoice_id = i.id,
        invoice_number = i.invoice_number
      FROM %s i
      WHERE i.service_booking_id = sb.id
        AND (sb.invoice_id IS NULL OR sb.invoice_number IS NULL)
    $sql$,
    booking_table,
    invoice_table
  );

  EXECUTE format(
    $sql$
      UPDATE %s i
      SET
        status = 'paid',
        paid_at = COALESCE(i.paid_at, sb.deposit_paid_at, sb.paid_at, now())
      FROM %s sb
      WHERE i.service_booking_id = sb.id
        AND i.status <> 'paid'
        AND (
          sb.payment_status = 'paid'
          OR sb.paid_at IS NOT NULL
          OR (sb.is_deposit_payment = true AND sb.deposit_paid = true AND COALESCE(i.description, '') NOT ILIKE '%%balance payment%%')
        )
    $sql$,
    invoice_table,
    booking_table
  );
END $$;
