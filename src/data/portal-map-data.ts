export type DatabaseMediaTimelinePoint = {
  date: string
  dailyCount: number
  totalCount: number
}

export const databaseMediaTimeline: DatabaseMediaTimelinePoint[] = [
  { date: "2026-05-04", dailyCount: 6, totalCount: 6 },
  { date: "2026-05-05", dailyCount: 2, totalCount: 8 },
  { date: "2026-05-10", dailyCount: 2, totalCount: 10 },
  { date: "2026-05-11", dailyCount: 1, totalCount: 11 },
  { date: "2026-05-12", dailyCount: 1, totalCount: 12 },
  { date: "2026-05-16", dailyCount: 2, totalCount: 14 },
  { date: "2026-05-17", dailyCount: 1, totalCount: 15 },
  { date: "2026-05-21", dailyCount: 1, totalCount: 16 },
  { date: "2026-05-23", dailyCount: 1, totalCount: 17 },
  { date: "2026-05-26", dailyCount: 1, totalCount: 18 },
  { date: "2026-05-29", dailyCount: 2, totalCount: 20 },
  { date: "2026-05-31", dailyCount: 47, totalCount: 67 },
]
