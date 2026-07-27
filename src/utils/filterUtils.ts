import { SaleItem, PeriodFilter, DateRange } from '../types';
import { getTodayString } from './formatters';

// Concrete start/end (YYYY-MM-DD) that a given period filter resolves to "right now".
// Mirrors the boundaries used inside filterSalesByPeriodAndFilters below.
export function getPeriodDateRange(period: PeriodFilter, dateRange: DateRange): { start: string; end: string } {
  const today = getTodayString();
  const now = new Date();

  if (period === 'today') return { start: today, end: today };

  if (period === 'yesterday') {
    const yDate = new Date(now);
    yDate.setDate(yDate.getDate() - 1);
    const yStr = yDate.toISOString().split('T')[0];
    return { start: yStr, end: yStr };
  }

  if (period === 'this_week') {
    const curr = new Date(now);
    const first = curr.getDate() - curr.getDay();
    const monday = new Date(curr.setDate(first + 1)).toISOString().split('T')[0];
    return { start: monday, end: today };
  }

  if (period === 'weekend') {
    const day = now.getDay();
    const isoDay = day === 0 ? 7 : day;
    const monday = new Date(now);
    monday.setDate(now.getDate() - isoDay + 1);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: friday.toISOString().split('T')[0], end: sunday.toISOString().split('T')[0] };
  }

  if (period === 'last_7_days') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { start: d.toISOString().split('T')[0], end: today };
  }

  if (period === 'last_30_days') {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    return { start: d.toISOString().split('T')[0], end: today };
  }

  if (period === 'this_month') {
    const [y, m] = today.substring(0, 7).split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return { start: `${today.substring(0, 7)}-01`, end: `${today.substring(0, 7)}-${String(lastDay).padStart(2, '0')}` };
  }

  if (period === 'this_year') {
    const year = today.substring(0, 4);
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  }

  // custom
  return { start: dateRange.startDate || today, end: dateRange.endDate || today };
}

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

    if (period === 'weekend') {
      const day = now.getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb
      const isoDay = day === 0 ? 7 : day; // 1=Seg ... 7=Dom
      const monday = new Date(now);
      monday.setDate(now.getDate() - isoDay + 1);
      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const fridayStr = friday.toISOString().split('T')[0];
      const sundayStr = sunday.toISOString().split('T')[0];
      return saleDateStr >= fridayStr && saleDateStr <= sundayStr;
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
