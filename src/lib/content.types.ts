export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
}

export interface Source {
  title: string;
  author?: string;
  publisher?: string;
  year?: string;
  url?: string;
}

export interface DiscoverySummary {
  id: string;
  slug: string;
  title: string;
  intro: string;
  image_url: string | null;
  image_alt: string;
  reading_minutes: number;
  published_at: string;
  category: { slug: string; name: string; icon: string };
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  discovery: { slug: string; title: string };
}

export interface DiscoveryDetail extends DiscoverySummary {
  summary: string;
  deep_dive: string;
  key_points: string[];
  sources: Source[];
  quizzes: QuizQuestion[];
  related: DiscoverySummary[];
}

export interface DailySelection {
  date: string;
  discoveries: DiscoverySummary[];
}
