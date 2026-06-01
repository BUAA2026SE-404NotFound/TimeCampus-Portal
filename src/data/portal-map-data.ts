import { campusHistoryItems } from "@/data/campus-history"

export type PortalPoiMedia = {
  id: number
  year: number
  type: string
  description: string
  imagePath: string
}

export type PortalPoi = {
  id: number
  name: string
  latitude: number
  longitude: number
  status: number
  description: string
  mediaList: PortalPoiMedia[]
}

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

export const hardcodedPortalPois: PortalPoi[] = [
  {
    id: 9001,
    name: "北航主楼",
    latitude: 39.98404,
    longitude: 116.351129,
    status: 1,
    description: "老主楼",
    mediaList: [
      {
        id: 9017,
        year: 1958,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-21/1-c7c55fff25c344e9b8b078db26aaaaaf.jpg",
        description: "北京一号首飞经过老主楼上空",
      },
      {
        id: 9012,
        year: 1976,
        type: "official",
        imagePath: "/home/ubuntu/cos/2026-05-11/1976.jpeg",
        description: "北京航空学院第四系1973届工农兵学员毕业合影1976年12月2日",
      },
      {
        id: 9001,
        year: 1988,
        type: "official",
        imagePath: "/home/ubuntu/cos/dev-seed/buaa-main-1988.svg",
        description: "北航主楼 1988 年资料照片",
      },
    ],
  },
  {
    id: 9002,
    name: "新主楼",
    latitude: 39.981038,
    longitude: 116.351763,
    status: 1,
    description: "教学、科研与校园活动高度集中的综合建筑。",
    mediaList: [
      {
        id: 9003,
        year: 2016,
        type: "official",
        imagePath: "/home/ubuntu/cos/dev-seed/buaa-new-main.svg",
        description: "新主楼周边校园景观",
      },
    ],
  },
  {
    id: 9003,
    name: "晨兴音乐厅",
    latitude: 39.981883,
    longitude: 116.351533,
    status: 1,
    description: "校园文化活动与演出的重要场所。",
    mediaList: [
      {
        id: 9004,
        year: 2019,
        type: "official",
        imagePath: "/home/ubuntu/cos/dev-seed/buaa-concert-hall.svg",
        description: "晨兴音乐厅活动记录",
      },
    ],
  },
  {
    id: 9004,
    name: "北航图书馆",
    latitude: 39.983832,
    longitude: 116.348728,
    status: 1,
    description: "学习、检索和校园记忆沉淀的重要空间。",
    mediaList: [
      {
        id: 9005,
        year: 2001,
        type: "official",
        imagePath: "https://timecampus.asia/favicon.ico",
        description: "图书馆旧照（远程 URL 示例）",
      },
    ],
  },
  {
    id: 9005,
    name: "学院路校门",
    latitude: 39.984223,
    longitude: 116.352952,
    status: 1,
    description: "学校最老的门",
    mediaList: [
      {
        id: 9007,
        year: 2006,
        type: "ugc",
        imagePath:
          "/home/ubuntu/cos/uploads/2026-05-05/9004-84c5ce3f5f7642661b1cb5dffbbd97e21.jpg",
        description: "学院路校门影像",
      },
    ],
  },
  {
    id: 9007,
    name: "绿园池塘",
    latitude: 39.983761,
    longitude: 116.347321,
    status: 1,
    description: "有很多鸭子，还有鸳鸯",
    mediaList: [],
  },
  {
    id: 9008,
    name: "TD线",
    latitude: 39.981019,
    longitude: 116.346549,
    status: 1,
    description: "大家最爱（？）的TD线",
    mediaList: [],
  },
  {
    id: 9010,
    name: "第六馆（前）",
    latitude: 39.981785,
    longitude: 116.352413,
    status: 1,
    description: "2026年4月拆除，将会建设新的人工智能科研楼",
    mediaList: [
      {
        id: 9021,
        year: 1998,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-29/1-98850443bb0347b88333ca5b8ea04c6d2.jpg",
        description: "G106第六馆_1998_04_17_计算流体实验室验收",
      },
      {
        id: 9022,
        year: 2026,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-29/1-33630e596de84e7cb0a248eb5074a745.jpg",
        description: "第六馆拆除前影像",
      },
    ],
  },
  {
    id: 9011,
    name: "一号楼",
    latitude: 39.983045,
    longitude: 116.351876,
    status: 1,
    description: "一号楼",
    mediaList: [
      {
        id: 9065,
        year: 1957,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-31/1-b35eb746163949f1bb741481e6b014c2.jpg",
        description: "拍摄年份未知",
      },
    ],
  },
  {
    id: 9012,
    name: "二号楼",
    latitude: 39.983029,
    longitude: 116.350297,
    status: 1,
    description: "中法工程师学院楼",
    mediaList: [
      {
        id: 9062,
        year: 1954,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-31/1-d726ffaa8dc04378944880b221f4770a9.jpg",
        description: "拍摄年份未知",
      },
      {
        id: 9064,
        year: 2006,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-31/1-95a00a305fca4aeea7a5045fe83444ae.jpg",
        description: "二号楼的照片",
      },
    ],
  },
  {
    id: 9013,
    name: "三号楼",
    latitude: 39.985122,
    longitude: 116.351704,
    status: 1,
    description: "教学楼之一",
    mediaList: [
      {
        id: 9052,
        year: 1954,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-31/1-eacb4e3badd6456a9aae586e41b59c93c.jpg",
        description: "拍摄年份未知",
      },
      {
        id: 9059,
        year: 2010,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-31/1-06553ce0c4b7423ca0c0b8a1074ce495.jpg",
        description: "改造前的三号楼门口的一张合照",
      },
      {
        id: 9061,
        year: 2022,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-31/1-c3ab2c8b91cb437a82431595629b752a.jpg",
        description: "三号楼的照片",
      },
    ],
  },
  {
    id: 9015,
    name: "五号楼",
    latitude: 39.985005,
    longitude: 116.348647,
    status: 1,
    description: "生医/医工楼",
    mediaList: [
      {
        id: 9051,
        year: 2020,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-31/1-80b9ed5584fb459b86653830b35913689.jpg",
        description: "拍摄年份未知",
      },
    ],
  },
  {
    id: 9016,
    name: "办公楼",
    latitude: 39.982366,
    longitude: 116.348778,
    status: 1,
    description: "六号楼",
    mediaList: [
      {
        id: 9048,
        year: 1959,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-31/1-cb1553f89b6e4e6c9cc1e6ed134ba898d.jpg",
        description: "1959年，办公楼建成时的影像资料",
      },
      {
        id: 9049,
        year: 2009,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-31/1-32c3429892994e2a80051e351b05fe3a0.jpg",
        description: "办公楼的照片",
      },
    ],
  },
  {
    id: 9017,
    name: "如心楼",
    latitude: 39.981684,
    longitude: 116.34919,
    status: 1,
    description: "八号楼",
    mediaList: [
      {
        id: 9046,
        year: 2005,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-31/1-45b11033461b4709a339af0b1ccee18c7.jpg",
        description: "在如心楼举办的北航首届研究生学术论坛",
      },
      {
        id: 9047,
        year: 2022,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-31/1-459d679acdf9416b9ddfe743cb0c1efb8.jpg",
        description: "如心楼前的一张合照",
      },
    ],
  },
  {
    id: 9018,
    name: "知行楼",
    latitude: 39.982621,
    longitude: 116.347538,
    status: 1,
    description: "学生活动中心",
    mediaList: [
      {
        id: 9041,
        year: 2006,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-31/1-429ea8b195bb4ed4a00f8c65316aa247b.jpg",
        description: "知行楼影像",
      },
    ],
  },
  {
    id: 9019,
    name: "航空航天博物馆",
    latitude: 39.982139,
    longitude: 116.350697,
    status: 1,
    description: "中国首个航空航天科学技术的综合科技馆",
    mediaList: [
      {
        id: 9037,
        year: 1985,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-31/1-fbb25213f50842eea33474cfa9bfcd666.jpg",
        description: "北京航空航天博物馆首次开放时的影像资料",
      },
      {
        id: 9039,
        year: 2012,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-31/1-769dd063488640f39aa8ce67ace1a0638.jpg",
        description: "北京航空航天博物馆新馆建成",
      },
    ],
  },
  {
    id: 9020,
    name: "体育馆",
    latitude: 39.980706,
    longitude: 116.349456,
    status: 1,
    description: "校内综合性体育场馆",
    mediaList: [
      {
        id: 9034,
        year: 2010,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-31/1-e43e9b2ce91343d1bdd95b9fa877a95595.jpg",
        description: "拍摄年份未知",
      },
    ],
  },
  {
    id: 9021,
    name: "游泳馆",
    latitude: 39.980652,
    longitude: 116.348494,
    status: 1,
    description: "设有国标尺寸的深水区和浅水区",
    mediaList: [
      {
        id: 9032,
        year: 2001,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-31/1-c9d64f9ea3c740a78fff6e1163eba69f9.jpg",
        description: "在北航游泳馆内举办的大运会水上运动赛事",
      },
      {
        id: 9031,
        year: 2020,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-31/1-0a42c4722d8e40ffb11ee0fefbba5eb88.jpg",
        description: "拍摄时间未知",
      },
    ],
  },
  {
    id: 9026,
    name: "逸夫科学馆",
    latitude: 39.981894,
    longitude: 116.349965,
    status: 1,
    description: "校史馆、第九馆",
    mediaList: [
      {
        id: 9024,
        year: 1989,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-31/1-9ef1e9ed9bc94758833b70a1ba991cf27.jpg",
        description: "逸夫科学馆落成时的影像",
      },
    ],
  },
  {
    id: 9027,
    name: "为民楼",
    latitude: 39.978457,
    longitude: 116.349592,
    status: 1,
    description: "第十四馆",
    mediaList: [
      {
        id: 9023,
        year: 2020,
        type: "official",
        imagePath:
          "/home/ubuntu/cos/2026-05-31/1-5b52ad1e91bb411b9ffc93d93c07f3097.jpg",
        description: "拍摄年份未知",
      },
    ],
  },
]

export function localPortalImageForPoi(name: string, index = 0) {
  const item = campusHistoryItems.find(
    (candidate) =>
      candidate.name.includes(name) ||
      name.includes(candidate.name) ||
      candidate.detail.includes(name)
  )
  return item?.images[index % Math.max(item.images.length, 1)]?.src
}
