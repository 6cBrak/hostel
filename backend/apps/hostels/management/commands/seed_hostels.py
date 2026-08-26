"""Charge les 4 hostels, leurs zones et un jeu de chambres de démonstration
à partir des chiffres exacts du cahier des charges (sections 4 à 7).

Les types de chambre/confort affectés à chaque chambre sont PROVISOIRES —
la répartition exacte n'est pas fournie dans le cahier des charges et doit
être confirmée par le client (section 30) avant mise en production.

Usage : python manage.py seed_hostels
"""
from itertools import cycle

from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.hostels.models import Hostel, Zone, RoomType, ComfortOption, Room, Price

ROOM_TYPES = [
    ('Individuelle', 1),
    ('Double', 2),
    ('Triple', 3),
    ('Quadruple', 4),
]
COMFORT_OPTIONS = ['Ventilée', 'Climatisée']

KAMAL_ZONES = [
    ('Ra', 6), ('Rb', 3), ('Rc', 3), ('Rd', 5), ('R+1a', 6), ('R+1b', 2),
]
MUFTAH_BLOCKS = [
    ('Bloc 1', range(1, 3)),
    ('Bloc 2', range(3, 8)),
    ('Bloc 3', range(8, 11)),
    ('Bloc 4', range(11, 17)),
    ('Bloc 5', range(17, 23)),
    ('Bloc 6', range(23, 29)),
]


class Command(BaseCommand):
    help = "Charge les hostels, zones et chambres de démonstration (données du cahier des charges)."

    def handle(self, *args, **options):
        room_types = {
            name: RoomType.objects.get_or_create(name=name, defaults={'capacity': cap})[0]
            for name, cap in ROOM_TYPES
        }
        comforts = {
            name: ComfortOption.objects.get_or_create(name=name)[0]
            for name in COMFORT_OPTIONS
        }
        combos = list(
            (rt, comforts[cf]) for rt in room_types.values() for cf in COMFORT_OPTIONS
        )
        combo_cycle = cycle(combos)

        self._seed_kamal(room_types, comforts, combo_cycle)
        self._seed_muftah(combo_cycle)
        self._seed_ossei(combo_cycle)
        self._seed_dzorwulu(combo_cycle)

        for hostel in Hostel.objects.all():
            for room_type in room_types.values():
                for comfort in comforts.values():
                    Price.objects.get_or_create(
                        hostel=hostel, room_type=room_type, comfort=comfort,
                        defaults={'monthly_rate': 0},
                    )

        self.stdout.write(self.style.SUCCESS(
            'Hostels, zones, chambres et grille tarifaire (à 0, à compléter) créés.'
        ))
        self.stdout.write(self.style.WARNING(
            'Rappel : types/confort par chambre sont provisoires (section 30 du cahier des charges).'
        ))

    def _get_or_create_hostel(self, name, **kwargs):
        hostel, _ = Hostel.objects.get_or_create(
            name=name, defaults={'slug': slugify(name), **kwargs}
        )
        return hostel

    def _create_room(self, hostel, number, zone, combo_cycle, floor=''):
        room_type, comfort = next(combo_cycle)
        Room.objects.get_or_create(
            hostel=hostel, number=number,
            defaults={
                'zone': zone,
                'floor': floor,
                'room_type': room_type,
                'comfort': comfort,
                'notes': 'Type/confort provisoires — à confirmer avec le client.',
            },
        )

    def _seed_kamal(self, room_types, comforts, combo_cycle):
        hostel = self._get_or_create_hostel(
            'Hostel Kamal',
            description="Bâtiment en R+1, 25 chambres réparties en 6 zones.",
        )
        for zone_name, count in KAMAL_ZONES:
            zone, _ = Zone.objects.get_or_create(hostel=hostel, name=zone_name)
            for i in range(1, count + 1):
                self._create_room(hostel, f'{zone_name}-{i}', zone, combo_cycle)

    def _seed_muftah(self, combo_cycle):
        hostel = self._get_or_create_hostel(
            'Hostel Muftah',
            description="28 chambres organisées en 6 blocs.",
        )
        for block_name, room_range in MUFTAH_BLOCKS:
            zone, _ = Zone.objects.get_or_create(hostel=hostel, name=block_name)
            for i in room_range:
                self._create_room(hostel, str(i), zone, combo_cycle)

    def _seed_ossei(self, combo_cycle):
        hostel = self._get_or_create_hostel(
            'Hostel Ossei',
            description=(
                "4 chambres annoncées — numérotation à confirmer avec le client "
                "avant mise en production (section 6 du cahier des charges)."
            ),
        )
        for i in range(1, 5):
            self._create_room(hostel, f'OSSEI-{i}', None, combo_cycle)

    def _seed_dzorwulu(self, combo_cycle):
        hostel = self._get_or_create_hostel(
            'Hostel Dzorwulu',
            description="5 chambres, cuisine externe.",
            has_external_kitchen=True,
        )
        for i in range(1, 6):
            self._create_room(hostel, f'DZ-{i}', None, combo_cycle)
