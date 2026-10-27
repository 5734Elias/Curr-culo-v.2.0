/**
 * Utilitários centralizados para cálculo de períodos e durações profissionais.
 * Fonte única da verdade para cálculo de datas em experiências e certificações.
 */

const MONTHS_PT_BR = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/**
 * Converte 'YYYY-MM' para formato legível 'Mês/AAAA'
 */
export function formatMonthYear(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (!year || !month || month < 1 || month > 12) {
    return yearMonth;
  }

  return `${MONTHS_PT_BR[month - 1]}/${year}`;
}

/**
 * Calcula a duração em anos e meses entre duas datas 'YYYY-MM'.
 * Se isCurrent for true, calcula até a data de referência atual (Outubro/2026).
 */
export function calculateDuration(
  startDateStr: string,
  endDateStr?: string,
  isCurrent?: boolean,
  currentReference: string = '2026-10'
): { years: number; months: number; label: string } {
  const [startYear, startMonth] = startDateStr.split('-').map(Number);
  
  let targetYear: number;
  let targetMonth: number;

  if (isCurrent || !endDateStr) {
    [targetYear, targetMonth] = currentReference.split('-').map(Number);
  } else {
    [targetYear, targetMonth] = endDateStr.split('-').map(Number);
  }

  // Total de meses inclusivo
  let totalMonths = (targetYear - startYear) * 12 + (targetMonth - startMonth);
  if (totalMonths < 0) totalMonths = 0;

  const years = Math.floor(totalMonths / 12);
  const remainingMonths = totalMonths % 12;

  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
  }
  if (remainingMonths > 0) {
    parts.push(`${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}`);
  }

  const label = parts.length > 0 ? parts.join(' e ') : 'Menos de 1 mês';

  return { years, months: remainingMonths, label };
}

/**
 * Formata o período completo padronizado: "Início – Fim (Duração)"
 */
export function formatExperiencePeriod(
  startDateStr: string,
  endDateStr?: string,
  isCurrent?: boolean
): string {
  const startFormatted = formatMonthYear(startDateStr);
  const { label } = calculateDuration(startDateStr, endDateStr, isCurrent);

  if (isCurrent) {
    return `${startFormatted} – Presente (${label})`;
  }

  const endFormatted = endDateStr ? formatMonthYear(endDateStr) : '';
  return `${startFormatted} – ${endFormatted} (${label})`;
}
