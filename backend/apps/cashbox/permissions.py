from rest_framework.permissions import BasePermission


class IsFinanceStaff(BasePermission):
    """Accès au module Dépenses & Caisse : admin, gestionnaire ou comptable."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated
            and (user.is_admin or user.is_manager or user.is_accountant)
        )
