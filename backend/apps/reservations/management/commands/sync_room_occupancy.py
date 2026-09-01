"""Bascule en 'Occupée' les chambres dont la réservation a reçu au moins un
paiement et dont la date d'arrivée souhaitée est atteinte.

À exécuter quotidiennement via une tâche planifiée (cron) — voir
deploy/setup_vps.sh pour l'entrée crontab correspondante.

Usage : python manage.py sync_room_occupancy
"""
from django.core.management.base import BaseCommand

from apps.reservations.services import sync_all_pending_room_occupancy


class Command(BaseCommand):
    help = (
        "Bascule en 'Occupée' les chambres réservées dont la date d'arrivée "
        "est atteinte et qui ont reçu au moins un paiement."
    )

    def handle(self, *args, **options):
        count = sync_all_pending_room_occupancy()
        if count:
            self.stdout.write(self.style.SUCCESS(f"{count} chambre(s) basculée(s) en Occupée."))
        else:
            self.stdout.write("Aucune chambre à basculer.")
