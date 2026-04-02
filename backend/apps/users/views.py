from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random
import logging

from .models import OTP
from .serializers import (
    UserSerializer, UserCreateSerializer, LoginSerializer,
    VerifyOTPSerializer, ChangePasswordSerializer, PasswordLoginSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer
)
from .sms import send_otp_sms
from .email_service import send_otp_email
from .rbac import resolve_user_roles
from apps.events.models import EventMember

User = get_user_model()
logger = logging.getLogger(__name__)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for User CRUD operations"""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Only executive admins can list/manage all users."""
        user_roles = resolve_user_roles(self.request.user)
        if 'executive_admin' in user_roles:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    def create(self, request, *args, **kwargs):
        """Override create to add detailed error logging"""
        can_create_user = 'executive_admin' in resolve_user_roles(request.user) or EventMember.objects.filter(
            user=request.user,
            is_active=True,
            role__in=['EVENT_OWNER', 'CHAIRMAN', 'SECRETARY'],
        ).exists()

        if not can_create_user:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        logger.info(f"Creating user with data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"User creation validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"User creation exception: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        if 'executive_admin' not in resolve_user_roles(request.user):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """Request OTP for login - user provides identifier (username/phone) and chooses delivery method"""
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        identifier = serializer.validated_data['identifier']
        delivery_method = serializer.validated_data['delivery_method']
        
        # Lookup user by phone or username
        from django.db.models import Q
        try:
            user = User.objects.get(
                Q(phone=identifier) | Q(username=identifier)
            )
        except User.DoesNotExist:
            return Response({
                'error': 'User not found with provided identifier'
            }, status=status.HTTP_404_NOT_FOUND)
        except User.MultipleObjectsReturned:
            # In case of multiple matches, try exact match first
            user = User.objects.filter(phone=identifier).first() or \
                   User.objects.filter(username=identifier).first()
        
        # Validate user has contact for chosen delivery method
        if delivery_method == 'sms':
            if not user.phone:
                return Response({
                    'error': 'No phone number registered for this user'
                }, status=status.HTTP_400_BAD_REQUEST)
            contact = user.phone
        else:  # email
            if not user.email:
                return Response({
                    'error': 'No email registered for this user'
                }, status=status.HTTP_400_BAD_REQUEST)
            contact = user.email
        
        # Generate 6-digit OTP
        otp_code = str(random.randint(100000, 999999))
        
        # Create OTP record with the appropriate field
        otp = OTP.objects.create(
            phone=user.phone if delivery_method == 'sms' else None,
            email=user.email if delivery_method == 'email' else None,
            purpose='login',
            otp_code=otp_code,
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        
        # Send OTP via chosen method
        if delivery_method == 'sms':
            sent = send_otp_sms(contact, otp_code)
        else:
            sent = send_otp_email(contact, otp_code)
        
        if not sent:
            logger.warning(f"Failed to send {delivery_method} to {contact}, but OTP created in database")
        
        return Response({
            'message': f'OTP sent to your registered {delivery_method}' if sent else f'OTP generated but {delivery_method} sending failed',
            'sent': sent,
            'method': delivery_method,
            # Only return OTP in development mode when sending fails
            'otp': otp_code if not sent else None
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny], url_path='login/password')
    def login_password(self, request):
        """Authenticate using identifier + password and return JWT tokens."""
        serializer = PasswordLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identifier = serializer.validated_data['identifier'].strip()
        password = serializer.validated_data['password']

        from django.db.models import Q

        # Support login by email, username, or phone.
        user = User.objects.filter(
            Q(email__iexact=identifier) | Q(username=identifier) | Q(phone=identifier)
        ).first()

        if not user or not user.check_password(password):
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.has_usable_password():
            return Response(
                {'error': 'Password is not set for this account. Login with OTP and set a password first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_active:
            return Response(
                {'error': 'Account is disabled'},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['post'], permission_classes=[AllowAny], url_path='password-reset/request')
    def password_reset_request(self, request):
        """Request OTP for password reset using email or SMS."""
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identifier = serializer.validated_data['identifier'].strip()
        delivery_method = serializer.validated_data['delivery_method']

        from django.db.models import Q

        user = User.objects.filter(
            Q(email__iexact=identifier) | Q(username=identifier) | Q(phone=identifier)
        ).first()

        if not user:
            return Response({'error': 'Account not found'}, status=status.HTTP_404_NOT_FOUND)

        if delivery_method == 'email':
            if not user.email:
                return Response({'error': 'No email is registered for this account'}, status=status.HTTP_400_BAD_REQUEST)
            contact = user.email
        else:
            if not user.phone:
                return Response({'error': 'No phone number is registered for this account'}, status=status.HTTP_400_BAD_REQUEST)
            contact = user.phone

        otp_code = str(random.randint(100000, 999999))
        OTP.objects.create(
            phone=user.phone if delivery_method == 'sms' else None,
            email=user.email if delivery_method == 'email' else None,
            purpose='password_reset',
            otp_code=otp_code,
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        if delivery_method == 'sms':
            sent = send_otp_sms(contact, otp_code)
        else:
            sent = send_otp_email(contact, otp_code)

        if not sent:
            logger.warning(f"Failed to send password reset {delivery_method} to {contact}, but OTP created in database")

        return Response({
            'message': f'Password reset OTP sent via {delivery_method}' if sent else f'OTP generated but {delivery_method} sending failed',
            'sent': sent,
            'method': delivery_method,
            'otp': otp_code if not sent else None,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny], url_path='password-reset/confirm')
    def password_reset_confirm(self, request):
        """Validate reset OTP and set a new password."""
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identifier = serializer.validated_data['identifier'].strip()
        otp_code = serializer.validated_data['otp_code']
        new_password = serializer.validated_data['new_password']

        from django.db.models import Q

        user = User.objects.filter(
            Q(email__iexact=identifier) | Q(username=identifier) | Q(phone=identifier)
        ).first()

        if not user:
            return Response({'error': 'Account not found'}, status=status.HTTP_404_NOT_FOUND)

        otp = OTP.objects.filter(
            Q(phone=user.phone) | Q(email=user.email),
            purpose='password_reset',
            otp_code=otp_code,
            is_verified=False,
        ).order_by('-created_at').first()

        if not otp:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

        if not otp.is_valid():
            return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=['password'])

        otp.is_verified = True
        otp.save(update_fields=['is_verified'])

        OTP.objects.filter(
            Q(phone=user.phone) | Q(email=user.email),
            purpose='password_reset',
            is_verified=False,
        ).update(is_verified=True)

        return Response({'message': 'Password reset successful'}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def verify_otp(self, request):
        """Verify OTP and return JWT tokens"""
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        identifier = serializer.validated_data['identifier']
        otp_code = serializer.validated_data['otp_code']
        
        # First, find the user by identifier (phone or username)
        from django.db.models import Q
        try:
            user = User.objects.get(
                Q(phone=identifier) | Q(username=identifier)
            )
        except User.DoesNotExist:
            return Response({
                'error': 'User not found with provided identifier'
            }, status=status.HTTP_404_NOT_FOUND)
        except User.MultipleObjectsReturned:
            user = User.objects.filter(phone=identifier).first() or \
                   User.objects.filter(username=identifier).first()
        
        # Find valid OTP using user's phone OR email
        try:
            otp = OTP.objects.filter(
                Q(phone=user.phone) | Q(email=user.email),
                purpose='login',
                otp_code=otp_code,
                is_verified=False
            ).latest('created_at')
        except OTP.DoesNotExist:
            return Response({
                'error': 'Invalid OTP'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not otp.is_valid():
            return Response({
                'error': 'OTP has expired'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark OTP as verified
        otp.is_verified = True
        otp.save()
        
        # Mark user as verified if not already
        if not user.is_verified:
            user.is_verified = True
            user.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], url_path='set-initial-password')
    def set_initial_password(self, request):
        """Set initial password for users who only used OTP login and do not have a usable password yet."""
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not new_password or len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters long'}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({'error': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        if user.has_usable_password():
            return Response({'error': 'Password is already set for this account'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=['password'])

        return Response({
            'message': 'Password set successfully',
            'user': UserSerializer(user).data,
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put'], permission_classes=[IsAuthenticated])
    def update_profile(self, request):
        """Update current user profile"""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Change user password"""
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({
                'error': 'Incorrect old password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)
