import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Dashboard
export const getDashboardOverview = () => api.get('/dashboard/overview')
export const getAlerts = () => api.get('/alerts')

// Predict
export interface OrderInput {
  customer_age: number
  product_price: number
  discount_percent: number
  product_rating: number
  past_purchase_count: number
  past_return_rate: number
  delivery_delay_days: number
  session_length_minutes: number
  num_product_views: number
  device_type: string
  product_category: string
  shipping_method: string
  payment_method: string
  used_coupon: number  // 0 or 1
}

export const predictReturn = (data: OrderInput) => api.post('/predict', data)

// Simulate
export interface SimulatePayload {
  base_order: OrderInput
  simulated_discount_percent?: number
  simulated_delivery_delay_days?: number
  simulated_product_rating?: number
  simulated_shipping_method?: string
}

export const simulateReturn = (data: SimulatePayload) => api.post('/simulate', data)

// Analytics
export const getAnalyticsReturns = () => api.get('/analytics/returns');
export const getCategoryAnalytics = () => api.get('/analytics/categories');
export const getFinancialImpact = () => api.get('/analytics/financial-impact')
export const getSustainability = () => api.get('/analytics/sustainability')

// Model
export const getModelMetrics = () => api.get('/model/metrics')
export const getModelExplanations = () => api.get('/model/explanations')
