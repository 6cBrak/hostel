from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register('expense-categories', views.ExpenseCategoryViewSet, basename='expense-category')
router.register('expenses', views.ExpenseViewSet, basename='expense')
router.register('cash-movements', views.CashMovementViewSet, basename='cash-movement')

urlpatterns = [
    path('cashbox/', views.CashBoxSummaryView.as_view(), name='cashbox-summary'),
] + router.urls
