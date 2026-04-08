import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import {
  getAbsoluteCancelUrl,
  getAbsoluteSuccessUrl,
  getPriceId,
  getStripe,
  isBillingCycle,
  isPaidPlan,
  upsertPremiumSubscription,
} from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth header" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({
          error:
            "Missing Supabase Edge Function runtime variables: SUPABASE_URL or SUPABASE_ANON_KEY. Hosted Supabase functions normally provide these automatically.",
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id || !user.email) {
      return new Response(
        JSON.stringify({
          error: "Auth failed",
          details: authError?.message ?? "No authenticated user returned",
        }),
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    const body = await request.json();
    const plan = body?.plan;
    const billingCycle = body?.billingCycle;
    const successUrl = typeof body?.successUrl === "string" ? body.successUrl.trim() : "";
    const cancelUrl = typeof body?.cancelUrl === "string" ? body.cancelUrl.trim() : "";

    if (!isPaidPlan(plan)) {
      throw new Error("Invalid premium plan.");
    }

    if (!isBillingCycle(billingCycle)) {
      throw new Error("Invalid billing cycle.");
    }

    if (!successUrl || !cancelUrl) {
      throw new Error("Missing success or cancel URL for Stripe checkout.");
    }

    const stripe = getStripe();
    const priceId = getPriceId(plan, billingCycle);
    const finalSuccessUrl = getAbsoluteSuccessUrl(successUrl);
    const finalCancelUrl = getAbsoluteCancelUrl(cancelUrl);

    console.log("RAW successUrl from frontend:", successUrl);
    console.log("FINAL success_url sent to Stripe:", finalSuccessUrl);
    console.log("final cancel url", finalCancelUrl);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: false,
      customer_email: user.email,
      client_reference_id: user.id,
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        plan_tier: plan,
        billing_cycle: billingCycle,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          user_email: user.email,
          plan_tier: plan,
          billing_cycle: billingCycle,
        },
      },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    await upsertPremiumSubscription({
      user_id: user.id,
      email: user.email,
      plan_tier: plan,
      billing_cycle: billingCycle,
      status: "upgrade_pending",
      stripe_checkout_session_id: session.id,
      stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
      stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
    });

    return new Response(
      JSON.stringify({
        checkoutUrl: session.url,
        sessionId: session.id,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("stripe-create-checkout error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
