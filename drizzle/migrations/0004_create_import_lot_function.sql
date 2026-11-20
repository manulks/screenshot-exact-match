create or replace function public.import_lot(lot jsonb, token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare item jsonb; q jsonb; cat uuid; did uuid; qid uuid; i int;
  n_created int := 0; n_updated int := 0; n_quizzes int := 0;
begin
  if encode(sha256(convert_to(coalesce(token, ''), 'UTF8')), 'hex')
     <> 'ecb9bb24dd4b79fe3952da18407a3823be46c04a274bd5ab13e2417992b445c2' then
    raise exception 'jeton invalide';
  end if;
  for item in select * from jsonb_array_elements(lot -> 'discoveries') loop
    select id into cat from categories where slug = item ->> 'category_slug';
    if cat is null then raise exception 'thème inconnu : %', item ->> 'category_slug'; end if;
    select id into did from discoveries where slug = item ->> 'slug';
    if did is null then
      insert into discoveries (slug, category_id, title, intro, summary, deep_dive, key_points, sources,
        image_url, image_alt, reading_minutes, why_today, takeaway, takeaway_kind, scheduled_on, is_published)
      values (item ->> 'slug', cat, item ->> 'title', item ->> 'intro', item ->> 'summary',
        coalesce(item ->> 'deep_dive', ''),
        array(select jsonb_array_elements_text(coalesce(item -> 'key_points', '[]'::jsonb))),
        coalesce(item -> 'sources', '[]'::jsonb), item ->> 'image_url', coalesce(item ->> 'image_alt', ''),
        coalesce((item ->> 'reading_minutes')::int, 3), item ->> 'why_today', item ->> 'takeaway',
        item ->> 'takeaway_kind', nullif(item ->> 'scheduled_on', '')::date, true)
      returning id into did;
      n_created := n_created + 1;
    else
      update discoveries set category_id = cat, title = item ->> 'title', intro = item ->> 'intro',
        summary = item ->> 'summary', deep_dive = coalesce(item ->> 'deep_dive', deep_dive),
        key_points = array(select jsonb_array_elements_text(coalesce(item -> 'key_points', '[]'::jsonb))),
        sources = coalesce(item -> 'sources', sources), image_url = coalesce(item ->> 'image_url', image_url),
        image_alt = coalesce(item ->> 'image_alt', image_alt),
        reading_minutes = coalesce((item ->> 'reading_minutes')::int, reading_minutes),
        why_today = item ->> 'why_today', takeaway = item ->> 'takeaway', takeaway_kind = item ->> 'takeaway_kind',
        scheduled_on = nullif(item ->> 'scheduled_on', '')::date, updated_at = now()
      where id = did;
      n_updated := n_updated + 1;
    end if;
    if jsonb_array_length(coalesce(item -> 'quizzes', '[]'::jsonb)) > 0 then
      i := 0;
      for q in select * from jsonb_array_elements(item -> 'quizzes') loop
        select id into qid from quizzes where discovery_id = did and sort_order = i limit 1;
        if qid is null then
          insert into quizzes (discovery_id, question, options, correct_index, explanation, sort_order)
          values (did, q ->> 'question', array(select jsonb_array_elements_text(q -> 'options')),
                  (q ->> 'correct_index')::int, q ->> 'explanation', i);
        else
          update quizzes set question = q ->> 'question',
            options = array(select jsonb_array_elements_text(q -> 'options')),
            correct_index = (q ->> 'correct_index')::int, explanation = q ->> 'explanation'
          where id = qid;
        end if;
        i := i + 1; n_quizzes := n_quizzes + 1;
      end loop;
    end if;
  end loop;
  return jsonb_build_object('created', n_created, 'updated', n_updated, 'quizzes', n_quizzes);
end; $$;

revoke all on function public.import_lot(jsonb, text) from public;
grant execute on function public.import_lot(jsonb, text) to anon, authenticated;