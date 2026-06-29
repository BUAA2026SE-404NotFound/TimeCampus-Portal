export type TencentLatLng = {
  getLat: () => number
  getLng: () => number
}

export type TencentMapClickEvent = {
  latLng?: TencentLatLng
}

export type TencentMap = {
  setCenter: (center: unknown) => void
  setZoom: (zoom: number) => void
  setBoundary?: (bounds: unknown) => void
  panTo?: (center: unknown) => void
  fitBounds?: (bounds: unknown, options?: Record<string, unknown>) => void
  on: (event: string, handler: (event: TencentMapClickEvent) => void) => void
  off?: (event: string, handler: (event: TencentMapClickEvent) => void) => void
  destroy?: () => void
}

export type TencentMarkerLayer = {
  setMap?: (map: TencentMap | null) => void
  setVisible?: (visible: boolean) => void
  on: (event: string, handler: (event: TencentMarkerClickEvent) => void) => void
  off?: (
    event: string,
    handler: (event: TencentMarkerClickEvent) => void
  ) => void
}

export type TencentPolylineLayer = {
  setMap?: (map: TencentMap | null) => void
}

export type TencentMarkerClickEvent = {
  geometry?: {
    id?: string
    properties?: {
      id?: number | string
      poiId?: number | string
    }
  }
}

export type TMapNamespace = {
  Map: new (
    container: HTMLElement,
    options: Record<string, unknown>
  ) => TencentMap
  LatLng: new (lat: number, lng: number) => TencentLatLng
  MultiMarker: new (options: Record<string, unknown>) => TencentMarkerLayer
  MultiPolyline: new (
    options: Record<string, unknown>
  ) => TencentPolylineLayer
  MarkerStyle: new (options: Record<string, unknown>) => unknown
  PolylineStyle: new (options: Record<string, unknown>) => unknown
  Point: new (x: number, y: number) => unknown
  LatLngBounds?: new (southWest: unknown, northEast: unknown) => unknown
}

declare global {
  interface Window {
    TMap?: TMapNamespace
    __timeCampusTencentMapPromise?: Promise<TMapNamespace>
  }
}

export function loadTencentMap(key: string) {
  if (window.TMap) {
    return Promise.resolve(window.TMap)
  }

  if (window.__timeCampusTencentMapPromise) {
    return window.__timeCampusTencentMapPromise
  }

  window.__timeCampusTencentMapPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${encodeURIComponent(
      key
    )}`
    script.async = true
    script.onload = () => {
      if (window.TMap) {
        resolve(window.TMap)
        return
      }

      reject(new Error("腾讯地图脚本加载完成但 TMap 不可用"))
    }
    script.onerror = () => reject(new Error("腾讯地图脚本加载失败"))
    document.head.appendChild(script)
  })

  return window.__timeCampusTencentMapPromise
}
