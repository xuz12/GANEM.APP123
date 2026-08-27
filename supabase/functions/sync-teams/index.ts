import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TEAM_NAME_MAPPING: Record<string, string> = {
  "Al Hilal": "الهلال",
  "Al-Hilal": "الهلال",
  "Al Nassr": "النصر",
  "Al-Nassr": "النصر",
  "Al Ittihad": "الاتحاد",
  "Al-Ittihad": "الاتحاد",
  "Al Ahli": "الأهلي",
  "Al-Ahli": "الأهلي",
  "Al Shabab": "الشباب",
  "Al-Shabab": "الشباب",
  "Al Qadsiah": "القادسية",
  "Al-Qadsiah": "القادسية",
  "Al Fayha": "الفيحاء",
  "Al-Fayha": "الفيحاء",
  "Al Fateh": "الفتح",
  "Al-Fateh": "الفتح",
  "Al Raed": "الرائد",
  "Al-Raed": "الرائد",
  "Damak": "ضمك",
  "Al Wahda": "الوحدة",
  "Al-Wahda": "الوحدة",
  "Al Okhdood": "الأخدود",
  "Al-Okhdood": "الأخدود",
  "Al Riyadh": "الرياض",
  "Al-Riyadh": "الرياض",
  "Al Hazm": "الحزم",
  "Al-Hazm": "الحزم",
  "Al Taee": "التعاون",
  "Al-Taee": "التعاون",
  "Al Khaleej": "الخليج",
  "Al-Khaleej": "الخليج",
  "Al Taawoun": "التعاون",
  "Al-Taawoun": "التعاون",
};

interface APIFootballTeam {
  team: {
    id: number;
    name: string;
    logo: string;
  };
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
    const apiFootballKey = Deno.env.get("API_FOOTBALL_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!apiFootballKey) {
      throw new Error("API_FOOTBALL_KEY not configured");
    }

    const response = await fetch(
      "https://v3.football.api-sports.io/teams?league=307&season=2025",
      {
        headers: {
          "x-apisports-key": apiFootballKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API-Football error: ${response.statusText}`);
    }

    const data = await response.json();
    const teams: APIFootballTeam[] = data.response || [];

    let totalUpdated = 0;
    const errors: string[] = [];

    for (const teamData of teams) {
      try {
        const team = teamData.team;
        const logoResponse = await fetch(team.logo);

        if (!logoResponse.ok) {
          errors.push(`Failed to download logo for team ${team.id}: ${logoResponse.statusText}`);
          continue;
        }

        const logoBlob = await logoResponse.blob();
        const logoArrayBuffer = await logoBlob.arrayBuffer();
        const logoFileName = `${team.id}.png`;

        const { error: uploadError } = await supabase.storage
          .from("team-logos")
          .upload(logoFileName, logoArrayBuffer, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) {
          errors.push(`Failed to upload logo for team ${team.id}: ${uploadError.message}`);
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from("team-logos")
          .getPublicUrl(logoFileName);

        const logoUrl = publicUrlData.publicUrl;

        const nameAr = TEAM_NAME_MAPPING[team.name] || team.name;

        const { error: upsertError } = await supabase.from("teams").upsert(
          {
            team_id: team.id,
            name_en: team.name,
            name_ar: nameAr,
            logo_url: logoUrl,
          },
          {
            onConflict: "team_id",
            ignoreDuplicates: false,
          }
        );

        if (upsertError) {
          errors.push(`Error upserting team ${team.id}: ${upsertError.message}`);
        } else {
          totalUpdated++;
        }
      } catch (error) {
        errors.push(`Error processing team ${teamData.team.id}: ${error.message}`);
      }
    }

    await supabase.from("sync_logs").insert({
      sync_type: "teams",
      records_updated: totalUpdated,
      status: errors.length > 0 ? "error" : "success",
      error_message: errors.length > 0 ? errors.join("; ") : null,
      metadata: {
        total_teams: teams.length,
        errors_count: errors.length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        updated: totalUpdated,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Sync teams error:", error);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("sync_logs").insert({
      sync_type: "teams",
      records_updated: 0,
      status: "error",
      error_message: error.message,
    });

    return new Response(
      JSON.stringify({ error: "حدث خطأ أثناء مزامنة الفرق", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});