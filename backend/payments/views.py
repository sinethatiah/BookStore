from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from .mpesa_services import MpesaGateway
from .models import MpesaTransaction

class InitiatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        phone_number = request.data.get('phone_number')
        amount = request.data.get('amount')
        order_id = request.data.get('order_id')

        if not all([phone_number, amount, order_id]):
            return Response({"error": "Missing parameters"}, status=status.HTTP_400_BAD_REQUEST)

        gateway = MpesaGateway()
        try:
            mpesa_response = gateway.initiate_stk_push(phone_number, amount, order_id)
            
            # If request is accepted by Safaricom API gateway
            if mpesa_response.get('ResponseCode') == '0':
                MpesaTransaction.objects.create(
                    order_id=order_id,
                    merchant_request_id=mpesa_response['MerchantRequestID'],
                    checkout_request_id=mpesa_response['CheckoutRequestID'],
                    phone_number=phone_number,
                    amount=amount,
                    status=MpesaTransaction.StatusChoices.PENDING
                )
                return Response(mpesa_response, status=status.HTTP_200_OK)
            
            return Response(mpesa_response, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)