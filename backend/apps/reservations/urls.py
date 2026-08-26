from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('reservations', views.ReservationViewSet, basename='reservation')
router.register('check-ins', views.CheckInViewSet, basename='check-in')
router.register('check-outs', views.CheckOutViewSet, basename='check-out')

urlpatterns = [
    path('students/me/', views.MyStudentProfileView.as_view(), name='student-me'),
    path('students/me/documents/', views.MyStudentDocumentsView.as_view(), name='student-me-documents'),
] + router.urls
