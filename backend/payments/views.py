import uuid
from decimal import Decimal
import razorpay
from django.conf import settings
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from cart.models import Cart, CartItem
from orders.models import Order
from .models import Payment
from .serializers import PaymentSerializer

class CreatePaymentIntentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get("order_id")
        payment_method = request.data.get("payment_method", "Online")
        order = get_object_or_404(Order, id=order_id, user=request.user)

        payment, _ = Payment.objects.get_or_create(
            order=order,
            defaults={
                "payment_method": payment_method,
                "amount": order.total_amount,
                "transaction_id": f"TXN-{uuid.uuid4().hex[:12].upper()}",
                "status": "Pending",
            }
        )
        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)


class CreateRazorpayOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
            return Response(
                {"detail": "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        cart = Cart.objects.filter(user=request.user).first()
        cart_items = list(cart.items.all()) if cart else list(CartItem.objects.filter(cart__user=request.user))
        if not cart_items:
            return Response({"detail": "Your cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        subtotal = sum(
            (Decimal(str(item.product.discount_price or item.product.price or "0.00")) * int(item.quantity or 1)
             for item in cart_items),
            Decimal("0.00"),
        )
        shipping_charge = Decimal("100.00") if subtotal < Decimal("999.00") else Decimal("0.00")
        total = subtotal + shipping_charge

        try:
            gateway_order = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)).order.create({
                "amount": int(total * 100),
                "currency": "INR",
                "receipt": f"cart_{request.user.id}_{uuid.uuid4().hex[:10]}",
            })
        except Exception:
            return Response({"detail": "Unable to start payment. Please try again."}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({
            "key_id": settings.RAZORPAY_KEY_ID,
            "razorpay_order_id": gateway_order["id"],
            "amount": int(total * 100),
            "currency": "INR",
        }, status=status.HTTP_200_OK)

class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get("order_id")
        transaction_id = request.data.get("transaction_id")
        order = get_object_or_404(Order, id=order_id, user=request.user)
        payment = get_object_or_404(Payment, order=order)

        payment.status = "Success"
        payment.transaction_id = transaction_id or payment.transaction_id
        payment.save()

        order.payment_status = "Paid"
        order.order_status = "Confirmed"
        order.save()

        return Response({"status": "Payment successfully verified"}, status=status.HTTP_200_OK)