import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, banned")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (!profile || profile.banned || !["ADMIN", "PROPRIETARIO", "OPERADOR"].includes(profile.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const userMessage: string = body.message || "";
    const history: ChatMessage[] = body.history || [];

    const { data: aiConfig } = await supabase
      .from("ai_config")
      .select("system_prompt, knowledge_base")
      .maybeSingle();

    const systemPrompt = aiConfig?.system_prompt || "Você é um assistente virtual da TEC+ Acessórios.";
    const knowledgeBase = aiConfig?.knowledge_base || "";

    const fullSystemPrompt = `${systemPrompt}\n\nBase de Conhecimento:\n${knowledgeBase}\n\nVocê tem acesso a ferramentas para consultar dados da loja. Use-as quando perguntarem sobre estoque, vendas, produtos, pedidos, etc.`;

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "Gemini API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tools = [
      {
        functionDeclarations: [
          {
            name: "get_product_stock",
            description: "Consulta o estoque de um produto pelo nome",
            parameters: {
              type: "object",
              properties: {
                product_name: { type: "string", description: "Nome do produto" },
              },
              required: ["product_name"],
            },
          },
          {
            name: "get_sales_today",
            description: "Retorna o número de vendas (pedidos) e total faturado hoje",
            parameters: { type: "object", properties: {} },
          },
          {
            name: "list_products",
            description: "Lista todos os produtos ativos com nome, preço e estoque",
            parameters: { type: "object", properties: {} },
          },
          {
            name: "get_orders_count",
            description: "Retorna a contagem de pedidos por status",
            parameters: { type: "object", properties: {} },
          },
        ],
      },
    ];

    const contents: any[] = [
      ...history.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      { role: "user", parts: [{ text: userMessage }] },
    ];

    let finalResponse = "";
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: fullSystemPrompt }] },
            contents,
            tools,
          }),
        }
      );

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        return new Response(JSON.stringify({ error: `Gemini API error: ${errText}` }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const geminiData = await geminiRes.json();
      const candidate = geminiData?.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      let functionCall: { name: string; args: any } | null = null;
      let textResponse = "";

      for (const part of parts) {
        if (part.functionCall) {
          functionCall = { name: part.functionCall.name, args: part.functionCall.args || {} };
        } else if (part.text) {
          textResponse += part.text;
        }
      }

      if (functionCall) {
        const fnResult = await executeFunctionCall(functionCall.name, functionCall.args, supabase);
        contents.push({ role: "model", parts: [{ functionCall: { name: functionCall.name, args: functionCall.args } }] });
        contents.push({ role: "user", parts: [{ functionResponse: { name: functionCall.name, response: { result: fnResult } } }] });
        continue;
      }

      finalResponse = textResponse;
      break;
    }

    if (!finalResponse) {
      finalResponse = "Desculpe, não consegui processar sua solicitação no momento.";
    }

    await supabase.from("ai_chat_history").insert([
      { user_id: userData.user.id, role: "user", content: userMessage },
      { user_id: userData.user.id, role: "assistant", content: finalResponse },
    ]);

    return new Response(JSON.stringify({ response: finalResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function executeFunctionCall(name: string, args: any, supabase: any): Promise<any> {
  try {
    switch (name) {
      case "get_product_stock": {
        const { data } = await supabase
          .from("products")
          .select("name, stock, price, active")
          .ilike("name", `%${args.product_name}%`)
          .maybeSingle();
        return data || { message: "Produto não encontrado" };
      }
      case "get_sales_today": {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const { data } = await supabase
          .from("orders")
          .select("total")
          .gte("created_at", startOfDay)
          .neq("status", "CANCELADO");
        const count = data?.length || 0;
        const total = data?.reduce((sum: number, o: any) => sum + Number(o.total), 0) || 0;
        return { vendas_hoje: count, faturamento_hoje: total.toFixed(2) };
      }
      case "list_products": {
        const { data } = await supabase
          .from("products")
          .select("name, price, stock")
          .eq("active", true)
          .order("name");
        return data || [];
      }
      case "get_orders_count": {
        const { data } = await supabase.from("orders").select("status");
        const counts: Record<string, number> = {};
        data?.forEach((o: any) => { counts[o.status] = (counts[o.status] || 0) + 1; });
        return counts;
      }
      default:
        return { error: "Unknown function" };
    }
  } catch (err) {
    return { error: err.message };
  }
}
