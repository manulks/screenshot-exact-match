ALTER TABLE public.discoveries
  ADD COLUMN takeaway text,
  ADD COLUMN takeaway_kind text,
  ADD COLUMN why_today text,
  ADD COLUMN scheduled_on date;

ALTER TABLE public.discoveries
  ADD CONSTRAINT discoveries_takeaway_kind_check
  CHECK (takeaway_kind IS NULL OR takeaway_kind IN ('dans_ta_vie', 'morale'));

CREATE OR REPLACE FUNCTION public.daily_discovery_ids()
 RETURNS TABLE(discovery_id uuid, day_rank integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH pool AS (
    SELECT d.id,
           COALESCE(d.scheduled_on = public.cultura_today(), false) AS is_scheduled,
           md5(d.id::text || public.cultura_today()::text) AS h
    FROM public.discoveries d
    WHERE d.is_published
  )
  SELECT p.id AS discovery_id,
         (row_number() OVER (ORDER BY p.is_scheduled DESC, p.h))::int AS day_rank
  FROM pool p
  ORDER BY p.is_scheduled DESC, p.h
  LIMIT 5
$function$;