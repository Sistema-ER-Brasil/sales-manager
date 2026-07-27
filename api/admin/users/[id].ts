import { requireAdmin, supabaseAdmin } from "../../_lib/adminAuth.js";

export default async function handler(req: any, res: any) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ success: false, error: auth.error });

  const { id } = req.query;

  if (req.method === "PATCH") {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ success: false, error: "Nenhuma senha informada para atualização." });
    }
    const { error } = await supabaseAdmin!.auth.admin.updateUserById(id, { password });
    if (error) return res.status(400).json({ success: false, error: error.message });
    return res.json({ success: true });
  }

  if (req.method === "DELETE") {
    if (id === auth.userId) {
      return res.status(400).json({ success: false, error: "Você não pode excluir seu próprio usuário." });
    }
    const { error } = await supabaseAdmin!.auth.admin.deleteUser(id);
    if (error) return res.status(400).json({ success: false, error: error.message });
    return res.json({ success: true });
  }

  res.status(405).json({ success: false, error: "Método não permitido." });
}
