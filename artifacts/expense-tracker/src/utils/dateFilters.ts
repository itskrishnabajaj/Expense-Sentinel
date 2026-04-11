export function filterByMonth<T extends { date: string }>(
  items: T[],
  month: number,
  year: number
): T[] {
  return items.filter((item) => {
    const d = new Date(item.date + 'T00:00:00');
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function filterByThisWeek<T extends { date: string }>(items: T[]): T[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  return items.filter((item) => new Date(item.date + 'T00:00:00') >= startOfWeek);
}

export function filterByLastWeek<T extends { date: string }>(items: T[]): T[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfThisWeek = new Date(today);
  startOfThisWeek.setDate(today.getDate() - dayOfWeek);
  startOfThisWeek.setHours(0, 0, 0, 0);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
  return items.filter((item) => {
    const d = new Date(item.date + 'T00:00:00');
    return d >= startOfLastWeek && d < startOfThisWeek;
  });
}
