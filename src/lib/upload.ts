import { supabase } from './supabaseClient';

const MAX_DIMENSION = 512;

export function getLogoUrl(storagePath: string): string {
  return supabase.storage.from('logos').getPublicUrl(`${storagePath}.png`).data.publicUrl;
}

function resizeToPngBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Não foi possível processar a imagem.'));
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      const dataUrl = canvas.toDataURL('image/png', 0.9);
      resolve(dataUrl.split(',')[1]);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Arquivo de imagem inválido.'));
    };
    img.src = objectUrl;
  });
}

export async function uploadLogoImage(
  file: File,
  storagePath: string,
  getToken: () => Promise<string>
): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith('image/')) {
    return { error: 'Selecione um arquivo de imagem válido.' };
  }
  try {
    const dataBase64 = await resizeToPngBase64(file);
    const token = await getToken();
    const res = await fetch('/api/admin/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ path: `${storagePath}.png`, dataBase64, contentType: 'image/png' }),
    });
    const json = await res.json();
    if (!json.success) return { error: json.error || 'Falha ao enviar imagem.' };
    return { url: json.url };
  } catch (e: any) {
    return { error: e.message || 'Falha ao processar imagem.' };
  }
}
