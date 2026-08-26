from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('external-residences', views.ExternalResidenceViewSet, basename='external-residence')

urlpatterns = router.urls
