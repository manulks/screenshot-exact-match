create table if not exists public.culture_votes (
  discovery_id uuid not null references public.discoveries(id) on delete cascade,
  voter text not null,
  choice text not null check (choice in ('pareil', 'un_peu', 'pas_du_tout')),
  created_at timestamptz not null default now(),
  primary key (discovery_id, voter)
);
alter table public.culture_votes enable row level security;

create or replace function public.culture_vote_counts(p_discovery_id uuid)
returns table (choice text, votes bigint)
language sql stable security definer set search_path = public as $$
  select v.choice, count(*)::bigint from public.culture_votes v
  where v.discovery_id = p_discovery_id group by v.choice;
$$;

create or replace function public.cast_culture_vote(p_discovery_id uuid, p_voter text, p_choice text)
returns table (choice text, votes bigint)
language plpgsql security definer set search_path = public as $$
begin
  if p_choice not in ('pareil', 'un_peu', 'pas_du_tout') or length(p_voter) not between 10 and 64 then
    raise exception 'vote invalide';
  end if;
  insert into public.culture_votes (discovery_id, voter, choice)
  values (p_discovery_id, p_voter, p_choice)
  on conflict (discovery_id, voter) do update set choice = excluded.choice, created_at = now();
  return query select * from public.culture_vote_counts(p_discovery_id);
end;
$$;

grant execute on function public.culture_vote_counts(uuid) to anon, authenticated;
grant execute on function public.cast_culture_vote(uuid, text, text) to anon, authenticated;