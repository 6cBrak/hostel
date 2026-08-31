from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone_number', 'role',
            'hostels', 'is_active', 'last_login_at', 'created_at',
        ]
        read_only_fields = ['id', 'last_login_at', 'created_at']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['email', 'full_name', 'phone_number', 'role', 'hostels', 'password', 'is_active']

    def create(self, validated_data):
        hostels = validated_data.pop('hostels', [])
        user = User.objects.create_user(**validated_data)
        if hostels:
            user.hostels.set(hostels)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['full_name', 'phone_number', 'role', 'hostels', 'is_active']


class SelfUpdateSerializer(serializers.ModelSerializer):
    """Auto-édition par l'utilisateur connecté — volontairement limité :
    ni email (identifiant de connexion), ni rôle, ni statut."""

    class Meta:
        model = User
        fields = ['full_name', 'phone_number']


class StudentRegisterSerializer(serializers.ModelSerializer):
    """Auto-inscription publique — toujours créée avec le rôle 'student'.
    Capture aussi la nationalité et la date de naissance (profil étudiant) dès
    l'inscription plutôt que de les laisser vides jusqu'à un futur passage sur
    « Mon profil »."""

    password = serializers.CharField(write_only=True, min_length=8)
    nationality = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=80)
    date_of_birth = serializers.DateField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['email', 'full_name', 'phone_number', 'password', 'nationality', 'date_of_birth']

    def create(self, validated_data):
        nationality = validated_data.pop('nationality', '')
        date_of_birth = validated_data.pop('date_of_birth', None)
        validated_data['role'] = User.Role.STUDENT
        user = User.objects.create_user(**validated_data)

        from apps.reservations.models import Student
        Student.objects.create(user=user, nationality=nationality, date_of_birth=date_of_birth)

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Identifiants invalides.')

        if not user.is_active:
            raise serializers.ValidationError(
                'Compte désactivé. Contactez un administrateur.'
            )

        if not user.check_password(password):
            user.increment_failed_attempts()
            remaining = max(0, 5 - user.failed_attempts)
            if remaining == 0:
                raise serializers.ValidationError(
                    'Compte bloqué après 5 tentatives échouées.'
                )
            raise serializers.ValidationError(
                f'Mot de passe incorrect. {remaining} tentative(s) restante(s).'
            )

        user.reset_failed_attempts()
        data['user'] = user
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Ancien mot de passe incorrect.')
        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
