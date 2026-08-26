from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsStaffOrOwnerReadOnly(BasePermission):
    """Le staff interne a un accès complet ; l'étudiant ne peut que consulter
    ses propres factures/paiements/reçus (espace étudiant, section 19)."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method not in SAFE_METHODS and request.user.is_student_role:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        if not request.user.is_student_role:
            return True
        return request.method in SAFE_METHODS
