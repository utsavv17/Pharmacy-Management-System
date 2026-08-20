import pdfplumber
from typing import BinaryIO
import re
from app.schemas.invoice import InvoiceExtractionResult, ExtractedSupplier, ExtractedInvoiceMeta, ExtractedItem
from app.services.invoice_parser.base import InvoiceParser

class TextInvoiceParser(InvoiceParser):
    def parse(self, file: BinaryIO, filename: str, file_hash: str) -> InvoiceExtractionResult:
        supplier = ExtractedSupplier()
        invoice = ExtractedInvoiceMeta()
        items = []
        
        with pdfplumber.open(file) as pdf:
            text = ""
            for page in pdf.pages:
                text += page.extract_text() + "\n"
                
            # Fallback table extraction using simple regex/line processing 
            # In a real production system, pdfplumber's extract_table() is more powerful
            # but requires strict bounding boxes. We will use text line heuristics.
            
            lines = text.split("\n")
            
            parsing_items = False
            
            # Simple heuristic regexes
            invoice_no_pattern = re.compile(r'(?i)(?:Invoice No|Bill No|Inv No|Invoice)\s*[:\-#]?\s*([A-Z0-9\-]+)')
            date_pattern = re.compile(r'(?i)(?:Date|Invoice Date)\s*[:\-]?\s*([0-9]{2}[/\-][0-9]{2}[/\-][0-9]{2,4})')
            gstin_pattern = re.compile(r'(?i)GSTIN\s*[:\-]?\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})')
            
            for line in lines:
                line_str = line.strip()
                if not line_str:
                    continue
                
                # Supplier Heuristic: If it has PHARMA and is near the top
                if "PHARMA" in line_str.upper() and not supplier.name:
                    supplier.name = line_str
                    supplier.company_name = line_str
                
                # Metadata
                if not invoice.invoice_number:
                    match = invoice_no_pattern.search(line_str)
                    if match:
                        invoice.invoice_number = match.group(1)
                
                if not invoice.invoice_date:
                    match = date_pattern.search(line_str)
                    if match:
                        invoice.invoice_date = match.group(1)
                        
                if not supplier.gstin:
                    match = gstin_pattern.search(line_str)
                    if match:
                        supplier.gstin = match.group(1)
                
                # Item Table detection
                # Look for header row: Qty, Batch, Expiry, Rate, Amount
                upper_line = line_str.upper()
                if ("QTY" in upper_line and "RATE" in upper_line and "AMOUNT" in upper_line) or \
                   ("BATCH" in upper_line and "EXP" in upper_line):
                    parsing_items = True
                    continue
                
                if parsing_items:
                    # Look for end of table
                    if "TOTAL" in upper_line or "SUBTOTAL" in upper_line or "TAX" in upper_line:
                        parsing_items = False
                        
                        # Extract totals
                        if "TOTAL" in upper_line or "NET AMOUNT" in upper_line or "GRAND TOTAL" in upper_line:
                            nums = re.findall(r'[0-9]+(?:\.[0-9]+)?', line_str)
                            if nums:
                                invoice.grand_total = float(nums[-1])
                        continue
                        
                    # Item row heuristic
                    # Typically contains a date (expiry), batch string, and multiple numbers (qty, rate, amt)
                    # Let's try to extract parts. Example: TIMINTA-90 TB-112541 10/27 10 0 100.00 12.00 1120.00
                    parts = line_str.split()
                    
                    # Find a potential expiry date like 10/27 or 09/27
                    exp_idx = -1
                    for i, p in enumerate(parts):
                        if re.match(r'[0-9]{2}[/\-][0-9]{2,4}', p):
                            exp_idx = i
                            break
                            
                    if exp_idx > 0 and len(parts) > exp_idx + 2:
                        # We likely found an item row
                        item = ExtractedItem()
                        # Assume previous part is batch
                        item.batch_number = parts[exp_idx - 1]
                        item.expiry_date = parts[exp_idx]
                        
                        # Name is everything before batch
                        item.product_name = " ".join(parts[:exp_idx - 1])
                        
                        # The rest are numbers: qty, free, rate, disc, gst, amount (heuristically)
                        numbers = []
                        for p in parts[exp_idx+1:]:
                            num_match = re.search(r'[0-9]+(?:\.[0-9]+)?', p)
                            if num_match:
                                numbers.append(float(num_match.group()))
                                
                        if len(numbers) >= 1:
                            item.quantity = int(numbers[0])
                        if len(numbers) >= 2:
                            # Depending on invoice, 2nd number might be free qty or rate
                            # Let's assume rate if it has decimals, else free qty
                            if "." in parts[exp_idx+2]:
                                item.purchase_rate = numbers[1]
                            else:
                                item.free_quantity = int(numbers[1])
                                if len(numbers) >= 3:
                                    item.purchase_rate = numbers[2]
                        
                        # Assign amount as the last number
                        if len(numbers) > 0:
                            item.amount = numbers[-1]
                            
                        # Try to find MRP
                        if len(numbers) >= 4:
                            # Let's just assign some to MRP
                            item.mrp = max(item.purchase_rate * 1.2, numbers[-2]) 
                            
                        items.append(item)

        return InvoiceExtractionResult(
            supplier=supplier,
            invoice=invoice,
            items=items,
            source_filename=filename,
            file_hash=file_hash
        )
