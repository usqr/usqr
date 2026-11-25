export interface ChartPoint {
  label: string;
  value: number;
}

export interface ChartBar extends ChartPoint {
  /** value / largest value, 0..1 */
  ratio: number;
  /** The value as text, with a thousands separator. */
  text: string;
  /** The column always shows its value. */
  marked: boolean;
}

/** Scale the points to the largest value. Without `mark`, only the largest value is marked. */
export function chartPoints(data: ChartPoint[], mark?: number[]): ChartBar[] {
  const max = Math.max(0, ...data.map((d) => d.value));
  const marked = new Set(mark ?? [data.findIndex((d) => d.value === max)]);
  return data.map((d, i) => ({
    ...d,
    ratio: max > 0 ? Number((d.value / max).toFixed(4)) : 0,
    text: d.value.toLocaleString('en-US'),
    marked: marked.has(i),
  }));
}
