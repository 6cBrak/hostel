from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.filters import SearchFilter
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import User
from .serializers import (
    LoginSerializer, UserSerializer, UserCreateSerializer,
    UserUpdateSerializer, SelfUpdateSerializer, ChangePasswordSerializer, StudentRegisterSerializer,
)
from .permissions import IsAdmin


class RegisterView(APIView):
    """Auto-inscription publique pour un étudiant souhaitant réserver."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = StudentRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        from apps.notifications.models import Notification
        from apps.notifications.services import notify
        notify(
            user,
            Notification.Type.ACCOUNT_CREATED,
            'Bienvenue sur SMART HOSTEL ATOMA',
            f"Bonjour {user.full_name}, votre compte a bien été créé. "
            "Vous pouvez maintenant consulter les hostels et soumettre une demande de réservation.",
        )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'detail': 'Le token de refresh est requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {'detail': 'Token invalide ou déjà révoqué.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response({'detail': 'Déconnexion réussie.'}, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = SelfUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Mot de passe modifié avec succès.'})


class UserListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    queryset = User.objects.all().order_by('full_name')
    filter_backends = [SearchFilter]
    search_fields = ['full_name', 'email', 'phone_number']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UserUpdateSerializer
        return UserSerializer

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            return Response(
                {'detail': 'Vous ne pouvez pas désactiver votre propre compte.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response({'detail': 'Utilisateur désactivé.'}, status=status.HTTP_200_OK)
