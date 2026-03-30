"""SMS utility for sending OTP via Africa's Talking"""
import os
import africastalking
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class SMSService:
    """Service for sending SMS via Africa's Talking"""
    
    def __init__(self):
        # Initialize Africa's Talking
        username = os.getenv('AFRICAS_TALKING_USERNAME', settings.AFRICAS_TALKING_USERNAME)
        api_key = os.getenv('AFRICAS_TALKING_API_KEY', settings.AFRICAS_TALKING_API_KEY)
        
        if not username or not api_key:
            logger.error("Africa's Talking credentials not configured")
            raise ValueError("Africa's Talking credentials missing in environment variables")
        
        africastalking.initialize(username, api_key)
        self.sms = africastalking.SMS
        self.sender_id = os.getenv('AFRICAS_TALKING_SENDER_ID', settings.AFRICAS_TALKING_SENDER_ID)
    
    def send_otp(self, phone_number, otp_code):
        """
        Send OTP via SMS
        
        Args:
            phone_number (str): Phone number in international format (e.g., +254712345678)
            otp_code (str): 6-digit OTP code
            
        Returns:
            dict: Response from Africa's Talking API
        """
        try:
            # Ensure phone number is in international format
            if not phone_number.startswith('+'):
                phone_number = f'+{phone_number}'
            
            message = f"Your EOMS verification code is: {otp_code}. Valid for 10 minutes. Do not share this code."
            
            # Send SMS
            response = self.sms.send(
                message=message,
                recipients=[phone_number],
                sender_id=self.sender_id
            )
            
            logger.info(f"SMS sent to {phone_number}: {response}")
            return {
                'success': True,
                'response': response
            }
            
        except Exception as e:
            logger.error(f"Failed to send SMS to {phone_number}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


# Singleton instance
sms_service = SMSService()


def send_otp_sms(phone_number, otp_code):
    """
    Convenience function to send OTP SMS
    
    Args:
        phone_number (str): Phone number
        otp_code (str): OTP code
        
    Returns:
        bool: True if SMS sent successfully, False otherwise
    """
    try:
        result = sms_service.send_otp(phone_number, otp_code)
        return result['success']
    except Exception as e:
        logger.error(f"Error in send_otp_sms: {str(e)}")
        return False
