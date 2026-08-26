from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin


class IsStaff(BasePermission):
    """Tout profil interne (admin, gestionnaire, comptable, agent d'accueil) — exclut l'étudiant."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and not request.user.is_student_role


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user.is_admin


class IsStaffOrReadOnly(BasePermission):
    """Lecture ouverte à tout utilisateur authentifié, écriture réservée au staff interne."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return not request.user.is_student_role
