from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsStaffOrPublicReadOnly(BasePermission):
    """Catalogue public en lecture (site vitrine, sans authentification) ;
    écriture réservée au staff interne (tout rôle sauf étudiant)."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and not request.user.is_student_role
        )
