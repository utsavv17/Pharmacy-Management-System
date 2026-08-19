export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export interface Medicine {
  id: number;
  name: string;
  generic_name: string | null;
  brand: string | null;
  category: string | null;
  unit: string | null;
  strength: string | null;
  barcode: string | null;
  image_url: string | null;
  minimum_stock_level: number;
}

export interface Batch {
  id: number;
  medicine_id: number;
  batch_number: string;
  purchase_price: number;
  selling_price: number;
  stock: number;
  expiry_date: string;
}

export interface SaleItem {
  id?: number;
  medicine_id: number;
  batch_id?: number;
  quantity: number;
  selling_price?: number;
}

export interface Sale {
  id: number;
  invoice_number: string;
  customer_id: number | null;
  customer_name: string | null;
  sale_date: string;
  subtotal: number;
  discount_amount: number;
  points_earned: number;
  points_redeemed: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: SaleItem[];
}

export interface InventoryItem {
  medicine_id: number;
  medicine_name: string;
  total_stock: number;
  batches: Batch[];
}

export interface DashboardTotals {
  total_sales: number;
  total_purchases: number;
  total_medicines: number;
  total_customers: number;
}

export interface Supplier {
  id: number;
  name: string;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export interface PurchaseItem {
  id?: number;
  medicine_id: number;
  batch_no: string;
  expiry_date: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
}

export interface Purchase {
  id: number;
  invoice_number: string;
  supplier_name: string | null;
  purchase_date: string;
  total_amount: number;
  created_at: string;
  items: PurchaseItem[];
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  total_points: number;
  total_purchase_amount: number;
  total_orders: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RewardTransaction {
  id: number;
  customer_id: number;
  sale_id: number | null;
  return_id: number | null;
  type: 'EARN' | 'REDEEM' | 'REFUND_REVERSAL' | 'MANUAL_ADJUSTMENT';
  points: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

export interface SaleReturnItem {
  id: number;
  return_id: number;
  sale_item_id: number;
  batch_id: number;
  quantity: number;
  refund_amount: number;
}

export interface SaleReturn {
  id: number;
  sale_id: number;
  customer_id: number | null;
  refund_amount: number;
  reason: string;
  status: string;
  processed_by: number | null;
  created_at: string;
  items: SaleReturnItem[];
}
