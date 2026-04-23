import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an experienced youth football coaching assistant inside the Trak app.
You help the coach plan training sessions and suggest drills.

Style:
- Concise, practical, age-appropriate.
- Use markdown with clear headings and bullet points.
- When asked for a session plan, structure it as: Warm-up (10–15 min) → Technical (15–20 min) → Tactical / Game-related (15–20 min) → Game (10–15 min) → Cool-down (5 min). Include duration, setup, and 2–3 coaching points per block.
- When asked for drills, give 3 distinct options with: name, focus, setup, duration, key coaching points, progression.
- If squad context is provided, reference player names, positions, and weak areas naturally.
- Never fabricate stats. If you don't know, say so.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { messages, includeSquadContext } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build squad context if requested
    let contextBlock = "";
    if (includeSquadContext) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: squad } = await supabase
          .from("squad_players")
          .select("id, player_name, position, age, shirt_number")
          .eq("coach_user_id", user.id)
          .limit(50);

        if (squad && squad.length > 0) {
          // Recent assessments (last 30 days) — average per player per category
          const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          const { data: assessments } = await supabase
            .from("coach_assessments")
            .select("squad_player_id, technique, tactical, attitude, work_rate, physical")
            .eq("coach_user_id", user.id)
            .gte("created_at", since);

          const byPlayer: Record<string, { count: number; technique: number; tactical: number; attitude: number; work_rate: number; physical: number }> = {};
          (assessments || []).forEach((a: any) => {
            const k = a.squad_player_id;
            byPlayer[k] = byPlayer[k] || { count: 0, technique: 0, tactical: 0, attitude: 0, work_rate: 0, physical: 0 };
            byPlayer[k].count += 1;
            byPlayer[k].technique += a.technique;
            byPlayer[k].tactical += a.tactical;
            byPlayer[k].attitude += a.attitude;
            byPlayer[k].work_rate += a.work_rate;
            byPlayer[k].physical += a.physical;
          });

          const lines = squad.map((p: any) => {
            const agg = byPlayer[p.id];
            if (!agg) return `- ${p.player_name} (${p.position || "—"}, age ${p.age ?? "—"}): no recent assessments`;
            const avg = (n: number) => (n / agg.count).toFixed(1);
            return `- ${p.player_name} (${p.position || "—"}, age ${p.age ?? "—"}): tech ${avg(agg.technique)}, tact ${avg(agg.tactical)}, att ${avg(agg.attitude)}, work ${avg(agg.work_rate)}, phys ${avg(agg.physical)} (last 30d, n=${agg.count})`;
          });

          contextBlock = `\n\nSquad snapshot (use only if relevant to the coach's question):\n${lines.join("\n")}`;
        }
      }
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextBlock },
          ...messages,
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached, please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in your Lovable workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("coach-assistant error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});