from django.urls import path
from . import views

urlpatterns = [
    path('settings/', views.SiteSettingsView.as_view(), name='site-settings'),
    path('administration/reset-backup/', views.ResetTenantsBackupView.as_view(), name='reset-tenants-backup'),
    path('administration/reset-tenants-data/', views.ResetTenantsDataView.as_view(), name='reset-tenants-data'),
]
