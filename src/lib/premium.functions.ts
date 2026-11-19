import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Premium is decided by the server from the subscriptions table, never by the browser. */
export const getPremiumStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("is_premium", { _user_id: context.userId });
    if (error) {
      console.error("[premium] is_premium failed", error.message);
      return { isPremium: false, checked: false };
    }
    return { isPremium: data === true, checked: true };
  });
