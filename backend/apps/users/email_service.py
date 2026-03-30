"""Email utility for sending OTP via Django email backend"""
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def send_otp_email(email, otp_code):
    """
    Send OTP via email
    
    Args:
        email (str): Recipient email address
        otp_code (str): 6-digit OTP code
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        subject = "Your EOMS Verification Code"
        message = f"""
Hello,

Your EOMS verification code is: {otp_code}

This code is valid for 10 minutes. Do not share this code with anyone.

If you didn't request this code, please ignore this email.

Best regards,
EOMS Team
"""
        
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [email]
        
        # Send email
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=recipient_list,
            fail_silently=False,
        )
        
        logger.info(f"OTP email sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email}: {str(e)}")
        return False
