import { requireAdmin, supabaseAdmin } from "../../_lib/adminAuth";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método não permitido." });
  }

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
}
