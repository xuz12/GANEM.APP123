import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const INTERACTION_POINTS = {
  referral: 300,
  prediction: 150,
  complete_profile: 100,
  share_achievement: 100,
  rate_match: 50,
  man_of_match_vote: 100,
  partner_first_visit: 200,
  partner_spending: 50,
  rate_partner: 50,
};

interface AddInteractionRequest {
  actionType: string;
  matchId?: string;
  partnerId?: string;
  metadata?: any;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
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
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body: AddInteractionRequest = await req.json();
    const { actionType, matchId, partnerId, metadata } = body;

    if (!INTERACTION_POINTS[actionType]) {
      return new Response(
        JSON.stringify({ error: "نوع التفاعل غير صحيح" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const interactionDate = new Date().toISOString().split('T')[0];

    const { data: existingInteraction } = await supabase
      .from("user_interactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("action_type", actionType)
      .eq("interaction_date", interactionDate);

    if (matchId) {
      const duplicateWithMatch = existingInteraction?.find(
        (int: any) => int.match_id === matchId
      );
      if (duplicateWithMatch) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "تم تسجيل هذا التفاعل مسبقاً لهذه المباراة اليوم",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (actionType === 'share_achievement' && existingInteraction && existingInteraction.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "يمكنك مشاركة إنجاز واحد فقط يومياً",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let pointsEarned = INTERACTION_POINTS[actionType];

    if (actionType === 'partner_spending' && metadata?.amountSpent) {
      pointsEarned = Math.floor(metadata.amountSpent / 10) * 50;
    }

    await supabase.from("user_interactions").insert({
      user_id: user.id,
      action_type: actionType,
      match_id: matchId || null,
      partner_id: partnerId || null,
      points_earned: pointsEarned,
      metadata: metadata || {},
      interaction_date: interactionDate,
    });

    const { data: currentProfile } = await supabase
      .from("user_profiles")
      .select("points, total_points_earned")
      .eq("id", user.id)
      .maybeSingle();

    let description = "";
    switch (actionType) {
      case "referral":
        description = "مكافأة دعوة صديق";
        break;
      case "prediction":
        description = "مكافأة توقع صحيح";
        break;
      case "complete_profile":
        description = "مكافأة إكمال الملف الشخصي";
        break;
      case "share_achievement":
        description = "مكافأة مشاركة إنجاز";
        break;
      case "rate_match":
        description = "مكافأة تقييم المباراة";
        break;
      case "man_of_match_vote":
        description = "مكافأة التصويت لرجل المباراة";
        break;
      case "partner_first_visit":
        description = "مكافأة أول زيارة للشريك";
        break;
      case "partner_spending":
        description = `مكافأة الإنفاق عند الشريك (${metadata?.amountSpent || 0} ريال)`;
        break;
      case "rate_partner":
        description = "مكافأة تقييم الشريك";
        break;
      default:
        description = "مكافأة تفاعل";
    }

    await supabase.from("points_transactions").insert({
      user_id: user.id,
      points: pointsEarned,
      transaction_type: "interaction",
      reference_id: matchId || partnerId || null,
      description: description,
    });

    await supabase
      .from("user_profiles")
      .update({
        points: (currentProfile?.points || 0) + pointsEarned,
        total_points_earned: (currentProfile?.total_points_earned || 0) + pointsEarned,
      })
      .eq("id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        pointsEarned,
        actionType,
        description,
      }),
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
      JSON.stringify({ error: error.message || "حدث خطأ غير متوقع" }),
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
