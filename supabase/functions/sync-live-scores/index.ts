import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface APIFootballFixture {
  fixture: {
    id: number;
    status: {
      short: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
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

    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    const { data: activeMatches } = await supabase
      .from("matches")
      .select("id, external_id")
      .gte("kickoff_at", threeHoursAgo)
      .in("status", ["NS", "LIVE"]);

    if (!activeMatches || activeMatches.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No active matches today. Skipping API call to save quota.",
          updated: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response = await fetch(
      "https://v3.football.api-sports.io/fixtures?league=307&live=all",
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
    const liveFixtures: APIFootballFixture[] = data.response || [];

    let totalUpdated = 0;
    const errors: string[] = [];

    for (const fixture of liveFixtures) {
      try {
        const { data: existingMatch } = await supabase
          .from("matches")
          .select("id, status")
          .eq("external_id", fixture.fixture.id)
          .maybeSingle();

        if (!existingMatch) {
          continue;
        }

        const { error: updateError } = await supabase
          .from("matches")
          .update({
            status: fixture.fixture.status.short,
            home_score: fixture.goals.home,
            away_score: fixture.goals.away,
          })
          .eq("external_id", fixture.fixture.id);

        if (updateError) {
          errors.push(`Error updating match ${fixture.fixture.id}: ${updateError.message}`);
        } else {
          totalUpdated++;

          if (
            existingMatch.status !== "FT" &&
            fixture.fixture.status.short === "FT"
          ) {
            console.log(`Match ${fixture.fixture.id} finished. Triggering post-match logic.`);
          }
        }
      } catch (error) {
        errors.push(`Error processing fixture ${fixture.fixture.id}: ${error.message}`);
      }
    }

    await supabase.from("sync_logs").insert({
      sync_type: "live_scores",
      records_updated: totalUpdated,
      status: errors.length > 0 ? "error" : "success",
      error_message: errors.length > 0 ? errors.join("; ") : null,
      metadata: {
        live_fixtures_count: liveFixtures.length,
        errors_count: errors.length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        updated: totalUpdated,
        live_matches: liveFixtures.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Sync live scores error:", error);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("sync_logs").insert({
      sync_type: "live_scores",
      records_updated: 0,
      status: "error",
      error_message: error.message,
    });

    return new Response(
      JSON.stringify({ error: "حدث خطأ أثناء مزامنة النتائج المباشرة", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});