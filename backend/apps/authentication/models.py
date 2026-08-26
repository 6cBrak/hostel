from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'email est obligatoire")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', User.Role.ADMIN)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Administrateur principal'
        MANAGER = 'manager', 'Gestionnaire de résidence'
        ACCOUNTANT = 'accountant', 'Agent financier / comptable'
        FRONT_DESK = 'front_desk', "Agent d'accueil"
        STUDENT = 'student', 'Étudiant / locataire'

    email = models.EmailField(unique=True, verbose_name='Email')
    full_name = models.CharField(max_length=150, verbose_name='Nom complet')
    phone_number = models.CharField(max_length=30, blank=True, verbose_name='Téléphone')
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)

    hostels = models.ManyToManyField(
        'hostels.Hostel',
        blank=True,
        related_name='managers',
        verbose_name='Hostels gérés',
        help_text="Pour un gestionnaire : les hostels auxquels il a accès.",
    )

    is_active = models.BooleanField(default=True, verbose_name='Actif')
    is_staff = models.BooleanField(default=False)
    failed_attempts = models.PositiveSmallIntegerField(default=0)
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = UserManager()

    class Meta:
        db_table = 'users'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['full_name']

    def __str__(self):
        return f'{self.full_name} ({self.email})'

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_manager(self):
        return self.role == self.Role.MANAGER

    @property
    def is_accountant(self):
        return self.role == self.Role.ACCOUNTANT

    @property
    def is_front_desk(self):
        return self.role == self.Role.FRONT_DESK

    @property
    def is_student_role(self):
        return self.role == self.Role.STUDENT

    def increment_failed_attempts(self):
        self.failed_attempts += 1
        if self.failed_attempts >= 5:
            self.is_active = False
        self.save(update_fields=['failed_attempts', 'is_active'])

    def reset_failed_attempts(self):
        self.failed_attempts = 0
        self.last_login_at = timezone.now()
        self.save(update_fields=['failed_attempts', 'last_login_at'])
