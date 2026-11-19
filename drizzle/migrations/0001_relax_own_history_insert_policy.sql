DROP POLICY IF EXISTS "Own history insert" ON public.reading_history;

CREATE POLICY "Own history insert" ON public.reading_history FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND read_date <= public.cultura_today()
);