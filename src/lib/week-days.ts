import { addDays, format, parseISO, startOfWeek } from 'date-fns'
import { dateLocale, i18n } from '@/lib/i18n'

/** Monday to Sunday of the week `today` is in, as YYYY-MM-DD (Imad, 12 Oct). */
export function weekDays(today: Date): string[] {
  const monday = startOfWeek(today, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), 'yyyy-MM-dd'))
}

/** The week picker's title: This week, Next week, Last week, or the week of its Monday. */
export const weekTitle = (offset: number, monday: string) =>
  offset === 0 ? i18n.t('coachHome:thisWeek') : offset === 1 ? i18n.t('coachHome:nextWeek') : offset === -1 ? i18n.t('coachHome:lastWeek')
    : i18n.t('coachHome:weekOf', { day: format(parseISO(monday), 'd MMMM', { locale: dateLocale() }) })
