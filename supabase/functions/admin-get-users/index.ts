import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: adminCheck } = await supabaseAdmin
      .from("admins")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!adminCheck) {
      return new Response(
        JSON.stringify({ error: "Not an admin" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: profiles } = await supabaseAdmin
      .from("user_profiles")
      .select(`
        *,
        favorite_club:clubs(name_ar)
      `)
      .order("created_at", { ascending: false });

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();

    const emailMap = new Map(
      authUsers?.users?.map(u => [u.id, u.email]) || []
    );

    const userIds = profiles?.map(u => u.id) || [];

    const { data: redemptionsData } = await supabaseAdmin
      .from("redemptions")
      .select("user_id")
      .in("user_id", userIds);

    const redemptionCounts = redemptionsData?.reduce((acc, r) => {
      acc[r.user_id] = (acc[r.user_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const formattedUsers = profiles?.map((user: any) => ({
      ...user,
      email: emailMap.get(user.id) || "غير متوفر",
      favorite_club: user.favorite_club?.name_ar || "غير محدد",
      rewards_redeemed: redemptionCounts[user.id] || 0,
    })) || [];

    return new Response(
      JSON.stringify({ users: formattedUsers }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
