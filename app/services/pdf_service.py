from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
from sqlalchemy.orm import Session
from app.models.settings import Settings
from app.models.medicine import Medicine
import os
try:
    from num2words import num2words
except ImportError:
    num2words = None

class PDFService:

    @staticmethod
    def _register_font(font_name="DejaVuSans", font_path=None):
        """
        Ensure a Unicode TTF is registered so symbols like '৳' or '₹' render correctly.
        """
        possible = [
            font_path,
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/local/share/fonts/DejaVuSans.ttf",
            os.path.join("app", "static", "fonts", "DejaVuSans.ttf"),
            os.path.join("static", "fonts", "DejaVuSans.ttf"),
        ]
        for p in possible:
            if not p:
                continue
            if os.path.exists(p):
                try:
                    pdfmetrics.registerFont(TTFont(font_name, p))
                    return font_name
                except Exception:
                    pass
        return "Helvetica"

    @staticmethod
    def generate_sale_invoice(db: Session, sale, org_id: int, logo_path=None):
        """
        Generate a styled invoice PDF Buffer.
        """
        font_name = PDFService._register_font()

        buffer = BytesIO()
        pdf = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=30, leftMargin=30,
            topMargin=30, bottomMargin=30
        )

        styles = getSampleStyleSheet()
        base_normal = ParagraphStyle(
            "BaseNormal", parent=styles["Normal"], fontName=font_name, fontSize=10, leading=12,
        )
        center_style = ParagraphStyle(
            "CenterStyle", parent=base_normal, alignment=TA_CENTER
        )
        right_style = ParagraphStyle(
            "RightStyle", parent=base_normal, alignment=TA_RIGHT
        )
        
        elements = []

        # 1. Top Notice Box
        notice_text = "<b>BILL INVOICE</b>"
        notice_p = Paragraph(notice_text, center_style)
        notice_table = Table([[notice_p]], colWidths=[pdf.width])
        notice_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0f0f0")),
            ('BOX', (0,0), (-1,-1), 0.5, colors.black),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        elements.append(notice_table)
        elements.append(Spacer(1, 10))

        # 2. Pharmacy Info Box
        settings = db.query(Settings).filter(Settings.organization_id == org_id).first()
        pharmacy_name = settings.pharmacy_name
        address = settings.address
        phone = settings.phone
        
        drug_license = settings.drug_license

        pharma_html = (
            f"<b><font size=16>{pharmacy_name.upper()}</font></b><br/>"
            f"{address}<br/>"
            f"Phone: {phone}<br/>"
            f"Drug Licence No.: {drug_license}"
        )
        pharma_p = Paragraph(pharma_html, center_style)
        pharma_table = Table([[pharma_p]], colWidths=[pdf.width])
        pharma_table.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#1b365d")),
            ('TOPPADDING', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ]))
        elements.append(pharma_table)
        elements.append(Spacer(1, 10))

        # 3. Title Box
        title_p = Paragraph("<b>RETAIL PHARMACY TAX INVOICE</b>", center_style)
        title_table = Table([[title_p]], colWidths=[pdf.width])
        title_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#eef4f9")),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#1b365d")),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(title_table)
        elements.append(Spacer(1, 10))

        # 4. Details Grid
        customer_name = sale.customer_name or 'Walk-in Customer'
        col_w = pdf.width / 2.0
        cw1, cw2, cw3, cw4 = 100, (col_w - 100), 80, (col_w - 80)
        
        details_data = [
            [Paragraph("<b>Invoice No.</b>", base_normal), Paragraph(sale.invoice_number, base_normal),
             Paragraph("<b>Date</b>", base_normal), Paragraph(str(sale.sale_date), base_normal)],
            [Paragraph("<b>Patient / Customer</b>", base_normal), Paragraph(customer_name, base_normal),
             Paragraph("<b>Payment</b>", base_normal), Paragraph("UPI", base_normal)]
        ]
        
        details_table = Table(details_data, colWidths=[cw1, cw2, cw3, cw4])
        details_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
            ('BOX', (0,0), (-1,-1), 0.5, colors.lightgrey),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(details_table)
        elements.append(Spacer(1, 10))

        # 5. Items Table
        items_data = []
        
        header_base = ParagraphStyle('WhiteCenter', parent=center_style, textColor=colors.white)
        items_data.append([
            Paragraph("<b>#</b>", header_base),
            Paragraph("<b>Medicine / Item Description</b>", header_base),
            Paragraph("<b>HSN</b>", header_base),
            Paragraph("<b>Qty</b>", header_base),
            Paragraph("<b>Rate (Rs.)</b>", header_base),
            Paragraph("<b>Amount (Rs.)</b>", header_base),
        ])

        medicine_ids = [item.medicine_id for item in sale.items]
        medicines = db.query(Medicine).filter(
            Medicine.id.in_(medicine_ids), 
            Medicine.organization_id == org_id
        ).all()
        medicine_dict = {m.id: m for m in medicines}

        for idx, item in enumerate(sale.items, 1):
            med = medicine_dict.get(item.medicine_id)
            name = med.name if med else f"Medicine ID: {item.medicine_id}"
            hsn = "3004"
            qty = str(item.quantity)
            rate = f"{item.selling_price:.2f}"
            amt = f"{item.quantity * item.selling_price:.2f}"

            items_data.append([
                Paragraph(str(idx), center_style),
                Paragraph(name, base_normal),
                Paragraph(hsn, center_style),
                Paragraph(qty, center_style),
                Paragraph(rate, right_style),
                Paragraph(amt, right_style),
            ])

        items_table = Table(items_data, colWidths=[30, 230, 60, 45, 80, 90])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1b365d")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        
        elements.append(items_table)
        elements.append(Spacer(1, 10))

        # 6. Totals Section
        totals_data = [
            [Paragraph("Sub Total", base_normal), Paragraph(f"Rs. {sale.total_amount + sale.discount_amount:.2f}", right_style)]
        ]
        
        if sale.discount_amount > 0:
            totals_data.append([Paragraph("Discount", base_normal), Paragraph(f"- Rs. {sale.discount_amount:.2f}", right_style)])
            
        totals_data.append([Paragraph("<b>Grand Total</b>", base_normal), Paragraph(f"<b>Rs. {sale.total_amount:.2f}</b>", right_style)])
        
        totals_table = Table(totals_data, colWidths=[130, 90])
        totals_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
            ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#eef4f9")),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        
        wrap_table = Table([["", totals_table]], colWidths=[pdf.width - 220, 220])
        wrap_table.setStyle(TableStyle([
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ]))
        elements.append(wrap_table)
        elements.append(Spacer(1, 15))

        # 7. Amount in Words
        if num2words:
            rupees = int(sale.total_amount)
            paise = int(round((sale.total_amount - rupees) * 100))
            words = num2words(rupees, lang='en_IN').title()
            if paise > 0:
                words += f" and {num2words(paise, lang='en_IN').title()} Paise"
            words = f"{words} Only"
        else:
            words = f"Rs. {sale.total_amount:.2f}"
            
        elements.append(Paragraph(f"<b>Amount in Words:</b> {words}", base_normal))
        elements.append(Spacer(1, 15))

        # 8. Footer Block
        terms_html = (
            "<b>Terms & Notes</b><br/><br/>"
            "• Medicines once sold are not returnable unless permitted by applicable law.<br/>"
            "• Please check medicines and bill before leaving the premises.<br/>"
            "• This is a computer-generated sample bill."
        )
        sig_html = (
            f"<b>For {pharmacy_name.upper()}</b><br/><br/><br/><br/>"
            "<b>Authorized Signatory</b>"
        )
        
        footer_data = [
            [Paragraph(terms_html, base_normal), Paragraph(sig_html, center_style)]
        ]
        
        footer_table = Table(footer_data, colWidths=[pdf.width * 0.6, pdf.width * 0.4])
        footer_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        elements.append(footer_table)
        elements.append(Spacer(1, 20))

        elements.append(Paragraph("Thank you for choosing us.", center_style))

        pdf.build(elements)
        buffer.seek(0)
        return buffer
