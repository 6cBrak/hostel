from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from apps.authentication.permissions import IsAdmin
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
