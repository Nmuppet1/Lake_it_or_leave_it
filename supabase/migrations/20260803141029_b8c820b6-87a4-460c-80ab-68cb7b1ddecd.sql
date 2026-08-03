CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.swims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_name text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  photo_path text,
  review text,
  water_temp_c numeric(4,1),
  rating smallint NOT NULL DEFAULT 3 CHECK (rating BETWEEN 1 AND 5),
  conditions text,
  swam_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX swims_created_at_idx ON public.swims (created_at DESC);
GRANT SELECT ON public.swims TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.swims TO authenticated;
GRANT ALL ON public.swims TO service_role;
ALTER TABLE public.swims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Swims are viewable by everyone" ON public.swims FOR SELECT USING (true);
CREATE POLICY "Users can create own swims" ON public.swims FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own swims" ON public.swims FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own swims" ON public.swims FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'username', ''),
      'swimmer_' || substr(NEW.id::text, 1, 8)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "Swim photos are viewable by everyone" ON storage.objects FOR SELECT USING (bucket_id = 'swim-photos');
CREATE POLICY "Users can upload own swim photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'swim-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own swim photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'swim-photos' AND (storage.foldername(name))[1] = auth.uid()::text);