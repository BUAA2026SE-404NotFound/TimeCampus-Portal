const imageModules = import.meta.glob<string>(
  "@/assets/campus-history/**/*.{jpg,jpeg,png,JPG,JPEG,PNG}",
  {
    eager: true,
    import: "default",
  }
)

const categoryOrder = [
  "八楼",
  "十六馆",
  "原新北",
  "学生公寓",
  "室外体育场地",
  "教学科研办公",
  "校门",
  "科技园",
  "绿园",
  "配套建筑",
  "雕像点位",
  "地图",
]

export type CampusHistoryImage = {
  file: string
  src: string
  year: string
  caption: string
}

export type CampusHistoryItem = {
  id: string
  name: string
  code: string
  zone: string
  summary: string
  detail: string
  tags: string[]
  images: CampusHistoryImage[]
}

function cleanFileName(fileName: string) {
  return decodeURIComponent(fileName)
    .replace(/\.[^.]+$/, "")
    .replace(/_/g, " ")
}

function parseYear(fileName: string) {
  return fileName.match(/(?:19|20)\d{2}/)?.[0] ?? "未标注"
}

function parseCode(name: string) {
  return name.match(/^[A-Z]{1,3}\d{3}/)?.[0] ?? name
}

function compareByOriginalOrder(a: CampusHistoryItem, b: CampusHistoryItem) {
  const zoneDelta = categoryOrder.indexOf(a.zone) - categoryOrder.indexOf(b.zone)
  if (zoneDelta !== 0) return zoneDelta
  return a.name.localeCompare(b.name, "zh-Hans-CN", { numeric: true })
}

const grouped = Object.entries(imageModules).reduce(
  (items, [path, src]) => {
    const relative = decodeURIComponent(
      path.replace(/^.*\/assets\/campus-history\//, "")
    )
    const segments = relative.split("/")
    const fileName = segments.at(-1) ?? relative
    const zone = segments.length === 1 ? "地图" : segments[0]
    const name =
      segments.length >= 3
        ? segments.slice(1, -1).join(" / ")
        : segments.length === 2
          ? segments[0]
          : "校园地图"
    const id = `${zone}/${name}`

    if (!items.has(id)) {
      items.set(id, {
        id,
        name,
        code: parseCode(name),
        zone,
        summary: `${zone}原始分类下的校史馆影像素材。`,
        detail:
          "图片保持校史馆原始目录分类与原图构图，只做前端资产压缩；页面负责统一展示、年代切换和横向影像浏览。",
        tags: [zone, parseCode(name)],
        images: [],
      })
    }

    items.get(id)?.images.push({
      file: relative,
      src,
      year: parseYear(fileName),
      caption: cleanFileName(fileName),
    })

    return items
  },
  new Map<string, CampusHistoryItem>()
)

export const campusHistoryItems = Array.from(grouped.values())
  .map((item) => ({
    ...item,
    images: item.images.sort((a, b) =>
      a.file.localeCompare(b.file, "zh-Hans-CN", { numeric: true })
    ),
  }))
  .sort(compareByOriginalOrder)

export const campusHistoryZones = categoryOrder.filter((zone) =>
  campusHistoryItems.some((item) => item.zone === zone)
)

export const featuredCampusFrames = campusHistoryItems.flatMap((item) =>
  item.images.slice(0, 3).map((image) => ({
    ...image,
    building: item.name,
    zone: item.zone,
  }))
)

export const heroCampusFrames = featuredCampusFrames.slice(0, 8)
