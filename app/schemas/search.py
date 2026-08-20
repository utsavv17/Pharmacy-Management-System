from typing import List, Optional
from pydantic import BaseModel

class SearchResultMedicine(BaseModel):
    id: str
    name: str
    manufacturer: Optional[str]
    is_active: bool

class SearchResultCustomer(BaseModel):
    id: str
    name: str
    phone: str

class SearchResultBatch(BaseModel):
    id: str
    batch_number: str
    medicine_name: str
    current_stock: int

class SearchResultSale(BaseModel):
    id: str
    invoice_number: str
    total_amount: float
    customer_name: Optional[str]

class SearchResultSupplier(BaseModel):
    id: str
    name: str

class GlobalSearchResponse(BaseModel):
    medicines: List[SearchResultMedicine] = []
    customers: List[SearchResultCustomer] = []
    batches: List[SearchResultBatch] = []
    sales: List[SearchResultSale] = []
    suppliers: List[SearchResultSupplier] = []
