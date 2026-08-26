import os
import uuid

from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework import viewsets, status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from apps.common.mixins import ProtectedDestroyMixin
from .models import Hostel, Zone, RoomType, ComfortOption, Amenity, Room, Price
from .permissions import IsStaffOrPublicReadOnly
from .serializers import (
    HostelListSerializer, HostelDetailSerializer, ZoneSerializer,
    RoomTypeSerializer, ComfortOptionSerializer, AmenitySerializer,
    RoomListSerializer, RoomDetailSerializer, PriceSerializer,
)


class HostelViewSet(ProtectedDestroyMixin, viewsets.ModelViewSet):
    permission_classes = [IsStaffOrPublicReadOnly]
    filter_backends = [SearchFilter]
    search_fields = ['name', 'address']

    def get_queryset(self):
        return Hostel.objects.order_by('name')

    def get_serializer_class(self):
        if self.action == 'list':
            return HostelListSerializer
        return HostelDetailSerializer


class ZoneViewSet(ProtectedDestroyMixin, viewsets.ModelViewSet):
    permission_classes = [IsStaffOrPublicReadOnly]
    serializer_class = ZoneSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['hostel']
    search_fields = ['name', 'hostel__name']
    queryset = Zone.objects.select_related('hostel').all()


class RoomTypeViewSet(ProtectedDestroyMixin, viewsets.ModelViewSet):
    permission_classes = [IsStaffOrPublicReadOnly]
    serializer_class = RoomTypeSerializer
    search_fields = ['name']
    queryset = RoomType.objects.all()


class ComfortOptionViewSet(ProtectedDestroyMixin, viewsets.ModelViewSet):
    permission_classes = [IsStaffOrPublicReadOnly]
    serializer_class = ComfortOptionSerializer
    search_fields = ['name']
    queryset = ComfortOption.objects.all()


class AmenityViewSet(ProtectedDestroyMixin, viewsets.ModelViewSet):
    permission_classes = [IsStaffOrPublicReadOnly]
    serializer_class = AmenitySerializer
    search_fields = ['name']
    queryset = Amenity.objects.all()


class PriceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffOrPublicReadOnly]
    serializer_class = PriceSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['hostel', 'room_type', 'comfort', 'is_active']
    search_fields = ['hostel__name', 'room_type__name', 'comfort__name']
    queryset = Price.objects.select_related('hostel', 'room_type', 'comfort').all()


class RoomViewSet(viewsets.ModelViewSet):
    """Catalogue de chambres — utilisé par le site public (recherche/disponibilité)
    et par le back-office (gestion)."""

    permission_classes = [IsStaffOrPublicReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['hostel', 'zone', 'room_type', 'comfort', 'status', 'electricity_policy']
    search_fields = ['number', 'hostel__name']
    ordering_fields = ['number', 'created_at']

    def get_queryset(self):
        queryset = Room.objects.select_related(
            'hostel', 'zone', 'room_type', 'comfort'
        ).prefetch_related('amenities')
        if self.action == 'list' and not (
            self.request.user and self.request.user.is_authenticated
            and not self.request.user.is_student_role
        ):
            # Le catalogue public ne montre que les chambres louables.
            queryset = queryset.exclude(
                status__in=[Room.Status.OUT_OF_SERVICE, Room.Status.MAINTENANCE]
            )
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return RoomListSerializer
        return RoomDetailSerializer

    @action(detail=True, methods=['post', 'delete'], url_path='photos', parser_classes=[MultiPartParser])
    def photos(self, request, pk=None):
        room = self.get_object()

        if request.method == 'DELETE':
            photo_id = request.query_params.get('id')
            target = next((p for p in room.photos if p.get('id') == photo_id), None)
            if not target:
                return Response({'detail': 'Photo introuvable.'}, status=status.HTTP_404_NOT_FOUND)
            try:
                relative_path = target['url'].replace(settings.MEDIA_URL, '', 1)
                if default_storage.exists(relative_path):
                    default_storage.delete(relative_path)
            except Exception:
                pass
            room.photos = [p for p in room.photos if p.get('id') != photo_id]
            room.save(update_fields=['photos'])
            return Response(RoomDetailSerializer(room).data)

        allowed_extensions = ['.jpg', '.jpeg', '.png']
        allowed_mime_types = ['image/jpeg', 'image/png']

        upload = request.FILES.get('file')
        if not upload:
            return Response({'detail': 'Aucun fichier reçu.'}, status=status.HTTP_400_BAD_REQUEST)
        ext = os.path.splitext(upload.name)[1].lower()
        if ext not in allowed_extensions:
            return Response(
                {'detail': f"Format non autorisé. Formats acceptés : {', '.join(allowed_extensions)}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if upload.content_type not in allowed_mime_types:
            return Response({'detail': 'Type de fichier non autorisé.'}, status=status.HTTP_400_BAD_REQUEST)
        if upload.size > settings.FILE_UPLOAD_MAX_MEMORY_SIZE:
            return Response({'detail': 'Fichier trop volumineux (5 Mo maximum).'}, status=status.HTTP_400_BAD_REQUEST)

        photo_id = uuid.uuid4().hex
        path = default_storage.save(f'room_photos/{room.id}/{photo_id}{ext}', upload)
        entry = {'id': photo_id, 'name': upload.name, 'url': default_storage.url(path)}
        room.photos = [*room.photos, entry]
        room.save(update_fields=['photos'])
        return Response(RoomDetailSerializer(room).data, status=status.HTTP_201_CREATED)
