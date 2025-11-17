from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO
from datetime import datetime


class PDFService:

    @staticmethod
    def generate_sale_invoice(sale):
        buffer = BytesIO()

        pdf = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=40, leftMargin=40,
            topMargin=40, bottomMargin=30
        )

        styles = getSampleStyleSheet()
        elements = []

        # ------------ Header (Pharmacy Details) ------------
        title = Paragraph("<b><font size=16>Pharmacy Management System</font></b>", styles['Title'])
        elements.append(title)

        elements.append(Paragraph("Your Pharmacy Name", styles['Heading4']))
        elements.append(Paragraph("123 Main Street, Dhaka, Bangladesh", styles['Normal']))
        elements.append(Paragraph("Phone: +880 123-456789", styles['Normal']))
        elements.append(Spacer(1, 12))

        # ------------ Invoice Info ------------
        invoice_info = [
            ["Invoice No:", sale.invoice_number],
            ["Customer:", sale.customer_name or "Walk-in Customer"],
            ["Date:", str(sale.sale_date)],
        ]

        invoice_table = Table(invoice_info, colWidths=[120, 300])
        invoice_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 11),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))

        elements.append(invoice_table)
        elements.append(Spacer(1, 12))

        # ------------ Items Table ------------
        data = [
            ["Medicine ID", "Batch ID", "Qty", "Price", "Total"]
        ]

        for item in sale.items:
            total = item.quantity * item.selling_price
            data.append([
                str(item.medicine_id),
                str(item.batch_id),
                str(item.quantity),
                f"{item.selling_price:.2f}",
                f"{total:.2f}"
            ])

        table = Table(data, colWidths=[90, 90, 60, 90, 90])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ]))

        elements.append(table)
        elements.append(Spacer(1, 16))

        # ------------ Total Amount ------------
        total_para = Paragraph(
            f"<b><font size=12>Total Amount: {sale.total_amount:.2f} BDT</font></b>",
            styles['Normal']
        )
        elements.append(total_para)
        elements.append(Spacer(1, 20))

        # ------------ Footer ------------
        footer = Paragraph(
            "<i>Thank you for purchasing from Pharmacy Management System!</i>",
            styles['Normal']
        )
        elements.append(footer)

        pdf.build(elements)
        buffer.seek(0)
        return buffer
