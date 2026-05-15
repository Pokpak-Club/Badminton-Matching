// ELO rating system
// อ่านเพิ่มเติม: https://en.wikipedia.org/wiki/Elo_rating_system

const K_FACTOR = 32 // มาตรฐานสำหรับผู้เล่นทั่วไป (ปรับได้)

/**
 * คำนวณโอกาสที่ A จะชนะ B จากเรตติ้งปัจจุบัน
 */
export function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

/**
 * คำนวณเรตติ้งใหม่หลังเล่นแมตช์เดี่ยว
 * @param {number} ratingA เรตติ้ง player A ก่อนแมตช์
 * @param {number} ratingB เรตติ้ง player B ก่อนแมตช์
 * @param {1|0} resultA 1 = A ชนะ, 0 = A แพ้
 * @returns {{ newA: number, newB: number, deltaA: number, deltaB: number }}
 */
export function calculateElo(ratingA, ratingB, resultA) {
  const expectedA = expectedScore(ratingA, ratingB)
  const expectedB = 1 - expectedA
  const resultB = 1 - resultA

  const deltaA = Math.round(K_FACTOR * (resultA - expectedA))
  const deltaB = Math.round(K_FACTOR * (resultB - expectedB))

  return {
    newA: ratingA + deltaA,
    newB: ratingB + deltaB,
    deltaA,
    deltaB,
  }
}

/**
 * ตัดสินว่าใครชนะแมตช์ (best-of-N) จาก array ของคะแนนแต่ละเกม
 * @param {Array<[number, number]>} games เช่น [[21,18],[15,21],[21,19]]
 * @returns {1|2|null} 1 = player1 ชนะ, 2 = player2, null = ยังไม่จบ
 */
export function determineWinner(games) {
  let p1Games = 0
  let p2Games = 0
  for (const [s1, s2] of games) {
    if (s1 > s2) p1Games++
    else if (s2 > s1) p2Games++
  }
  // best-of-3: ชนะ 2 เกมก่อน
  if (p1Games >= 2) return 1
  if (p2Games >= 2) return 2
  // best-of-1: ถ้ามีแค่เกมเดียวและคะแนนต่างกัน
  if (games.length === 1 && p1Games + p2Games === 1) {
    return p1Games === 1 ? 1 : 2
  }
  return null
}
