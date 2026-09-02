from .models import Invoice
from .pdf import generate_invoice_pdf


def generate_proforma_invoice(reservation):
    """Génère la facture pro-forma dès qu'une réservation est acceptée (section 12).

    Le montant du séjour est le tarif par lit (Price.monthly_rate) multiplié par
    le nombre de lits réservés — un locataire seul paie pour 1 lit, un locataire
    qui loue toute la chambre paie pour tous les lits. Les frais admin/électricité
    et la caution restent flat, non multipliés par le nombre de lits.
    L'échéancier (acompte / 2e tranche / solde) reste à renseigner par le staff
    tant que la politique exacte n'est pas validée par le client (section 30).
    """

    if hasattr(reservation, 'invoice'):
        return reservation.invoice

    room = reservation.room
    price = room.current_price if room else None
    stay_amount = (price.monthly_rate * reservation.beds_reserved) if price else 0
    deposit_amount = price.deposit if price else None
    additional_fees = 0
    if price and price.admin_fee:
        additional_fees += price.admin_fee
    if price and price.electricity_fee and room.electricity_policy == room.ElectricityPolicy.ADDITIONAL:
        additional_fees += price.electricity_fee

    invoice = Invoice.objects.create(
        reservation=reservation,
        stay_amount=stay_amount,
        additional_fees=additional_fees,
        deposit_amount=deposit_amount,
        total_amount=stay_amount + additional_fees,
    )
    generate_invoice_pdf(invoice)
    return invoice
