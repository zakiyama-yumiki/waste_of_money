/**
 * Pretax 金額を税込（円整数）へ half-up で変換する。
 * 半端な浮動小数による誤差を避けるため EPSILON を加算して丸める。
 */
export function toInclTaxHalfUp(amountPretax: number, taxRate = 0.1): number {
  const factor = 1 + taxRate;
  const incl = amountPretax * factor;
  return Math.round(incl + Number.EPSILON);
}
