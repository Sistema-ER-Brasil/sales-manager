import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toJpeg } from 'html-to-image';
import { formatCurrency, formatDateBR } from './formatters';

export function exportToExcel(filename: string, sheetName: string, data: Record<string, any>[]) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToCSV(filename: string, data: Record<string, any>[]) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportSalesToPDF(title: string, headers: string[], rows: any[][], filename: string) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(title, 40, 40);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 40, 58);

  autoTable(doc, {
    startY: 70,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8,
      cellPadding: 5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  doc.save(`${filename}.pdf`);
}

export interface MatrixExportParams {
  companies: { id: string; name: string; code: string; marketplaceIds?: string[] }[];
  matrixData: {
    marketplaceId: string;
    marketplaceName: string;
    color: string;
    totalQty: number;
    totalVal: number;
    [key: string]: any;
  }[];
  matrixTotalQty: number;
  matrixTotalRev: number;
  periodLabel: string;
  filename: string;
}

export async function exportMatrixToJpeg({
  companies,
  matrixData,
  matrixTotalQty,
  matrixTotalRev,
  periodLabel,
  filename,
}: MatrixExportParams): Promise<boolean> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '1200px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  container.style.padding = '32px';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-9999';
  container.style.opacity = '0.01';
  container.style.pointerEvents = 'none';

  const companyHeadersHtml = companies
    .map(
      (c) => `
      <th style="padding: 12px 10px; text-align: center; border-left: 1px solid #1e293b; font-size: 11px; background-color: #0f172a; color: #ffffff;">
        <div style="font-weight: 800; font-size: 12px; color: #ffffff;">${c.code}</div>
        <div style="font-size: 9px; color: #94a3b8; font-weight: normal; margin-top: 2px;">Qtde | R$</div>
      </th>
    `
    )
    .join('');

  const bodyRowsHtml = matrixData
    .map((row, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      const companyCellsHtml = companies
        .map((c) => {
          const q = row[`${c.code}_qty`] || 0;
          const v = row[`${c.code}_val`] || 0;
          const isLinked = (c.marketplaceIds || []).includes(row.marketplaceId);
          if (q > 0) {
            return `
              <td style="padding: 12px 10px; text-align: center; border-left: 1px solid #e2e8f0; font-size: 11px; background-color: ${bg}; color: #0f172a;">
                <span style="color: #64748b; margin-right: 4px;">${q} un</span>
                <span style="font-weight: 700; color: #0f172a;">${formatCurrency(v)}</span>
              </td>
            `;
          }
          if (isLinked) {
            return `
              <td style="padding: 12px 10px; text-align: center; border-left: 1px solid #e2e8f0; font-size: 11px; background-color: ${bg}; color: #94a3b8;">
                <span style="margin-right: 4px;">0 un</span>
                <span>${formatCurrency(0)}</span>
              </td>
            `;
          }
          return `
            <td style="padding: 12px 10px; text-align: center; border-left: 1px solid #e2e8f0; color: #cbd5e1; font-size: 10px; background-color: #f1f5f9;">
              — não vinculado
            </td>
          `;
        })
        .join('');

      return `
        <tr style="background-color: ${bg}; border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 14px; font-weight: 700; color: #0f172a; font-size: 12px; background-color: ${bg};">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${row.color || '#3b82f6'};"></span>
              <span>${row.marketplaceName}</span>
            </div>
          </td>
          ${companyCellsHtml}
          <td style="padding: 12px 14px; text-align: right; font-weight: 800; border-left: 1px solid #e2e8f0; background-color: #f1f5f9; color: #1d4ed8; font-size: 12px;">
            <div style="font-size: 11px; color: #475569;">${row.totalQty} un</div>
            <div>${formatCurrency(row.totalVal)}</div>
          </td>
        </tr>
      `;
    })
    .join('');

  const companyTotalsHtml = companies
    .map((c) => {
      const cTotVal = matrixData.reduce((acc, r) => acc + (r[`${c.code}_val`] || 0), 0);
      const cTotQty = matrixData.reduce((acc, r) => acc + (r[`${c.code}_qty`] || 0), 0);
      return `
        <td style="padding: 14px 10px; text-align: center; border-left: 1px solid #cbd5e1; font-size: 11px; background-color: #f1f5f9;">
          <div style="font-size: 11px; color: #334155;">${cTotQty} un</div>
          <div style="font-weight: 800; color: #1d4ed8; font-size: 12px; margin-top: 2px;">${formatCurrency(cTotVal)}</div>
        </td>
      `;
    })
    .join('');

  const nowFormatted = new Date().toLocaleString('pt-BR');

  container.innerHTML = `
    <div style="border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <div style="font-size: 10px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
            Relatório Executivo de Vendas
          </div>
          <h2 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase;">
            Matriz Consolidada de Vendas (Plataforma x CNPJ)
          </h2>
          <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">
            Consolidação executiva de volume de itens e faturamento por canal de vendas e empresa do grupo.
          </p>
        </div>
        <div style="text-align: right; background-color: #f8fafc; padding: 10px 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="font-size: 11px; font-weight: 700; color: #334155;">Período: <span style="color: #2563eb;">${periodLabel}</span></div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Gerado em: ${nowFormatted}</div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="background-color: #0f172a; color: #ffffff; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
            <th style="padding: 12px 14px; border-top-left-radius: 8px; font-weight: 800; background-color: #0f172a; color: #ffffff;">Plataforma</th>
            ${companyHeadersHtml}
            <th style="padding: 12px 14px; text-align: right; border-left: 1px solid #1e293b; border-top-right-radius: 8px; background-color: #1e3a8a; color: #93c5fd; font-weight: 800;">
              Total Geral
            </th>
          </tr>
        </thead>
        <tbody>
          ${bodyRowsHtml}
        </tbody>
        <tfoot>
          <tr style="background-color: #f1f5f9; font-weight: 800; color: #0f172a; border-top: 2px solid #cbd5e1;">
            <td style="padding: 14px; font-size: 11px; text-transform: uppercase; color: #0f172a; background-color: #f1f5f9;">TOTAL GERAL</td>
            ${companyTotalsHtml}
            <td style="padding: 14px; text-align: right; border-left: 1px solid #cbd5e1; background-color: #2563eb; color: #ffffff; border-bottom-right-radius: 8px;">
              <div style="font-size: 11px; color: #bfdbfe;">${matrixTotalQty} un</div>
              <div style="font-size: 14px; font-weight: 900; margin-top: 2px;">${formatCurrency(matrixTotalRev)}</div>
            </td>
          </tr>
        </tfoot>
      </table>

      <div style="margin-top: 20px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px;">
        Documento gerado automaticamente pelo Sistema de Gestão e Metas de Vendas
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const width = container.offsetWidth || 1200;
    const height = container.offsetHeight || 600;

    const dataUrl = await toJpeg(container, {
      width,
      height,
      quality: 0.98,
      backgroundColor: '#ffffff',
      pixelRatio: 2,
      style: {
        opacity: '1',
        visibility: 'visible',
      },
    });

    const link = document.createElement('a');
    link.download = `${filename}.jpg`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('Erro ao exportar Matriz em JPG:', err);
    return false;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

export async function exportElementToJpeg(element: HTMLElement, filename: string): Promise<boolean> {
  const root = document.documentElement;
  const hadDark = root.classList.contains('dark');
  try {
    if (hadDark) {
      root.classList.remove('dark');
    }
    const dataUrl = await toJpeg(element, {
      quality: 0.98,
      backgroundColor: '#ffffff',
      cacheBust: true,
      pixelRatio: 2, // High resolution
      style: {
        backgroundColor: '#ffffff',
        color: '#0f172a',
      },
      filter: (node) => {
        if (node instanceof HTMLElement) {
          if (node.tagName === 'BUTTON' || node.getAttribute('data-export-ignore') === 'true') {
            return false;
          }
        }
        return true;
      },
    });
    const link = document.createElement('a');
    link.download = `${filename}.jpg`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error('Erro ao exportar elemento para JPG:', error);
    return false;
  } finally {
    if (hadDark) {
      root.classList.add('dark');
    }
  }
}

