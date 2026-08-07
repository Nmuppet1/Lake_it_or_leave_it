CREATE TABLE public.swim_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  swim_id UUID NOT NULL REFERENCES public.swims(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (swim_id, user_id)
);

GRANT SELECT ON public.swim_visits TO anon;
GRANT SELECT, INSERT, DELETE ON public.swim_visits TO authenticated;
GRANT ALL ON public.swim_visits TO service_role;

ALTER TABLE public.swim_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visits are viewable by everyone" ON public.swim_visits FOR SELECT USING (true);
CREATE POLICY "Users can add their own visit" ON public.swim_visits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own visit" ON public.swim_visits FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX swim_visits_swim_id_idx ON public.swim_visits (swim_id);