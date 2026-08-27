import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VerifyAttendanceRequest {
  matchId: string;
  method: 'geofence' | 'qr' | 'nfc';
  data: {
    lat?: number;
    lng?: number;
    qrCode?: string;
    nfcTag?: string;
  };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
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

    const body: VerifyAttendanceRequest = await req.json();
    const { matchId, method, data } = body;

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select(`
        *,
        home_club:clubs!matches_home_club_id_fkey(*),
        away_club:clubs!matches_away_club_id_fkey(*)
      `)
      .eq("id", matchId)
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

    const { data: existingAttendance } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("user_id", user.id)
      .eq("match_id", matchId)
      .maybeSingle();

    if (existingAttendance) {
      return new Response(
        JSON.stringify({ error: "لقد سجلت حضورك لهذه المباراة مسبقاً" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let verified = false;
    let verificationData: any = {};

    if (method === 'geofence') {
      if (!data.lat || !data.lng) {
        return new Response(
          JSON.stringify({ error: "الموقع مطلوب للتحقق الجغرافي" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const distance = calculateDistance(
        data.lat,
        data.lng,
        Number(match.stadium_lat),
        Number(match.stadium_lng)
      );

      const radius = match.home_club.geofence_radius || 200;
      verified = distance <= radius;
      verificationData = {
        distance,
        radius,
        userLat: data.lat,
        userLng: data.lng,
      };
    } else if (method === 'qr') {
      verified = data.qrCode === match.qr_code;
      verificationData = { qrCode: data.qrCode };
    } else if (method === 'nfc') {
      verified = match.nfc_tags?.includes(data.nfcTag || '');
      verificationData = { nfcTag: data.nfcTag };
    }

    if (!verified) {
      return new Response(
        JSON.stringify({ error: "فشل التحقق من الحضور" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const matchDate = new Date(match.match_date);
    const now = new Date();
    const fortyFiveMinBefore = new Date(matchDate.getTime() - 45 * 60 * 1000);
    const earlyArrival = now < fortyFiveMinBefore;

    const matchType = match.match_type || 'regular';
    let attendancePoints = match.attendance_points || 1000;

    if (matchType === 'derby') attendancePoints = 1500;
    else if (matchType === 'final') attendancePoints = 2000;
    else if (matchType === 'afc') attendancePoints = 2500;

    const earlyArrivalBonus = earlyArrival ? 200 : 0;
    const totalPoints = attendancePoints + earlyArrivalBonus;

    const { error: attendanceError } = await supabase
      .from("attendance_records")
      .insert({
        user_id: user.id,
        match_id: matchId,
        verification_method: method,
        points_earned: totalPoints,
        early_arrival_bonus: earlyArrival,
        lat: data.lat,
        lng: data.lng,
        verification_data: verificationData,
      });

    if (attendanceError) {
      throw attendanceError;
    }

    const { data: currentProfile } = await supabase
      .from("user_profiles")
      .select("points, total_points_earned, matches_attended")
      .eq("id", user.id)
      .maybeSingle();

    await supabase.from("points_transactions").insert({
      user_id: user.id,
      points: attendancePoints,
      transaction_type: "match_attendance",
      reference_id: matchId,
      description: `حضور مباراة ${match.home_club.name_ar} ضد ${match.away_club.name_ar}`,
    });

    if (earlyArrival) {
      await supabase.from("points_transactions").insert({
        user_id: user.id,
        points: earlyArrivalBonus,
        transaction_type: "early_arrival",
        reference_id: matchId,
        description: "مكافأة الحضور المبكر",
      });
    }

    const newMatchesAttended = (currentProfile?.matches_attended || 0) + 1;

    await supabase
      .from("user_profiles")
      .update({
        points: (currentProfile?.points || 0) + totalPoints,
        total_points_earned: (currentProfile?.total_points_earned || 0) + totalPoints,
        matches_attended: newMatchesAttended,
      })
      .eq("id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        pointsEarned: attendancePoints,
        earlyArrivalBonus: earlyArrivalBonus,
        totalPoints: totalPoints,
        earlyArrival,
        matchType,
        matchesAttended: newMatchesAttended,
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
