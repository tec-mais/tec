import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const adminEmail = "admin@tecmais.com";
    const adminPassword = "AdminTecMais2026!";
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) throw listError;

    const found = users.users.find((user) => user.email?.toLowerCase() === adminEmail);
    let adminId: string;

    if (found) {
      adminId = found.id;
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { full_name: "Admin Master" },
      });

      if (createError || !newUser.user) {
        throw createError || new Error("Não foi possível criar o administrador.");
      }

      adminId = newUser.user.id;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: adminId,
      email: adminEmail,
      full_name: "Admin Master",
      role: "ADMIN",
      banned: false,
    }, { onConflict: "id" });

    if (profileError) throw profileError;

    return new Response(
      JSON.stringify({ success: true, message: "Admin account ready", admin_id: adminId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao preparar o administrador.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
