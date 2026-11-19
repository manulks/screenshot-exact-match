/**
 * Advertising rules. No real ad network is integrated yet (ADS_ENABLED = false).
 * Ads must never interrupt reading a discovery, a quiz or an explanation, and are
 * always hidden for Premium members (Premium status comes from the server).
 */
export const ADS_ENABLED = false;

export type AdPlacement = "home-feed" | "explore-list" | "category-list";
export type ScreenContext = AdPlacement | "discovery-reading" | "quiz" | "quiz-explanation";

const FORBIDDEN: ReadonlySet<ScreenContext> = new Set([
  "discovery-reading",
  "quiz",
  "quiz-explanation",
]);

export function shouldShowAd(opts: {
  context: ScreenContext;
  isPremium: boolean;
  adsEnabled?: boolean;
}): boolean {
  const enabled = opts.adsEnabled ?? ADS_ENABLED;
  if (!enabled) return false;
  if (opts.isPremium) return false;
  return !FORBIDDEN.has(opts.context);
}
