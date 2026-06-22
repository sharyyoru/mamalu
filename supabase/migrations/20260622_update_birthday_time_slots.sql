DELETE FROM public.booking_time_slots
WHERE category_id = 'birthday';

INSERT INTO public.booking_time_slots (
  category_id,
  label,
  start_time,
  end_time,
  duration_minutes,
  days_of_week,
  is_active,
  sort_order
)
VALUES
  ('birthday', '10:00 AM - 12:00 PM', '10:00', '12:00', 120, ARRAY[0, 1, 2, 3, 4, 5, 6], TRUE, 10),
  ('birthday', '1:00 PM - 3:00 PM', '13:00', '15:00', 120, ARRAY[0, 1, 2, 3, 4, 5, 6], TRUE, 20),
  ('birthday', '4:00 PM - 6:00 PM', '16:00', '18:00', 120, ARRAY[0, 1, 2, 3, 4, 5, 6], TRUE, 30),
  ('birthday', '7:00 PM - 9:00 PM', '19:00', '21:00', 120, ARRAY[0, 1, 2, 3, 4, 5, 6], TRUE, 40)
ON CONFLICT (category_id, start_time, end_time) DO UPDATE SET
  label = EXCLUDED.label,
  end_time = EXCLUDED.end_time,
  duration_minutes = EXCLUDED.duration_minutes,
  days_of_week = EXCLUDED.days_of_week,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
