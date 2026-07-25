import { SaleItem, PeriodFilter, DateRange } from '../types';
import { getTodayString } from './formatters';

export function filterSalesByPeriodAndFilters(
  sales: SaleItem[],
  period: PeriodFilter,
  dateRange: DateRange,
  selectedMarketplace: string = 'ALL',
  selectedCompany: string = 'ALL'
): SaleItem[] {
  const today = getTodayString();
  const now = new Date();

  return sales.filter((sale) => {
    // Marketplace filter
    if (selectedMarketplace !== 'ALL' && sale.marketplaceId !== selectedMarketplace) {
      return false;
    }

    // Company filter
    if (selectedCompany !== 'ALL' && sale.companyId !== selectedCompany) {
      return false;
    }

    // Date / Period filter
    const saleDateStr = sale.date; // YYYY-MM-DD
    if (!saleDateStr) return true;

    if (period === 'today') {
      return saleDateStr === today;
    }

    if (period === 'yesterday') {
      const yDate = new Date(now);
      yDate.setDate(yDate.getDate() - 1);
      const yStr = yDate.toISOString().split('T')[0];
      return saleDateStr === yStr;
    }

    if (period === 'this_week') {
      const curr = new Date(now);
      const first = curr.getDate() - curr.getDay(); // Sunday
      const monday = new Date(curr.setDate(first + 1)).toISOString().split('T')[0];
      return saleDateStr >= monday && saleDateStr <= today;
    }

    if (period === 'last_7_days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      const startStr = d.toISOString().split('T')[0];
      return saleDateStr >= startStr && saleDateStr <= today;
    }

    if (period === 'last_30_days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      const startStr = d.toISOString().split('T')[0];
      return saleDateStr >= startStr && saleDateStr <= today;
    }

    if (period === 'this_month') {
      const currentYearMonth = today.substring(0, 7); // YYYY-MM
      return saleDateStr.startsWith(currentYearMonth);
    }

    if (period === 'this_year') {
      const currentYear = today.substring(0, 4); // YYYY
      return saleDateStr.startsWith(currentYear);
    }

    if (period === 'custom') {
      if (dateRange.startDate && dateRange.endDate) {
        return saleDateStr >= dateRange.startDate && saleDateStr <= dateRange.endDate;
      }
    }

    return true;
  });
}
