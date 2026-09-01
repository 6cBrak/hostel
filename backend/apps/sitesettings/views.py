from django.http import JsonResponse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from apps.authentication.permissions import IsAdmin
from apps.reservations.services import build_tenants_reset_backup, reset_tenants_data
from .models import SiteSettings
from .serializers import SiteSettingsSerializer


class SiteSettingsView(APIView):
    """Lecture publique (pour l'affichage du logo et des coordonnées sur le site),
    écriture réservée à l'administrateur principal."""

    def get_permissions(self):
        if self.request.method in ('PATCH', 'PUT'):
            return [IsAdmin()]
        return [AllowAny()]

    def get(self, request):
        return Response(SiteSettingsSerializer(SiteSettings.load()).data)

    def patch(self, request):
        settings = SiteSettings.load()
        serializer = SiteSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ResetTenantsBackupView(APIView):
    """Génère un export JSON de tout ce que ResetTenantsDataView s'apprête à
    supprimer (réservations, factures, paiements, reçus, étudiants) — à
    télécharger avant toute réinitialisation. Rien n'est stocké côté serveur."""

    permission_classes = [IsAdmin]

    def get(self, request):
        payload = build_tenants_reset_backup()
        filename = f"sauvegarde_locataires_{timezone.now():%Y%m%d_%H%M%S}.json"
        response = JsonResponse(payload, json_dumps_params={'ensure_ascii': False, 'indent': 2})
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class ResetTenantsDataView(APIView):
    """Supprime définitivement réservations / factures / paiements / reçus /
    étudiants (et leurs comptes de connexion), remet les chambres impactées à
    'Disponible'. Réservé à l'administrateur principal, nécessite le mot de
    confirmation exact 'SUPPRIMER'."""

    permission_classes = [IsAdmin]

    def post(self, request):
        if request.data.get('confirm') != 'SUPPRIMER':
            return Response(
                {'detail': "Confirmation invalide. Tapez exactement SUPPRIMER pour valider."},
                status=400,
            )
        summary = reset_tenants_data()
        return Response(summary)
