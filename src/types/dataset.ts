export interface DatasetResponse {
  code: number
  data: {
    id: number
    name: string
    description?: string
    type: string
    config: any
    createdAt: string
    updatedAt: string
  }
  message: string
}

export interface DatasetData {
  code: number
  data: any[]
  message: string
}
