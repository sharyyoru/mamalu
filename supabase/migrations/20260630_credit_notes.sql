CREATE TABLE IF NOT EXISTS public.credit_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_note_number TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL CHECK (source_type IN ('service_booking', 'product_order')),
  source_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  source_reference TEXT NOT NULL,
  original_invoice_number TEXT,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_credit_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AED',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  downloaded_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_notes_source
ON public.credit_notes(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_credit_notes_created_at
ON public.credit_notes(created_at DESC);

GRANT SELECT, INSERT, UPDATE ON TABLE public.credit_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.credit_notes TO service_role;

ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Finance admins can manage credit notes" ON public.credit_notes;
CREATE POLICY "Finance admins can manage credit notes"
ON public.credit_notes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('staff', 'admin', 'super_admin', 'accountant')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('staff', 'admin', 'super_admin', 'accountant')
  )
);

CREATE OR REPLACE FUNCTION public.generate_credit_note_number()
RETURNS TEXT AS $$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
BEGIN
  year_suffix := TO_CHAR(NOW(), 'YY');

  SELECT COALESCE(MAX((regexp_match(credit_note_number, '^TCN-' || year_suffix || '-([0-9]+)$'))[1]::INTEGER), 0) + 1
  INTO next_number
  FROM public.credit_notes
  WHERE credit_note_number LIKE 'TCN-' || year_suffix || '-%';

  RETURN 'TCN-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
