from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date

class ExtractedSupplier(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    gstin: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class ExtractedInvoiceMeta(BaseModel):
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None # Keeping as string for frontend parsing, or date if parsed reliably
    due_date: Optional[str] = None
    subtotal: float = 0.0
    discount: float = 0.0
    taxable_amount: float = 0.0
    cgst: float = 0.0
    sgst: float = 0.0
    igst: float = 0.0
    total_gst: float = 0.0
    grand_total: float = 0.0

class ExtractedItem(BaseModel):
    product_name: Optional[str] = None
    manufacturer: Optional[str] = None
    mrp: float = 0.0
    pack: Optional[str] = None
    hsn: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    quantity: int = 0
    free_quantity: int = 0
    purchase_rate: float = 0.0
    discount: float = 0.0
    gst_percent: float = 0.0
    gst_amount: float = 0.0
    amount: float = 0.0
    
    # Matching metadata fields (populated later by MatchingService)
    matched_medicine_id: Optional[int] = None
    match_confidence: float = 0.0
    match_status: str = "UNMATCHED" # "MATCHED", "POSSIBLE_MATCH", "UNMATCHED"

class InvoiceExtractionResult(BaseModel):
    supplier: ExtractedSupplier = Field(default_factory=ExtractedSupplier)
    invoice: ExtractedInvoiceMeta = Field(default_factory=ExtractedInvoiceMeta)
    items: List[ExtractedItem] = []
    source_filename: str
    file_hash: str
    
    # Matching metadata
    matched_supplier_id: Optional[int] = None
    supplier_match_status: str = "UNMATCHED" # "MATCHED", "POSSIBLE_MATCH", "UNMATCHED"

class InvoiceConfirmRequest(BaseModel):
    """Payload sent by frontend to confirm the reviewed invoice."""
    supplier_id: Optional[int] = None
    create_supplier: bool = False
    supplier_details: Optional[ExtractedSupplier] = None
    
    invoice_number: str
    invoice_date: date
    subtotal: float = 0.0
    discount: float = 0.0
    total_amount: float = 0.0
    
    source_filename: str
    file_hash: str
    
    items: List[dict] # Will handle complex logic in the endpoint manually or with specific item schema

class ConfirmItemRequest(BaseModel):
    medicine_id: Optional[int] = None
    create_medicine: bool = False
    product_name: str
    manufacturer: Optional[str] = None
    batch_no: str
    expiry_date: date
    purchase_price: float
    mrp: float = 0.0
    quantity: int
    free_quantity: int = 0
    discount: float = 0.0
    gst_percent: float = 0.0
    
class InvoiceConfirmPayload(InvoiceConfirmRequest):
    items: List[ConfirmItemRequest]
