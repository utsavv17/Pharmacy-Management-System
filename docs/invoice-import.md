# Supplier Invoice Import Documentation

This document explains the architecture and logic of the Supplier Invoice Import feature in the My Medical Pharmacy Management System.

## Architecture

The import feature allows uploading a PDF invoice from a supplier, automatically parsing its contents, matching it against the database, and updating the inventory in a single atomic database transaction.

### Backend Extraction Flow

1. **Upload (`/purchases/import-invoice`)**:
   - The frontend uploads the PDF via `multipart/form-data`.
   - A SHA-256 hash is calculated to ensure the same file isn't uploaded twice within the same organization.
   - The file is temporarily saved.

2. **Parsing (`TextInvoiceParser`)**:
   - The PDF is parsed using `pdfplumber`.
   - Text is extracted and split line by line.
   - Heuristics are used to find common supplier terms (e.g., "PHARMA"), Invoice number formats, Dates, and GSTINs.
   - Tables are detected using row heuristics matching typical table columns (Qty, Batch, Expiry, Rate, Amount).
   - Items are extracted into `ExtractedItem` schemas.

3. **Matching (`MatchingService`)**:
   - **Supplier**: Attempts an exact GSTIN match, exact name match, or partial fuzzy name match against the organization's existing suppliers.
   - **Medicines**: Attempts an exact name match or fuzzy name match using the first word against the organization's existing medicines.

4. **Review & Confirm (`/purchases/import-invoice/confirm`)**:
   - The frontend allows the user to review all matched states.
   - The user submits the final mapping.
   - The backend validates all mappings. If `create_supplier` or `create_medicine` is set, it inserts them into the DB.
   - The `PurchaseService` creates the Purchase, PurchaseItems, and Batches within a single transaction. If any failure occurs, the entire transaction rolls back.

## Duplicate Prevention

- A `SHA-256` hash is generated from the raw bytes of the uploaded PDF.
- This hash is stored in the `purchases.invoice_file_hash` column.
- Before extraction and confirmation, the database is queried to ensure no existing purchase shares this hash within the same `organization_id`.

## Database Schema Changes

Added to `purchases`:
- `invoice_source`: String, defaults to "MANUAL". Set to "IMPORTED" via the UI.
- `original_invoice_filename`: Original PDF name.
- `invoice_file_hash`: SHA-256 hash.
- `supplier_invoice_number`: The specific invoice number extracted.

## Limitations

- **Complex Table Parsing**: The current heuristic parser works well for structured text PDFs where rows are clearly demarcated. It might struggle with deeply nested column headers or scanned image PDFs.
- **Scanned Documents**: Pure image-based PDFs currently require Tesseract OCR integration, which can be hooked into the `InvoiceParser` base interface.

## Error Handling

- Handled corrupt files, missing data, and unmatched items.
- Duplicate detection blocks processing early.
- Transactional commits ensure database consistency.
