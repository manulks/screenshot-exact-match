export type PlanId = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  label: string;
  priceEuros: number;
  period: string;
}

/** Envisaged Premium prices. No real payment is active until the owner approves Stripe. */
export const PREMIUM_PLANS: readonly Plan[] = [
  { id: "monthly", label: "Mensuel", priceEuros: 2.99, period: "mois" },
  { id: "yearly", label: "Annuel", priceEuros: 19.99, period: "an" },
] as const;

export const FREE_FEATURES = [
  "Toutes les catégories",
  "Les cinq découvertes quotidiennes",
  "L'exploration libre",
  "Les quiz et leurs explications",
  "Les favoris",
  "L'historique et la progression",
] as const;

export const PREMIUM_FEATURES = [
  "Aucune publicité",
  "Archives complètes",
  "Recherche avancée",
  "Parcours thématiques approfondis",
  "Révisions personnalisées",
  "Statistiques détaillées",
] as const;

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

/** Yearly saving compared with paying monthly for 12 months, in percent (rounded). */
export function yearlySavingPercent(plans: readonly Plan[] = PREMIUM_PLANS): number {
  const monthly = plans.find((p) => p.id === "monthly")!;
  const yearly = plans.find((p) => p.id === "yearly")!;
  return Math.round((1 - yearly.priceEuros / (monthly.priceEuros * 12)) * 100);
}
