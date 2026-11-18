CREATE OR REPLACE FUNCTION public.cultura_today()
RETURNS date LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT (now() AT TIME ZONE 'Europe/Paris')::date
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text CHECK (char_length(display_name) <= 60),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'book-open',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Categories admin insert" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Categories admin update" ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Categories admin delete" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.discoveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  intro text NOT NULL,
  image_url text,
  image_alt text NOT NULL DEFAULT '',
  summary text NOT NULL,
  deep_dive text NOT NULL,
  key_points text[] NOT NULL DEFAULT '{}',
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  reading_minutes int NOT NULL DEFAULT 3 CHECK (reading_minutes > 0),
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX discoveries_category_idx ON public.discoveries(category_id);
GRANT SELECT ON public.discoveries TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.discoveries TO authenticated;
GRANT ALL ON public.discoveries TO service_role;
ALTER TABLE public.discoveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published discoveries public read" ON public.discoveries FOR SELECT TO anon, authenticated USING (is_published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Discoveries admin insert" ON public.discoveries FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Discoveries admin update" ON public.discoveries FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Discoveries admin delete" ON public.discoveries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER discoveries_updated_at BEFORE UPDATE ON public.discoveries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discovery_id uuid NOT NULL REFERENCES public.discoveries(id) ON DELETE CASCADE,
  question text NOT NULL,
  options text[] NOT NULL CHECK (array_length(options, 1) = 4),
  correct_index smallint NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  explanation text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quizzes_discovery_idx ON public.quizzes(discovery_id);
GRANT SELECT ON public.quizzes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quizzes public read" ON public.quizzes FOR SELECT TO anon, authenticated USING (
  EXISTS (SELECT 1 FROM public.discoveries d WHERE d.id = discovery_id AND (d.is_published OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Quizzes admin insert" ON public.quizzes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Quizzes admin update" ON public.quizzes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Quizzes admin delete" ON public.quizzes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.favorites (
  user_id uuid NOT NULL,
  discovery_id uuid NOT NULL REFERENCES public.discoveries(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, discovery_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own favorites select" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own favorites insert" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own favorites delete" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.reading_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  discovery_id uuid NOT NULL REFERENCES public.discoveries(id) ON DELETE CASCADE,
  read_date date NOT NULL DEFAULT public.cultura_today(),
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, discovery_id, read_date)
);
CREATE INDEX reading_history_user_idx ON public.reading_history(user_id, read_at DESC);
GRANT SELECT, INSERT, DELETE ON public.reading_history TO authenticated;
GRANT ALL ON public.reading_history TO service_role;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own history select" ON public.reading_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own history insert" ON public.reading_history FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND read_date <= public.cultura_today() AND read_date >= public.cultura_today() - 7
);
CREATE POLICY "Own history delete" ON public.reading_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_ref uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  selected_index smallint NOT NULL CHECK (selected_index BETWEEN 0 AND 3),
  is_correct boolean NOT NULL DEFAULT false,
  answered_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quiz_answers_user_idx ON public.quiz_answers(user_id, answered_at DESC);
GRANT SELECT, INSERT ON public.quiz_answers TO authenticated;
GRANT ALL ON public.quiz_answers TO service_role;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own answers select" ON public.quiz_answers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own answers insert" ON public.quiz_answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.quiz_answer_compute_correct()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT (q.correct_index = NEW.selected_index) INTO NEW.is_correct FROM public.quizzes q WHERE q.id = NEW.quiz_id;
  NEW.is_correct := COALESCE(NEW.is_correct, false);
  IF NEW.answered_at IS NULL OR NEW.answered_at > now() + interval '5 minutes' OR NEW.answered_at < now() - interval '7 days' THEN
    NEW.answered_at := now();
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER quiz_answers_compute BEFORE INSERT ON public.quiz_answers FOR EACH ROW EXECUTE FUNCTION public.quiz_answer_compute_correct();

CREATE TABLE public.user_progress (
  user_id uuid PRIMARY KEY,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_active_date date,
  total_read int NOT NULL DEFAULT 0,
  total_quiz_answers int NOT NULL DEFAULT 0,
  total_correct int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_progress TO authenticated;
GRANT ALL ON public.user_progress TO service_role;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own progress select" ON public.user_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.bump_progress(_user uuid, _day date, _read int, _answers int, _correct int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.user_progress%ROWTYPE;
  new_streak int;
  new_last date;
BEGIN
  INSERT INTO public.user_progress(user_id) VALUES (_user) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO p FROM public.user_progress WHERE user_id = _user FOR UPDATE;
  IF p.last_active_date IS NULL THEN
    new_streak := 1; new_last := _day;
  ELSIF _day = p.last_active_date OR _day < p.last_active_date THEN
    new_streak := p.current_streak; new_last := p.last_active_date;
  ELSIF _day = p.last_active_date + 1 THEN
    new_streak := p.current_streak + 1; new_last := _day;
  ELSE
    new_streak := 1; new_last := _day;
  END IF;
  UPDATE public.user_progress SET
    current_streak = new_streak,
    longest_streak = GREATEST(p.longest_streak, new_streak),
    last_active_date = new_last,
    total_read = p.total_read + _read,
    total_quiz_answers = p.total_quiz_answers + _answers,
    total_correct = p.total_correct + _correct,
    updated_at = now()
  WHERE user_id = _user;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.bump_progress(uuid, date, int, int, int) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.on_reading_inserted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.bump_progress(NEW.user_id, NEW.read_date, 1, 0, 0); RETURN NEW; END;
$$;
CREATE TRIGGER reading_history_progress AFTER INSERT ON public.reading_history FOR EACH ROW EXECUTE FUNCTION public.on_reading_inserted();

CREATE OR REPLACE FUNCTION public.on_answer_inserted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.bump_progress(NEW.user_id, (NEW.answered_at AT TIME ZONE 'Europe/Paris')::date, 0, 1, CASE WHEN NEW.is_correct THEN 1 ELSE 0 END);
  RETURN NEW;
END;
$$;
CREATE TRIGGER quiz_answers_progress AFTER INSERT ON public.quiz_answers FOR EACH ROW EXECUTE FUNCTION public.on_answer_inserted();

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'inactive',
  plan text CHECK (plan IN ('monthly', 'yearly')),
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own subscription select" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_premium(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND status IN ('active', 'trialing')
      AND (current_period_end IS NULL OR current_period_end > now())
  )
$$;

CREATE OR REPLACE FUNCTION public.daily_discovery_ids()
RETURNS TABLE(discovery_id uuid, day_rank int)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT d.id AS discovery_id,
         (row_number() OVER (ORDER BY md5(d.id::text || public.cultura_today()::text)))::int AS day_rank
  FROM public.discoveries d
  WHERE d.is_published
  ORDER BY md5(d.id::text || public.cultura_today()::text)
  LIMIT 5
$$;
GRANT EXECUTE ON FUNCTION public.daily_discovery_ids() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cultura_today() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id, display_name)
  VALUES (NEW.id, NULLIF(LEFT(COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', ''), 60), ''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_progress(user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
