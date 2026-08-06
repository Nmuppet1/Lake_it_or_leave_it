ALTER TABLE public.swims
  ADD COLUMN jumpability smallint NOT NULL DEFAULT 3,
  ADD COLUMN scenery smallint NOT NULL DEFAULT 3,
  ADD COLUMN legality smallint NOT NULL DEFAULT 3,
  ADD COLUMN privacy smallint NOT NULL DEFAULT 3,
  ADD COLUMN accessibility smallint NOT NULL DEFAULT 3,
  ADD COLUMN cleanliness smallint NOT NULL DEFAULT 3,
  ADD COLUMN turbidity smallint NOT NULL DEFAULT 3,
  ADD COLUMN parking smallint NOT NULL DEFAULT 3;