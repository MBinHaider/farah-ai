export interface GroceryList {
  id: string
  mealPlanId: string
  items: GroceryItem[]
  createdAt: Date
}

export interface GroceryItem {
  name: string
  nameAr?: string
  quantity: number
  unit: string
  category: string
  checked: boolean
}
