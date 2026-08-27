import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CLUB_NAME_MAPPING: Record<string, string[]> = {
  "Al Hilal": ["الهلال", "Al Hilal", "Al-Hilal"],
  "Al Nassr": ["النصر", "Al Nassr", "Al-Nassr"],
  "Al Ittihad": ["الاتحاد", "Al Ittihad", "Al-Ittihad"],
  "Al Ahli": ["الأهلي", "Al Ahli", "Al-Ahli"],
  "Al Shabab": ["الشباب", "Al Shabab", "Al-Shabab"],
  "Al Qadsiah": ["القادسية", "Al Qadisiyah", "Al-Qadsiah", "Al Qadsiah"],
  "Al Fayha": ["الفيحاء", "Al Fayha", "Al-Fayha"],
  "Al Fateh": ["الفتح", "Al Fateh", "Al-Fateh"],
  "Al Raed": ["الرائد", "Al Raed", "Al-Raed"],
  "Damak": ["ضمك", "Damac", "Damak"],
  "Al Wahda": ["الوحدة", "Al Wehda", "Al-Wehda", "Al Wahda"],
  "Al Okhdood": ["الأخدود", "Al Okhdood", "Al-Okhdood"],
  "Al Riyadh": ["الرياض", "Al Riyadh", "Al-Riyadh"],
  "Al Hazm": ["الحزم", "Al Hazem", "Al-Hazm", "Al Hazm"],
  "Al Taawoun": ["التعاون", "Al Taawoun", "Al-Taawoun", "Al Taee"],
  "Al Khaleej": ["الخليج", "Al Khaleej", "Al-Khaleej"],
  "Al Ettifaq": ["الاتفاق", "Al Ettifaq", "Al-Ettifaq"],
  "Al Tai": ["الطائي", "Al Tai", "Al-Tai"],
};

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

    const { data: clubs } = await supabase
      .from("clubs")
      .select("id, name_ar, name_en, logo_url");

    if (!clubs) {
      throw new Error("Failed to fetch clubs");
    }

    const { data: teams } = await supabase.from("teams").select("*");

    if (!teams) {
      throw new Error("Failed to fetch teams from API-Football sync");
    }

    let updated = 0;
    const errors: string[] = [];

    for (const club of clubs) {
      try {
        let matchedTeam = null;

        for (const [teamName, variations] of Object.entries(CLUB_NAME_MAPPING)) {
          if (
            variations.some(
              (v) =>
                v.toLowerCase() === club.name_ar.toLowerCase() ||
                v.toLowerCase() === club.name_en.toLowerCase()
            )
          ) {
            matchedTeam = teams.find(
              (t) =>
                t.name_en.toLowerCase().includes(teamName.toLowerCase()) ||
                variations.some(
                  (v) =>
                    t.name_ar.toLowerCase().includes(v.toLowerCase()) ||
                    t.name_en.toLowerCase().includes(v.toLowerCase())
                )
            );
            break;
          }
        }

        if (!matchedTeam) {
          const directMatch = teams.find(
            (t) =>
              t.name_ar === club.name_ar ||
              t.name_en === club.name_en ||
              t.name_en.toLowerCase().includes(club.name_en.toLowerCase()) ||
              club.name_en.toLowerCase().includes(t.name_en.toLowerCase())
          );

          if (directMatch) {
            matchedTeam = directMatch;
          }
        }

        if (matchedTeam && matchedTeam.logo_url) {
          const { error: updateError } = await supabase
            .from("clubs")
            .update({ logo_url: matchedTeam.logo_url })
            .eq("id", club.id);

          if (updateError) {
            errors.push(
              `Failed to update logo for ${club.name_ar}: ${updateError.message}`
            );
          } else {
            updated++;
            console.log(
              `Updated ${club.name_ar} with logo from ${matchedTeam.name_en}`
            );
          }
        } else {
          errors.push(`No matching team found for ${club.name_ar} (${club.name_en})`);
        }
      } catch (error) {
        errors.push(`Error processing club ${club.name_ar}: ${error.message}`);
      }
    }

    await supabase.from("sync_logs").insert({
      sync_type: "teams",
      records_updated: updated,
      status: errors.length > 0 ? "error" : "success",
      error_message: errors.length > 0 ? errors.join("; ") : null,
      metadata: {
        operation: "sync_club_logos",
        total_clubs: clubs.length,
        errors_count: errors.length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        total_clubs: clubs.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Sync club logos error:", error);

    return new Response(
      JSON.stringify({
        error: "حدث خطأ أثناء مزامنة شعارات الأندية",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});