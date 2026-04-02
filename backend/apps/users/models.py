from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom user manager for phone-based authentication"""
    
    def create_user(self, phone, full_name, password=None, **extra_fields):
        if not phone:
            raise ValueError('Users must have a phone number')
        if not full_name:
            raise ValueError('Users must have a full name')
        
        user = self.model(phone=phone, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, phone, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(phone, full_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model with phone-based authentication"""
    
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('LEADER', 'Committee Leader'),
        ('MEMBER', 'Member'),
        ('FINANCE', 'Finance Officer'),
        ('STAKEHOLDER', 'Stakeholder'),
    ]
    
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=15, unique=True)
    email = models.EmailField(blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='MEMBER')
    roles = models.JSONField(default=list, blank=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = ['full_name']
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.full_name} ({self.phone})"

    @property
    def effective_roles(self):
        """Return explicit RBAC roles with fallback from legacy role."""
        role_map = {
            'ADMIN': ['executive_admin'],
            'FINANCE': ['finance_member'],
            'LEADER': ['chair'],
            'MEMBER': ['committee_member'],
            'STAKEHOLDER': ['committee_member'],
        }

        explicit = self.roles or []
        mapped = role_map.get(self.role, [])
        return list(dict.fromkeys([*explicit, *mapped]))


class OTP(models.Model):
    """OTP model for phone/email verification"""

    PURPOSE_CHOICES = [
        ('login', 'Login'),
        ('password_reset', 'Password Reset'),
    ]
    
    phone = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='login')
    otp_code = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'otps'
        ordering = ['-created_at']
    
    def __str__(self):
        identifier = self.email or self.phone
        return f"OTP for {identifier}"
    
    def is_valid(self):
        """Check if OTP is still valid"""
        return timezone.now() < self.expires_at and not self.is_verified
