import { requireAdmin, supabaseAdmin } from "../_lib/adminAuth.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método não permitido." });
  }

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
}
