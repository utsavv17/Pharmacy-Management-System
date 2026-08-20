from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.medicine import Medicine
from app.models.customer import Customer
from app.models.batch import Batch
from app.models.sale import Sale
from app.models.supplier import Supplier

from app.schemas.search import (
    GlobalSearchResponse,
    SearchResultMedicine,
    SearchResultCustomer,
    SearchResultBatch,
    SearchResultSale,
    SearchResultSupplier
)

class SearchService:
    def global_search(self, db: Session, organization_id: str, query: str, limit_per_category: int = 5) -> GlobalSearchResponse:
        search_pattern = f"%{query}%"

        # 1. Medicines
        medicines = db.query(Medicine).filter(
            Medicine.organization_id == organization_id,
            Medicine.name.ilike(search_pattern)
        ).limit(limit_per_category).all()
        
        med_results = [SearchResultMedicine(
            id=str(m.id), name=m.name, manufacturer=m.brand, is_active=True
        ) for m in medicines]

        # 2. Customers
        customers = db.query(Customer).filter(
            Customer.organization_id == organization_id,
            or_(
                Customer.name.ilike(search_pattern),
                Customer.phone.ilike(search_pattern)
            )
        ).limit(limit_per_category).all()
        
        cust_results = [SearchResultCustomer(
            id=str(c.id), name=c.name, phone=c.phone
        ) for c in customers]

        # 3. Batches
        batches = db.query(Batch).join(Medicine).filter(
            Batch.organization_id == organization_id,
            Batch.batch_no.ilike(search_pattern)
        ).limit(limit_per_category).all()
        
        batch_results = [SearchResultBatch(
            id=str(b.id), batch_number=b.batch_no, medicine_name=b.medicine.name, current_stock=b.quantity
        ) for b in batches]

        # 4. Sales (Invoices)
        sales = db.query(Sale).filter(
            Sale.organization_id == organization_id,
            Sale.invoice_number.ilike(search_pattern)
        ).limit(limit_per_category).all()
        
        sale_results = [SearchResultSale(
            id=str(s.id), 
            invoice_number=s.invoice_number, 
            total_amount=float(s.total_amount), 
            customer_name=s.customer.name if s.customer else None
        ) for s in sales]

        # 5. Suppliers
        suppliers = db.query(Supplier).filter(
            Supplier.organization_id == organization_id,
            Supplier.name.ilike(search_pattern)
        ).limit(limit_per_category).all()
        
        supp_results = [SearchResultSupplier(
            id=str(s.id), name=s.name
        ) for s in suppliers]

        return GlobalSearchResponse(
            medicines=med_results,
            customers=cust_results,
            batches=batch_results,
            sales=sale_results,
            suppliers=supp_results
        )

search_service = SearchService()
