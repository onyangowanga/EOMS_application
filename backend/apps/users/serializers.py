from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import OTP

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    class Meta:
        model = User
        fields = ['id', 'full_name', 'phone', 'email', 'role', 'is_active', 
                  'is_verified', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users"""
    
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['full_name', 'phone', 'email', 'role', 'password']
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for login (OTP request)"""
    
    phone = serializers.CharField(max_length=15)


class VerifyOTPSerializer(serializers.Serializer):
    """Serializer for OTP verification"""
    
    phone = serializers.CharField(max_length=15)
    otp_code = serializers.CharField(max_length=6)


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password"""
    
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
