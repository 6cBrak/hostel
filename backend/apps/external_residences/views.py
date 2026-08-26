from rest_framework import viewsets
from apps.authentication.permissions import IsStaffOrReadOnly
from .models import ExternalResidence
from .serializers import ExternalResidenceSerializer


class ExternalResidenceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffOrReadOnly]
    serializer_class = ExternalResidenceSerializer
    search_fields = ['name', 'address', 'contact_name']
    queryset = ExternalResidence.objects.all()
