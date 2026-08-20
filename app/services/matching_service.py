from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.supplier import Supplier
from app.models.medicine import Medicine
from app.schemas.invoice import InvoiceExtractionResult, ExtractedSupplier, ExtractedItem
from sqlalchemy import func

class MatchingService:
    @staticmethod
    def match_supplier(db: Session, org_id: int, supplier_data: ExtractedSupplier) -> tuple[Optional[int], str]:
        if not supplier_data.name and not supplier_data.gstin:
            return None, "UNMATCHED"
            
        if not supplier_data.name and not supplier_data.company_name:
            return None, "UNMATCHED"
                
        # 2. Exact or Case-insensitive name match
        if supplier_data.name:
            sup = db.query(Supplier).filter(
                Supplier.organization_id == org_id,
                func.lower(Supplier.name) == supplier_data.name.lower()
            ).first()
            if sup:
                return sup.id, "MATCHED"
                
        # 3. Partial name match (e.g., Ishaan Pharma in DB vs ISHAAN PHARMA on invoice)
        if supplier_data.name:
            search_term = f"%{supplier_data.name.split()[0].lower()}%"
            sup = db.query(Supplier).filter(
                Supplier.organization_id == org_id,
                func.lower(Supplier.name).like(search_term)
            ).first()
            if sup:
                return sup.id, "POSSIBLE_MATCH"
                
        return None, "UNMATCHED"

    @staticmethod
    def match_items(db: Session, org_id: int, items: List[ExtractedItem]):
        for item in items:
            if not item.product_name:
                item.match_status = "UNMATCHED"
                continue
                
            # 1. Exact or Case-insensitive name match
            med = db.query(Medicine).filter(
                Medicine.organization_id == org_id,
                func.lower(Medicine.name) == item.product_name.lower()
            ).first()
            
            if med:
                item.matched_medicine_id = med.id
                item.match_confidence = 100.0
                item.match_status = "MATCHED"
                continue
                
            # 2. Partial/fuzzy match
            # Let's try matching the first word of the product name
            first_word = item.product_name.split()[0].lower()
            if len(first_word) >= 3:
                med = db.query(Medicine).filter(
                    Medicine.organization_id == org_id,
                    func.lower(Medicine.name).like(f"%{first_word}%")
                ).first()
                if med:
                    item.matched_medicine_id = med.id
                    item.match_confidence = 80.0
                    item.match_status = "POSSIBLE_MATCH"
                    continue
            
            item.match_status = "UNMATCHED"

    @staticmethod
    def process_extraction(db: Session, org_id: int, result: InvoiceExtractionResult) -> InvoiceExtractionResult:
        # Match Supplier
        supplier_id, supplier_status = MatchingService.match_supplier(db, org_id, result.supplier)
        result.matched_supplier_id = supplier_id
        result.supplier_match_status = supplier_status
        
        # Match Medicines
        MatchingService.match_items(db, org_id, result.items)
        
        return result
