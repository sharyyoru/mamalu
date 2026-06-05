-- Add source-backed invoice links for future bookings and purchases only.

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS product_order_id UUID REFERENCES public.product_orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS voucher_purchase_id UUID REFERENCES public.voucher_purchases(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_source_type ON public.invoices(source_type);
CREATE INDEX IF NOT EXISTS idx_invoices_product_order ON public.invoices(product_order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_voucher_purchase ON public.invoices(voucher_purchase_id);
