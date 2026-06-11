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
SELECT
  'summer_camp',
  slots.label,
  slots.start_time::time,
  slots.end_time::time,
  slots.duration_minutes,
  slots.days_of_week,
  TRUE,
  slots.sort_order
FROM (
  VALUES
    ('11:00 AM - 12:30 PM', '11:00', '12:30', 90, ARRAY[0, 1, 2, 3, 4, 5, 6], 10),
    ('1:30 PM - 3:00 PM', '13:30', '15:00', 90, ARRAY[0, 1, 2, 3, 4, 5, 6], 20),
    ('4:00 PM - 5:30 PM', '16:00', '17:30', 90, ARRAY[0, 1, 2, 3, 4, 5, 6], 30),
    ('6:30 PM - 8:00 PM', '18:30', '20:00', 90, ARRAY[0, 1, 2, 3, 4, 5, 6], 40),
    ('9:00 PM - 10:30 PM', '21:00', '22:30', 90, ARRAY[4, 5], 50)
) AS slots(label, start_time, end_time, duration_minutes, days_of_week, sort_order)
ON CONFLICT (category_id, start_time, end_time) DO NOTHING;
