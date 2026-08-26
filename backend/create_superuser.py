#!/usr/bin/env python
"""Script pour créer le superuser admin initial."""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hostelatoma.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

django.setup()

from apps.authentication.models import User

EMAIL = 'admin@smarthostelatoma.local'
PASSWORD = 'Admin@2026!'
FULL_NAME = 'Administrateur SMART HOSTEL ATOMA'

if User.objects.filter(email=EMAIL).exists():
    print(f'[OK] Superuser "{EMAIL}" existe deja.')
else:
    User.objects.create_superuser(
        email=EMAIL,
        password=PASSWORD,
        full_name=FULL_NAME,
    )
    print(f'[OK] Superuser cree : {EMAIL} / {PASSWORD}')
    print('  Changez le mot de passe apres la premiere connexion !')
