import { apiClient } from './client';

export interface SearchResultMedicine {
  id: string;
  name: string;
  manufacturer: string | null;
  is_active: boolean;
}

export interface SearchResultCustomer {
  id: string;
  name: string;
  phone: string;
}

export interface SearchResultBatch {
  id: string;
  batch_no: string;
  medicine_name: string;
  quantity: number;
}

export interface SearchResultSale {
  id: string;
  invoice_number: string;
  total_amount: number;
  customer_name: string | null;
}

export interface SearchResultSupplier {
  id: string;
  name: string;
}

export interface GlobalSearchResponse {
  medicines: SearchResultMedicine[];
  customers: SearchResultCustomer[];
  batches: SearchResultBatch[];
  sales: SearchResultSale[];
  suppliers: SearchResultSupplier[];
}

export const searchApi = {
  globalSearch: async (query: string): Promise<GlobalSearchResponse> => {
    const response = await apiClient.get(`/search/?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};
