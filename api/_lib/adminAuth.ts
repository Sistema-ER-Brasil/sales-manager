import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabaseAdmin = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

export interface AdminAuthResult {
  ok: boolean;
  userId: string;
  status: number;
  error: string;
}

export async function requireAdmin(req: any): Promise<AdminAuthResult> {
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
  if (profileError || !profile || (profile.role !== "admin" && profile.role !== "diretor")) {
    return { ok: false, userId: "", status: 403, error: "Apenas administradores ou diretores podem executar esta ação." };
  }

  return { ok: true, userId: userData.user.id, status: 200, error: "" };
}
