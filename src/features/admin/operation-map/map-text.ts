import type {
  AdminMapComment,
  AdminMapFavorite,
  AdminMapMedia,
  AdminMapPoi,
} from "@/api/admin"
import { textOr } from "@/lib/text"

export function poiName(poi: AdminMapPoi) {
  return textOr(poi.name, `POI #${poi.id}`)
}

export function poiDescription(poi: AdminMapPoi) {
  return textOr(poi.description, "暂无简介")
}

export function userName(item: AdminMapFavorite | AdminMapComment) {
  return textOr(item.nickname, item.userId ? `用户 #${item.userId}` : "匿名用户")
}

export function targetName(item: AdminMapFavorite | AdminMapComment) {
  const type = item.targetType || "target"
  const id = item.targetId ?? item.relatedPoiId ?? "-"

  return textOr(item.targetName, `${type} #${id}`)
}

export function commentContent(comment: AdminMapComment) {
  return textOr(comment.content, "暂无评论内容")
}

export function mediaDescription(media: AdminMapMedia) {
  return textOr(media.description, "暂无说明")
}
