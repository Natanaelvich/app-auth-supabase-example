import { createClient } from "https://esm.sh/@supabase/supabase-js";

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPA_URL") ?? "",
      Deno.env.get("SUPA_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data, error } = await supabase.from("posts").select("*");

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ data }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(String(err?.message ?? err), { status: 500 });
  }
});
