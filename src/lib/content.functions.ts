import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type {
  Category,
  DailySelection,
  DiscoveryDetail,
  DiscoverySummary,
  QuizQuestion,
  Source,
} from "./content.types";

// Public, read-only content client (RLS: anon can read published content only).
function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const SUMMARY_COLUMNS =
  "id, slug, title, intro, image_url, image_alt, reading_minutes, published_at, category:categories!inner(slug, name, icon)";

type SummaryRow = Omit<DiscoverySummary, "category"> & {
  category: { slug: string; name: string; icon: string } | { slug: string; name: string; icon: string }[];
};

function toSummary(row: SummaryRow): DiscoverySummary {
  const category = Array.isArray(row.category) ? row.category[0]! : row.category;
  return { ...row, category };
}

function fail(context: string, error: { message: string } | null): never {
  console.error(`[content] ${context}`, error?.message);
  throw new Error("Le contenu n'a pas pu être chargé. Réessayez dans un instant.");
}

export const getCategories = createServerFn({ method: "GET" }).handler(async (): Promise<Category[]> => {
  const { data, error } = await publicClient()
    .from("categories")
    .select("id, slug, name, description, icon, sort_order")
    .order("sort_order");
  if (error) fail("categories", error);
  return data ?? [];
});

export const listDiscoveries = createServerFn({ method: "GET" }).handler(
  async (): Promise<DiscoverySummary[]> => {
    const { data, error } = await publicClient()
      .from("discoveries")
      .select(SUMMARY_COLUMNS)
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(500);
    if (error) fail("discoveries", error);
    return ((data ?? []) as unknown as SummaryRow[]).map(toSummary);
  },
);

export const getDailySelection = createServerFn({ method: "GET" }).handler(
  async (): Promise<DailySelection> => {
    const sb = publicClient();
    const [{ data: ids, error: idsError }, { data: today, error: dateError }] = await Promise.all([
      sb.rpc("daily_discovery_ids"),
      sb.rpc("cultura_today"),
    ]);
    if (idsError || dateError) fail("daily", idsError ?? dateError);
    const order = (ids ?? []).map((r) => r.discovery_id);
    if (order.length === 0) return { date: String(today), discoveries: [] };
    const { data, error } = await sb.from("discoveries").select(SUMMARY_COLUMNS).in("id", order);
    if (error) fail("daily discoveries", error);
    const byId = new Map(((data ?? []) as unknown as SummaryRow[]).map((r) => [r.id, toSummary(r)]));
    return {
      date: String(today),
      discoveries: order.map((id) => byId.get(id)).filter((d): d is DiscoverySummary => !!d),
    };
  },
);

type QuizRow = {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  sort_order: number;
  discovery: { slug: string; title: string } | { slug: string; title: string }[];
};

function toQuestion(row: QuizRow): QuizQuestion {
  const discovery = Array.isArray(row.discovery) ? row.discovery[0]! : row.discovery;
  return {
    id: row.id,
    question: row.question,
    options: row.options,
    correct_index: row.correct_index,
    explanation: row.explanation,
    discovery,
  };
}

export const getDiscovery = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data }): Promise<DiscoveryDetail | null> => {
    const sb = publicClient();
    const { data: row, error } = await sb
      .from("discoveries")
      .select(`${SUMMARY_COLUMNS}, summary, deep_dive, key_points, sources, category_id`)
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) fail("discovery", error);
    if (!row) return null;
    const full = row as unknown as SummaryRow & {
      summary: string;
      deep_dive: string;
      key_points: string[];
      sources: Source[];
      category_id: string;
    };

    const [{ data: quizzes, error: qErr }, { data: sameCat, error: rErr }] = await Promise.all([
      sb
        .from("quizzes")
        .select("id, question, options, correct_index, explanation, sort_order, discovery:discoveries!inner(slug, title)")
        .eq("discovery_id", full.id)
        .order("sort_order"),
      sb
        .from("discoveries")
        .select(SUMMARY_COLUMNS)
        .eq("is_published", true)
        .neq("id", full.id)
        .order("published_at", { ascending: false })
        .limit(12),
    ]);
    if (qErr) fail("quizzes", qErr);
    if (rErr) fail("related", rErr);

    const others = ((sameCat ?? []) as unknown as SummaryRow[]).map(toSummary);
    const related = [
      ...others.filter((o) => o.category.slug === toSummary(full).category.slug),
      ...others.filter((o) => o.category.slug !== toSummary(full).category.slug),
    ].slice(0, 3);

    const { category_id: _ignored, ...rest } = full;
    return {
      ...toSummary(rest as SummaryRow),
      summary: full.summary,
      deep_dive: full.deep_dive,
      key_points: full.key_points,
      sources: Array.isArray(full.sources) ? full.sources : [],
      quizzes: ((quizzes ?? []) as unknown as QuizRow[]).map(toQuestion),
      related,
    };
  });

/** Daily quiz: the first question of each of today's five discoveries. */
export const getDailyQuiz = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ date: string; questions: QuizQuestion[] }> => {
    const sb = publicClient();
    const [{ data: ids, error }, { data: today }] = await Promise.all([
      sb.rpc("daily_discovery_ids"),
      sb.rpc("cultura_today"),
    ]);
    if (error) fail("daily quiz ids", error);
    const order = (ids ?? []).map((r) => r.discovery_id);
    if (order.length === 0) return { date: String(today), questions: [] };
    const { data, error: qErr } = await sb
      .from("quizzes")
      .select("id, question, options, correct_index, explanation, sort_order, discovery_id, discovery:discoveries!inner(slug, title)")
      .in("discovery_id", order)
      .order("sort_order");
    if (qErr) fail("daily quiz", qErr);
    const rows = (data ?? []) as unknown as (QuizRow & { discovery_id: string })[];
    const questions = order
      .map((id) => rows.find((r) => r.discovery_id === id))
      .filter((r): r is QuizRow & { discovery_id: string } => !!r)
      .map(toQuestion);
    return { date: String(today), questions };
  },
);
