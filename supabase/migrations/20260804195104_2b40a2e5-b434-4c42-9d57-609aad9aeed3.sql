CREATE TABLE public.swim_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  swim_id uuid NOT NULL REFERENCES public.swims(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX swim_comments_swim_id_created_at_idx ON public.swim_comments (swim_id, created_at DESC);

GRANT SELECT ON public.swim_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.swim_comments TO authenticated;
GRANT ALL ON public.swim_comments TO service_role;

ALTER TABLE public.swim_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON public.swim_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create own comments"
  ON public.swim_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.swim_comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.swim_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_swim_comments_updated_at
  BEFORE UPDATE ON public.swim_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();