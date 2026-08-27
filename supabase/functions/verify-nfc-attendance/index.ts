import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VerifyAttendanceRequest {
  encrypted_uid: string;
  match_id: string;
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

    const { encrypted_uid, match_id, reader_id }: VerifyAttendanceRequest = await req.json();

    if (!encrypted_uid || !match_id || !reader_id) {
      return new Response(
        JSON.stringify({ error: "معرف NFC أو معرف المباراة أو معرف القارئ مفقود" }),
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

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, match_date, match_type, attendance_points, home_club:clubs!matches_home_club_id_fkey(name_ar), away_club:clubs!matches_away_club_id_fkey(name_ar)")
      .eq("id", match_id)
      .maybeSingle();

    if (matchError || !match) {
      return new Response(
        JSON.stringify({ error: "المباراة غير موجودة" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const matchDate = new Date(match.match_date);
    const currentDate = new Date();
    const twoHoursBefore = new Date(matchDate.getTime() - 2 * 60 * 60 * 1000);
    const twoHoursAfter = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000);

    if (currentDate < twoHoursBefore || currentDate > twoHoursAfter) {
      return new Response(
        JSON.stringify({ error: "المباراة غير متاحة للتسجيل الآن. يمكن التسجيل قبل ساعتين من المباراة وحتى ساعتين بعدها." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: existingScan, error: scanCheckError } = await supabase
      .from("nfc_scan_logs")
      .select("id")
      .eq("user_id", user_id)
      .eq("match_id", match_id)
      .eq("scan_type", "attendance")
      .maybeSingle();

    if (existingScan) {
      return new Response(
        JSON.stringify({ error: "تم تسجيل حضورك لهذه المباراة مسبقاً" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let pointsEarned = match.attendance_points || 1000;
    if (match.match_type === "derby") pointsEarned = 1500;
    else if (match.match_type === "final") pointsEarned = 2000;
    else if (match.match_type === "afc") pointsEarned = 2500;

    const ministryGrant = 333;
    const earlyArrivalBonus = currentDate <= new Date(matchDate.getTime() - 90 * 60 * 1000) ? 200 : 0;
    const totalPoints = pointsEarned + ministryGrant + earlyArrivalBonus;

    const { data: currentProfile } = await supabase
      .from("user_profiles")
      .select("points, total_points_earned, matches_attended")
      .eq("id", user_id)
      .maybeSingle();

    const newPoints = (currentProfile?.points || 0) + totalPoints;
    const newTotalEarned = (currentProfile?.total_points_earned || 0) + totalPoints;
    const newMatchesAttended = (currentProfile?.matches_attended || 0) + 1;

    await supabase.from("points_transactions").insert([
      {
        user_id,
        points: pointsEarned,
        transaction_type: "match_attendance",
        reference_id: match_id,
        description: `حضور مباراة ${match.home_club.name_ar} ضد ${match.away_club.name_ar}`,
      },
      {
        user_id,
        points: ministryGrant,
        transaction_type: "government_grant",
        reference_id: match_id,
        description: `منحة وزارة الرياضة - حضور مباراة ${match.home_club.name_ar} ضد ${match.away_club.name_ar}`,
      },
      ...(earlyArrivalBonus > 0 ? [{
        user_id,
        points: earlyArrivalBonus,
        transaction_type: "early_arrival_bonus",
        reference_id: match_id,
        description: `مكافأة الوصول المبكر - ${match.home_club.name_ar} ضد ${match.away_club.name_ar}`,
      }] : []),
    ]);

    await supabase
      .from("user_profiles")
      .update({
        points: newPoints,
        total_points_earned: newTotalEarned,
        matches_attended: newMatchesAttended,
      })
      .eq("id", user_id);

    await supabase.from("nfc_scan_logs").insert({
      user_id,
      match_id,
      nfc_uid: decrypted_uid,
      reader_id,
      scan_type: "attendance",
      metadata: {
        points_earned: pointsEarned,
        ministry_grant: ministryGrant,
        early_arrival_bonus: earlyArrivalBonus,
        total_points: totalPoints,
      },
    });

    await supabase.from("attendance_records").insert({
      user_id,
      match_id,
      verification_method: "nfc",
      points_earned: totalPoints,
      verification_data: {
        reader_id,
        nfc_uid_hash: decrypted_uid.substring(0, 8),
        breakdown: {
          attendance: pointsEarned,
          ministry_grant: ministryGrant,
          early_arrival: earlyArrivalBonus,
        },
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "تم تسجيل حضورك بنجاح",
        points_breakdown: {
          attendance: pointsEarned,
          ministry_grant: ministryGrant,
          early_arrival_bonus: earlyArrivalBonus,
          total: totalPoints,
        },
        new_balance: newPoints,
        matches_attended: newMatchesAttended,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("NFC attendance verification error:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ أثناء معالجة الطلب", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});