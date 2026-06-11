ALTER TABLE public.class_bookings
ADD COLUMN IF NOT EXISTS attendance_count INTEGER;

ALTER TABLE public.service_bookings
ADD COLUMN IF NOT EXISTS attendance_count INTEGER,
ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES public.profiles(id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_bookings_qr_code_token
ON public.service_bookings(qr_code_token);
