from io import BytesIO

from django.core.files.base import ContentFile
from django.template.loader import render_to_string
from xhtml2pdf import pisa

from apps.sitesettings.models import SiteSettings


def _render_pdf(template_name, context):
    html = render_to_string(template_name, context)
    buffer = BytesIO()
    pisa.CreatePDF(html, dest=buffer)
    return buffer.getvalue()


def generate_invoice_pdf(invoice):
    context = {
        'invoice': invoice,
        'reservation': invoice.reservation,
        'settings': SiteSettings.load(),
    }
    pdf_bytes = _render_pdf('billing/invoice_pdf.html', context)
    invoice.pdf_file.save(f'{invoice.invoice_number}.pdf', ContentFile(pdf_bytes), save=True)


def generate_receipt_pdf(receipt):
    context = {
        'receipt': receipt,
        'payment': receipt.payment,
        'invoice': receipt.payment.invoice,
        'settings': SiteSettings.load(),
    }
    pdf_bytes = _render_pdf('billing/receipt_pdf.html', context)
    receipt.pdf_file.save(f'{receipt.receipt_number}.pdf', ContentFile(pdf_bytes), save=True)
