from django.urls import path
from . import views, reports

urlpatterns = [
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('reports/rooms/', reports.RoomsReportView.as_view(), name='report-rooms'),
    path('reports/reservations/', reports.ReservationsReportView.as_view(), name='report-reservations'),
    path('reports/tenants/', reports.TenantsReportView.as_view(), name='report-tenants'),
    path('reports/revenue/', reports.RevenueReportView.as_view(), name='report-revenue'),
]
