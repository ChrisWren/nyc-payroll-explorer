const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const UNITS: Array<{ value: number; suffix: string }> = [
  { value: 1e12, suffix: 'T' },
  { value: 1e9, suffix: 'B' },
  { value: 1e6, suffix: 'M' },
  { value: 1e3, suffix: 'K' },
];

export function formatSalary(value: number): string {
  if (!Number.isFinite(value)) {
    return '$0';
  }

  const abs = Math.abs(value);
  for (const unit of UNITS) {
    if (abs >= unit.value) {
      const scaled = value / unit.value;
      const precision = Math.abs(scaled) >= 10 ? 0 : 1;
      const formatted = scaled.toFixed(precision).replace(/\.0$/, '');
      return `$${formatted}${unit.suffix}`;
    }
  }

  return currencyFormatter.format(value);
}

export function formatSalaryRange(min: number, max: number): string {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return 'Salary unavailable';
  }

  const orderedMin = Math.min(min, max);
  const orderedMax = Math.max(min, max);

  if (Math.abs(orderedMax - orderedMin) < 1) {
    return formatSalary(orderedMax);
  }

  return `${formatSalary(orderedMin)} - ${formatSalary(orderedMax)}`;
}
