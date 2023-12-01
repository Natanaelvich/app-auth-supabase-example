import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPA_URL") ?? "",
      Deno.env.get("SUPA_ANON_KEY") ?? ""
    );

    const { url } = req;
    const urlObject = new URL(url);
    const params = urlObject.searchParams;
    const postId = params.get('postId');

    const { data, error } = await supabase.from("comments").select("*").eq('post_id', postId);

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
