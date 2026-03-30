#!/usr/bin/env python
"""Test email configuration"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eoms_api.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

print("=" * 50)
print("Email Configuration Test")
print("=" * 50)
print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
print(f"EMAIL_HOST_PASSWORD: {'*' * len(settings.EMAIL_HOST_PASSWORD) if settings.EMAIL_HOST_PASSWORD else 'NOT SET'}")
print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
print("=" * 50)

# Test sending email
print("\nSending test email...")
try:
    result = send_mail(
        subject='EOMS Email Test',
        message='This is a test email from EOMS to verify SMTP configuration works correctly.',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=['onyangowangap@gmail.com'],
        fail_silently=False,
    )
    print(f"✓ SUCCESS! Email sent successfully. Result: {result}")
except Exception as e:
    print(f"✗ FAILED! Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
