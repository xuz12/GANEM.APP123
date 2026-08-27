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
    date: string;
    venue: {
      name: string;
    };
    status: {
      short: string;
    };
  };
  league: {
    round: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
    };
    away: {
      id: number;
      name: string;
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

    let totalUpdated = 0;
    const errors: string[] = [];

    const upcomingResponse = await fetch(
      "https://v3.football.api-sports.io/fixtures?league=307&season=2025&next=10",
      {
        headers: {
          "x-apisports-key": apiFootballKey,
        },
      }
    );

    if (!upcomingResponse.ok) {
      throw new Error(`API-Football error: ${upcomingResponse.statusText}`);
    }

    const upcomingData = await upcomingResponse.json();
    const upcomingFixtures: APIFootballFixture[] = upcomingData.response || [];

    for (const fixture of upcomingFixtures) {
      try {
        const { data: existingClubs } = await supabase
          .from("clubs")
          .select("id, name_en")
          .in("name_en", [fixture.teams.home.name, fixture.teams.away.name]);

        const homeClub = existingClubs?.find(
          (c) => c.name_en === fixture.teams.home.name
        );
        const awayClub = existingClubs?.find(
          (c) => c.name_en === fixture.teams.away.name
        );

        if (!homeClub || !awayClub) {
          errors.push(
            `Clubs not found for match: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`
          );
          continue;
        }

        const matchData = {
          external_id: fixture.fixture.id,
          home_club_id: homeClub.id,
          away_club_id: awayClub.id,
          match_date: fixture.fixture.date,
          kickoff_at: fixture.fixture.date,
          venue: fixture.fixture.venue.name,
          round: fixture.league.round,
          status: fixture.fixture.status.short,
          home_score: fixture.goals.home,
          away_score: fixture.goals.away,
          competition_type: "saudi_league",
        };

        const { error: upsertError } = await supabase
          .from("matches")
          .upsert(matchData, {
            onConflict: "external_id",
            ignoreDuplicates: false,
          });

        if (upsertError) {
          errors.push(`Error upserting match ${fixture.fixture.id}: ${upsertError.message}`);
        } else {
          totalUpdated++;
        }
      } catch (error) {
        errors.push(`Error processing fixture ${fixture.fixture.id}: ${error.message}`);
      }
    }

    const recentResponse = await fetch(
      "https://v3.football.api-sports.io/fixtures?league=307&season=2025&last=5",
      {
        headers: {
          "x-apisports-key": apiFootballKey,
        },
      }
    );

    if (recentResponse.ok) {
      const recentData = await recentResponse.json();
      const recentFixtures: APIFootballFixture[] = recentData.response || [];

      for (const fixture of recentFixtures) {
        try {
          const { error: updateError } = await supabase
            .from("matches")
            .update({
              status: fixture.fixture.status.short,
              home_score: fixture.goals.home,
              away_score: fixture.goals.away,
            })
            .eq("external_id", fixture.fixture.id);

          if (!updateError) {
            totalUpdated++;
          }
        } catch (error) {
          errors.push(`Error updating recent match ${fixture.fixture.id}: ${error.message}`);
        }
      }
    }

    await supabase.from("sync_logs").insert({
      sync_type: "matches",
      records_updated: totalUpdated,
      status: errors.length > 0 ? "error" : "success",
      error_message: errors.length > 0 ? errors.join("; ") : null,
      metadata: {
        upcoming_count: upcomingFixtures.length,
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
    console.error("Sync matches error:", error);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("sync_logs").insert({
      sync_type: "matches",
      records_updated: 0,
      status: "error",
      error_message: error.message,
    });

    return new Response(
      JSON.stringify({ error: "حدث خطأ أثناء مزامنة المباريات", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});