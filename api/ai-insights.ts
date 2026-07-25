import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método não permitido." });
  }

  try {
    const { metrics } = req.body || {};
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
}
