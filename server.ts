import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "10mb" }));

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAdmin = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

interface AdminAuthResult {
  ok: boolean;
  userId: string;
  status: number;
  error: string;
}

async function requireAdmin(req: express.Request): Promise<AdminAuthResult> {
  if (!supabaseAdmin) return { ok: false, userId: "", status: 500, error: "Supabase (service role) não configurado no servidor." };

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return { ok: false, userId: "", status: 401, error: "Token de autenticação ausente." };

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) return { ok: false, userId: "", status: 401, error: "Sessão inválida ou expirada." };

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (profileError || !profile || profile.role !== "admin") {
    return { ok: false, userId: "", status: 403, error: "Apenas administradores podem executar esta ação." };
  }

  return { ok: true, userId: userData.user.id, status: 200, error: "" };
}

// AI Insights endpoint using Gemini
app.post("/api/ai-insights", async (req, res) => {
  try {
    const { metrics } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        success: true,
        insight: `### 📊 Análise Geral do Dia
- **Faturamento Atual**: R$ ${metrics?.todayRevenue ? metrics.todayRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00"}
- **Total de Pedidos**: ${metrics?.todayOrders || 0}
- **Ticket Médio**: R$ ${metrics?.todayTicket ? metrics.todayTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00"}

*Dica*: Adicione a chave \`GEMINI_API_KEY\` nas configurações para desbloquear resumos executivos em tempo real gerados por Inteligência Artificial.`,
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Você é um Diretor Executivo de E-commerce e Especialista em Vendas de Marketplaces (Shopee, Mercado Livre, Amazon, Magalu, Shein, etc.).
Analise os seguintes dados consolidados de vendas do sistema "Marketplace Sales Manager":

Resumo de Vendas:
- Faturamento Hoje: R$ ${metrics?.todayRevenue || 0}
- Pedidos Hoje: ${metrics?.todayOrders || 0}
- Ticket Médio: R$ ${metrics?.todayTicket || 0}
- Desempenho por CNPJ: ${JSON.stringify(metrics?.cnpjBreakdown || {})}
- Desempenho por Marketplace: ${JSON.stringify(metrics?.marketplaceBreakdown || {})}

Forneça um relatório analítico curto, direto, executivo e acionável em Markdown (em português brasileiro), contendo:
1. **Destaques do Dia**: Qual CNPJ e Marketplace estão liderando e por quê.
2. **Pontos de Atenção**: Onde o faturamento está abaixo da meta ou necessita de estímulo.
3. **3 Ações Recomendadas**: Recomendações estratégicas rápidas para a equipe comercial/expedição hoje.
3. **Previsão**: Tendência para os próximos dias com base no ticket médio e volume.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({
      success: true,
      insight: response.text || "Análise concluída com sucesso.",
    });
  } catch (error: any) {
    console.error("AI Insights Error:", error);
    res.status(500).json({
      success: false,
      error: "Falha ao gerar análise de IA: " + error.message,
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ---- Admin user management (requires service-role key; never exposed to the client) ----

app.post("/api/admin/users", async (req, res) => {
  const auth = await requireAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ success: false, error: auth.error });

  const { email, password, name, role, assignedMarketplaces, assignedCompanies } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ success: false, error: "Nome, e-mail e senha são obrigatórios." });
  }

  const { data, error } = await supabaseAdmin!.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error || !data.user) {
    return res.status(400).json({ success: false, error: error?.message || "Falha ao criar usuário." });
  }

  const { error: profileError } = await supabaseAdmin!
    .from("profiles")
    .update({
      name,
      role: role || "user",
      assigned_marketplaces: [
        ...(assignedMarketplaces || []),
        ...(assignedCompanies || []).map((c: string) => `cnpj:${c}`),
      ],
    })
    .eq("id", data.user.id);
  if (profileError) {
    return res.status(400).json({ success: false, error: profileError.message });
  }

  res.json({ success: true, id: data.user.id });
});

app.patch("/api/admin/users/:id", async (req, res) => {
  const auth = await requireAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ success: false, error: auth.error });

  const { id } = req.params;
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ success: false, error: "Nenhuma senha informada para atualização." });
  }

  const { error } = await supabaseAdmin!.auth.admin.updateUserById(id, { password });
  if (error) return res.status(400).json({ success: false, error: error.message });

  res.json({ success: true });
});

app.delete("/api/admin/users/:id", async (req, res) => {
  const auth = await requireAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ success: false, error: auth.error });

  const { id } = req.params;
  if (id === auth.userId) {
    return res.status(400).json({ success: false, error: "Você não pode excluir seu próprio usuário." });
  }

  const { error } = await supabaseAdmin!.auth.admin.deleteUser(id);
  if (error) return res.status(400).json({ success: false, error: error.message });

  res.json({ success: true });
});

app.post("/api/admin/upload-image", async (req, res) => {
  const auth = await requireAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ success: false, error: auth.error });

  const { path: filePath, dataBase64, contentType } = req.body || {};
  if (!filePath || !dataBase64) {
    return res.status(400).json({ success: false, error: "Arquivo ou caminho ausente." });
  }
  if (!/^(avatars|companies|marketplaces)\/[\w.-]+$/.test(filePath)) {
    return res.status(400).json({ success: false, error: "Caminho de arquivo inválido." });
  }

  const buffer = Buffer.from(dataBase64, "base64");
  const { error } = await supabaseAdmin!.storage
    .from("logos")
    .upload(filePath, buffer, { contentType: contentType || "image/png", upsert: true });
  if (error) return res.status(400).json({ success: false, error: error.message });

  const { data } = supabaseAdmin!.storage.from("logos").getPublicUrl(filePath);
  res.json({ success: true, url: `${data.publicUrl}?t=${Date.now()}` });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
