import { COUNTRIES, SPVS, spvOf, SITES } from '@/data/demo';
import type { Entry } from '@/state';

export type LiasseLine = { spvId: string; name: string; country: string; ownership: number; revenue: number; charges: number; interco: number; ebitda: number; share: number };

const fx = (spvId: string) => COUNTRIES.find((c) => c.id === spvOf(spvId)!.countryId)!.fxToEur;

/** Liasse de consolidation (EUR) à partir des écritures d'une période. */
export function buildLiasse(entries: Entry[], period: string, eliminate = true): { lines: LiasseLine[]; total: LiasseLine } {
  const lines: LiasseLine[] = SPVS.map((spv) => {
    const es = entries.filter((e) => e.period === period && e.spvId === spv.id);
    const r = fx(spv.id);
    const revenue = es.filter((e) => e.account === '70' && !(eliminate && e.interco)).reduce((a, e) => a + e.credit, 0) / r;
    const charges = es.filter((e) => e.account.startsWith('6') && !(eliminate && e.interco)).reduce((a, e) => a + e.debit, 0) / r;
    const interco = es.filter((e) => e.interco).reduce((a, e) => a + e.debit - e.credit, 0) / r;
    const ebitda = revenue - charges;
    return {
      spvId: spv.id,
      name: spv.name,
      country: COUNTRIES.find((c) => c.id === spv.countryId)!.name,
      ownership: spv.ownership,
      revenue,
      charges,
      interco,
      ebitda,
      share: (ebitda * spv.ownership) / 100,
    };
  });
  const total = lines.reduce(
    (a, l) => ({ ...a, revenue: a.revenue + l.revenue, charges: a.charges + l.charges, interco: a.interco + l.interco, ebitda: a.ebitda + l.ebitda, share: a.share + l.share }),
    { spvId: 'total', name: 'Total groupe', country: '—', ownership: 100, revenue: 0, charges: 0, interco: 0, ebitda: 0, share: 0 } as LiasseLine,
  );
  return { lines, total };
}

export function monthlyEbitdaSeries(seasonality: number[]): { label: string; value: number }[] {
  const annual = SITES.reduce((a, s) => a + s.ebitdaK, 0) * 1000;
  const now = new Date();
  const out: { label: string; value: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - 1 - i, 1);
    out.push({ label: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][d.getMonth()], value: annual * seasonality[d.getMonth()] });
  }
  return out;
}
