import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RedemptionRequest {
  encrypted_uid: string;
  partner_id: string;
  offer_id: string;
  reader_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { encrypted_uid, partner_id, offer_id, reader_id }: RedemptionRequest = await req.json();

    if (!encrypted_uid || !partner_id || !offer_id || !reader_id) {
      return new Response(
        JSON.stringify({ error: "بيانات مفقودة في الطلب" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const decrypted_uid = encrypted_uid;

    const { data: nfcIdentifier, error: nfcError } = await supabase
      .from("nfc_identifiers")
      .select("user_id, is_active")
      .eq("nfc_uid", decrypted_uid)
      .eq("is_active", true)
      .maybeSingle();

    if (nfcError || !nfcIdentifier) {
      return new Response(
        JSON.stringify({ error: "معرف NFC غير صالح أو غير مفعّل" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const user_id = nfcIdentifier.user_id;

    const { data: offer, error: offerError } = await supabase
      .from("partner_offers")
      .select("id, partner_id, title_ar, points_required, value_in_sar, is_active, valid_until, max_redemptions, current_redemptions")
      .eq("id", offer_id)
      .maybeSingle();

    if (offerError || !offer) {
      return new Response(
        JSON.stringify({ error: "العرض غير موجود" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (offer.partner_id !== partner_id) {
      return new Response(
        JSON.stringify({ error: "العرض لا ينتمي لهذا الشريك" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!offer.is_active) {
      return new Response(
        JSON.stringify({ error: "هذا العرض غير نشط حالياً" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (offer.valid_until && new Date(offer.valid_until) < new Date()) {
      return new Response(
        JSON.stringify({ error: "انتهت صلاحية هذا العرض" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (offer.max_redemptions && offer.current_redemptions >= offer.max_redemptions) {
      return new Response(
        JSON.stringify({ error: "تم استنفاد عدد الاستردادات المتاحة لهذا العرض" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("points, full_name")
      .eq("id", user_id)
      .maybeSingle();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: "ملف المستخدم غير موجود" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (userProfile.points < offer.points_required) {
      return new Response(
        JSON.stringify({
          error: "رصيد الغنائم غير كافٍ",
          required: offer.points_required,
          available: userProfile.points,
          shortfall: offer.points_required - userProfile.points,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const commissionAmount = offer.value_in_sar ? Number(offer.value_in_sar) * 0.15 : 0;

    const newBalance = userProfile.points - offer.points_required;

    await supabase
      .from("user_profiles")
      .update({ points: newBalance })
      .eq("id", user_id);

    await supabase.from("points_transactions").insert({
      user_id,
      points: -offer.points_required,
      transaction_type: "redemption",
      reference_id: offer_id,
      description: `استرداد عرض: ${offer.title_ar}`,
    });

    const { data: redemption, error: redemptionError } = await supabase
      .from("nfc_redemptions")
      .insert({
        user_id,
        partner_id,
        offer_id,
        points_used: offer.points_required,
        commission_amount: commissionAmount,
        reader_id,
        status: "completed",
        metadata: {
          user_name: userProfile.full_name,
          offer_title: offer.title_ar,
          offer_value: offer.value_in_sar,
        },
      })
      .select()
      .single();

    if (redemptionError) {
      await supabase
        .from("user_profiles")
        .update({ points: userProfile.points })
        .eq("id", user_id);

      return new Response(
        JSON.stringify({ error: "فشل تسجيل عملية الاسترداد" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await supabase.from("nfc_scan_logs").insert({
      user_id,
      match_id: null,
      nfc_uid: decrypted_uid,
      reader_id,
      scan_type: "redemption",
      metadata: {
        redemption_id: redemption.redemption_id,
        offer_id,
        partner_id,
        points_used: offer.points_required,
        commission: commissionAmount,
      },
    });

    await supabase
      .from("partner_offers")
      .update({ current_redemptions: (offer.current_redemptions || 0) + 1 })
      .eq("id", offer_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "تم استرداد العرض بنجاح",
        redemption_id: redemption.redemption_id,
        offer_title: offer.title_ar,
        points_deducted: offer.points_required,
        new_balance: newBalance,
        commission: commissionAmount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("NFC redemption error:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ أثناء معالجة الطلب", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});