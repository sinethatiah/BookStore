from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from .mpesa_services import MpesaGateway
from .models import MpesaTransaction
from BookStoreApp.models import Order

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


class MpesaCallbackView(APIView):
    permission_classes = [AllowAny]# Safaricom servers require unauthenticated public access

    @transaction.atomic
    def post(self, request):
        stk_callback = request.data.get('Body', {}).get('stkCallback', {})
        checkout_request_id = stk_callback.get('CheckoutRequestID')
        result_code = stk_callback.get('ResultCode')
        result_desc = stk_callback.get('ResultDesc')

        try:
            tx = MpesaTransaction.objects.select_for_update().get(checkout_request_id=checkout_request_id)
            tx.result_desc = result_desc

            if result_code == 0:
                tx.status = MpesaTransaction.StatusChoices.SUCCESS
                callback_meta = stk_callback.get('CallbackMetadata', {}).get('Item', [])
                for item in callback_meta:
                    if item.get('Name') == 'MpesaReceiptNumber':
                        tx.mpesa_receipt_number = item.get('Value')
                        break

                
                Order.objects.filter(id=tx.order_id).update(payment_status='paid')
            else:
                tx.status = MpesaTransaction.StatusChoices.FAILED
                
                Order.objects.filter(id=tx.order_id).update(payment_status='failed')

            tx.save()
            return Response({"ResultCode": 0, "ResultDesc": "Success"}, status=status.HTTP_200_OK)

        except MpesaTransaction.DoesNotExist:
            return Response({"ResultCode": 1, "ResultDesc": "Transaction record not found"}, status=status.HTTP_404_NOT_FOUND)