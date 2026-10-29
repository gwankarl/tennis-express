export interface CartSummary {
  lineCount: number
  totalQuantity: number
}

interface CartResponse {
  cart: CartSummary
}

export type { CartResponse }
