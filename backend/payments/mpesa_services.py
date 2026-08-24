import base64
from datetime import datetime
import requests
from requests.auth import HTTPBasicAuth
from django.conf import settings

class MpesaGateway:
    def __init__(self):
        self.env = settings.MPESA['ENV']
        self.base_url = "https://sandbox.safaricom.co.ke" if self.env == "sandbox" else "https://api.safaricom.co.ke"
        self.consumer_key = settings.MPESA['CONSUMER_KEY']
        self.consumer_secret = settings.MPESA['CONSUMER_SECRET']
        self.shortcode = settings.MPESA['SHORTCODE']
        self.passkey = settings.MPESA['PASSKEY']
        self.callback_url = settings.MPESA['CALLBACK_URL']

    def get_access_token(self):
        """Generates the secure time-bound OAuth access token required for API calls."""
        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        response = requests.get(url, auth=HTTPBasicAuth(self.consumer_key, self.consumer_secret))
        response.raise_for_status()
        return response.json()['access_token']

    def initiate_stk_push(self, phone_number: str, amount: int, account_reference: str):
        """Triggers the STK push menu on the user's mobile device."""
        # Standardize Kenyan phone numbers to the 2547XXXXXXXX format
        if phone_number.startswith('0'):
            phone_number = '254' + phone_number[1:]
        elif phone_number.startswith('+254'):
            phone_number = phone_number.replace('+', '')

        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password_str = f"{self.shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(password_str.encode()).decode('utf-8')

        access_token = self.get_access_token()
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
        
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": phone_number,
            "PartyB": self.shortcode,
            "PhoneNumber": phone_number,
            "CallBackURL": self.callback_url,
            "AccountReference": account_reference,
            "TransactionDesc": f"Payment for Order {account_reference}"
        }

        url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        response = requests.post(url, json=payload, headers=headers)
        return response.json()