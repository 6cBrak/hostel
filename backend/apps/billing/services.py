from .models import Invoice
from .pdf import generate_invoice_pdf


def _compute_amounts(reservation):
    """Montant du séjour (tarif par lit × lits réservés × nombre de mois) + frais
    additionnels, depuis la grille tarifaire courante. Partagé par la
    génération initiale et le recalcul d'une facture existante — voir
    generate_proforma_invoice et recalculate_invoice ci-dessous.

    Les frais admin/électricité et la caution restent flat (payés une fois
    pour tout le séjour), non multipliés par la durée."""
    room = reservation.room
    price = room.current_price if room else None
    months = reservation.duration_months or 1
    stay_amount = (price.monthly_rate * reservation.beds_reserved * months) if price else 0
    deposit_amount = price.deposit if price else None
    additional_fees = 0
    if price and price.admin_fee:
        additional_fees += price.admin_fee
    if price and price.electricity_fee and room.electricity_policy == room.ElectricityPolicy.ADDITIONAL:
        additional_fees += price.electricity_fee
    return stay_amount, additional_fees, deposit_amount


def generate_proforma_invoice(reservation):
    """Génère la facture pro-forma dès qu'une réservation est acceptée (section 12).

    Le montant du séjour est le tarif par lit (Price.monthly_rate) multiplié par
    le nombre de lits réservés ET par la durée (duration_months) — une facture
    unique couvrant tout le séjour. Les frais admin/électricité et la caution
    restent flat, payés une fois pour tout le séjour.
    L'échéancier (acompte / 2e tranche / solde) reste à renseigner par le staff
    tant que la politique exacte n'est pas validée par le client (section 30).
    """

    if hasattr(reservation, 'invoice'):
        return reservation.invoice

    stay_amount, additional_fees, deposit_amount = _compute_amounts(reservation)

    invoice = Invoice.objects.create(
        reservation=reservation,
        stay_amount=stay_amount,
        additional_fees=additional_fees,
        deposit_amount=deposit_amount,
        total_amount=stay_amount + additional_fees,
    )
    generate_invoice_pdf(invoice)
    return invoice


def recalculate_invoice(invoice):
    """Recalcule stay_amount/additional_fees/total_amount d'une facture existante
    depuis la grille tarifaire courante.

    Utile quand le tarif était absent (ou à 0) au moment de la génération et a
    été complété depuis dans Tarifs — la facture ne se met pas à jour toute
    seule. Refuse si des paiements existent déjà, pour ne pas fausser un solde
    déjà mouvementé (annuler le paiement d'abord si un recalcul est vraiment
    nécessaire dans ce cas).
    """
    if invoice.payments.exists():
        raise ValueError(
            "Impossible de recalculer : des paiements sont déjà enregistrés sur cette facture."
        )

    stay_amount, additional_fees, deposit_amount = _compute_amounts(invoice.reservation)
    invoice.stay_amount = stay_amount
    invoice.additional_fees = additional_fees
    invoice.deposit_amount = deposit_amount
    invoice.total_amount = stay_amount + additional_fees
    invoice.save(update_fields=['stay_amount', 'additional_fees', 'deposit_amount', 'total_amount', 'updated_at'])
    generate_invoice_pdf(invoice)
    return invoice
