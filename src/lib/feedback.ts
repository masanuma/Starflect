export type FeedbackRating = 'bad' | 'good' | 'great'

export interface FeedbackPayload {
  rating: FeedbackRating
  comment?: string
  lang: string
  starType?: string
  page: string
}

/** フィードバックをサーバー(/api/feedback)経由でスプレッドシートへ送る。失敗しても握りつぶす。 */
export async function sendFeedback(p: FeedbackPayload): Promise<void> {
  try {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    })
  } catch {
    /* 送信失敗は体験を止めない */
  }
}
