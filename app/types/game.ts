export type CellType = "normal" | "surprise"
export type RewardType = "ATON" | "NiftyIN" | "DipoleSwap" | "Topwallet" | "DeworkHub"

export interface Cell {
  number: number
  type: CellType
  reward?: RewardType
  x: number
  y: number
  isEmpty?: boolean // For empty cells in the layout
}

export const SURPRISE_CELLS = [6, 8, 16, 18, 20, 25, 28, 38, 58, 66, 68, 78, 88, 98, 99, 100]

export const REWARDS: Record<RewardType, { cells: number[] }> = {
  ATON: { cells: [6, 25, 68] },
  NiftyIN: { cells: [8, 28, 78] },
  DipoleSwap: { cells: [16, 38, 88] },
  Topwallet: { cells: [18, 58, 98] },
  DeworkHub: { cells: [20, 66, 99, 100] },
}

// Define the exact layout from the image
// 0 represents empty cells, positive numbers represent game cells
export const BOARD_LAYOUT = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [40, 41, 42, 0, 46, 47, 48, 0, 52, 53, 54, 55, 56, 57, 0, 77, 78, 79],
  [0, 0, 0, 0, 0, 39, 0, 43, 44, 45, 0, 49, 50, 51, 0, 0, 0, 0, 58, 0, 76, 0, 80, 81],
  [0, 0, 0, 0, 38, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 59, 0, 75, 0, 0, 82, 83],
  [0, 0, 0, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 0, 0, 60, 0, 74, 0, 0, 0, 84],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 26, 0, 0, 61, 0, 73, 0, 0, 86, 85],
  [0, 0, 0, 0, 8, 9, 10, 11, 12, 0, 0, 0, 0, 25, 0, 0, 62, 0, 72, 0, 88, 87, 0, 0, 100],
  [0, 0, 7, 0, 0, 0, 13, 0, 0, 0, 0, 24, 0, 0, 63, 0, 71, 0, 89, 0, 0, 98, 99],
  [0, 0, 6, 5, 0, 0, 14, 0, 0, 0, 0, 23, 0, 0, 64, 0, 70, 0, 90, 91, 0, 97],
  [0, 0, 0, 0, 4, 0, 0, 15, 0, 0, 0, 0, 22, 0, 0, 65, 0, 69, 0, 0, 92, 0, 96],
  [0, 0, 1, 2, 3, 0, 0, 16, 17, 18, 19, 20, 21, 0, 0, 66, 67, 68, 0, 0, 93, 94, 95],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
]

