export interface PlaceCandidate {
  place_id: string
  name: string
  address: string
  rating?: number
  user_ratings_total?: number
}

export interface PlaceReview {
  author_name: string
  rating: number
  text: string
  time: number
  relative_time_description: string
}

// 병원명으로 구글 장소 검색 (최대 3건 반환)
export async function searchGooglePlace(query: string): Promise<PlaceCandidate[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return []

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=ko&key=${apiKey}&type=health`
  const res = await fetch(url, { next: { revalidate: 0 } })
  const data = await res.json()

  if (data.status !== "OK") return []

  return data.results.slice(0, 3).map((p: any) => ({
    place_id: p.place_id,
    name: p.name,
    address: p.formatted_address,
    rating: p.rating,
    user_ratings_total: p.user_ratings_total,
  }))
}

// place_id로 리뷰 목록 조회 (최대 5건 — Places API 제한)
export async function getPlaceReviews(placeId: string): Promise<PlaceReview[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return []

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,name&key=${apiKey}&language=ko&reviews_sort=newest`
  const res = await fetch(url, { next: { revalidate: 0 } })
  const data = await res.json()

  if (data.status !== "OK") return []
  return data.result?.reviews || []
}
