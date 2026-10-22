import { addDays, format, startOfWeek } from 'date-fns'

/** Monday to Sunday of the week `today` is in, as YYYY-MM-DD (Imad, 12 Oct). */
export function weekDays(today: Date): string[] {
  const monday = startOfWeek(today, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), 'yyyy-MM-dd'))
}
