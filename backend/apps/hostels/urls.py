from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('hostels', views.HostelViewSet, basename='hostel')
router.register('zones', views.ZoneViewSet, basename='zone')
router.register('room-types', views.RoomTypeViewSet, basename='room-type')
router.register('comfort-options', views.ComfortOptionViewSet, basename='comfort-option')
router.register('amenities', views.AmenityViewSet, basename='amenity')
router.register('prices', views.PriceViewSet, basename='price')
router.register('rooms', views.RoomViewSet, basename='room')

urlpatterns = router.urls
