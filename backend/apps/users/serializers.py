from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import OTP

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""

    roles = serializers.ListField(child=serializers.CharField(), required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'phone', 'email', 'role', 'roles', 'is_active', 
                  'is_verified', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users"""
    
    password = serializers.CharField(write_only=True, required=False)
    roles = serializers.ListField(child=serializers.CharField(), required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'phone', 'email', 'role', 'roles', 'password']
        read_only_fields = ['id']
        extra_kwargs = {
            'username': {'required': False, 'allow_null': True},
            'email': {'required': False, 'allow_null': True, 'allow_blank': True},
        }
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        # Remove empty email if provided as empty string
        if 'email' in validated_data and not validated_data['email']:
            validated_data.pop('email')
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for login (OTP request) - accepts phone or username and delivery method"""
    
    identifier = serializers.CharField(max_length=255, help_text="Phone number or username")
    delivery_method = serializers.ChoiceField(
        choices=['sms', 'email'],
        help_text="Choose OTP delivery method: 'sms' or 'email'"
    )


class VerifyOTPSerializer(serializers.Serializer):
    """Serializer for OTP verification - accepts identifier (phone/email) and OTP code"""
    
    identifier = serializers.CharField(max_length=255, help_text="Phone number or email used for OTP")
    otp_code = serializers.CharField(max_length=6)


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password"""
    
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
