from django.db.models import ProtectedError
from rest_framework import status
from rest_framework.response import Response


class ProtectedDestroyMixin:
    """Renvoie une erreur 400 claire plutôt qu'un 500 quand l'objet est
    encore référencé ailleurs (ex. type de chambre utilisé par des chambres)."""

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {'detail': "Suppression impossible : cet élément est encore utilisé ailleurs."},
                status=status.HTTP_400_BAD_REQUEST,
            )
