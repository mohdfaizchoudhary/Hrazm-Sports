import uuid
from decimal import Decimal
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db import transaction
from django.conf import settings
import razorpay
from rest_framework import permissions, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Order, OrderItem
from products.models import Product
from .serializers import OrderSerializer
from cart.models import Cart, CartItem

User = get_user_model()

try:
    from payments.models import Payment
except ImportError:
    Payment = None


# 1. Place Order
class CreateOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        user = request.user
        if user.is_staff or user.is_superuser:
            return Response({"detail": "Staff accounts are not permitted to place orders."}, status=status.HTTP_403_FORBIDDEN)

        cart = Cart.objects.filter(user=user).first()
        cart_items = list(cart.items.all()) if (cart and hasattr(cart, 'items')) else []
        if not cart_items:
            cart_items = list(CartItem.objects.filter(cart__user=user))

        if not cart_items:
            return Response({"detail": "Your cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        shipping_address = request.data.get("shipping_address", "").strip()
        city = request.data.get("city", "").strip()
        state = request.data.get("state", "").strip()
        postal_code = request.data.get("postal_code", "").strip()
        payment_method = request.data.get("payment_method", "COD")

        if payment_method != "COD":
            required_payment_fields = [
                request.data.get("razorpay_order_id"),
                request.data.get("razorpay_payment_id"),
                request.data.get("razorpay_signature"),
            ]
            if not all(required_payment_fields) or not settings.RAZORPAY_KEY_SECRET:
                return Response({"detail": "A successful Razorpay payment is required before placing this order."}, status=status.HTTP_400_BAD_REQUEST)
            try:
                razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)).utility.verify_payment_signature({
                    "razorpay_order_id": request.data["razorpay_order_id"],
                    "razorpay_payment_id": request.data["razorpay_payment_id"],
                    "razorpay_signature": request.data["razorpay_signature"],
                })
            except Exception:
                return Response({"detail": "Payment verification failed. The order was not placed."}, status=status.HTTP_400_BAD_REQUEST)

        if not all([shipping_address, city, state, postal_code]):
            return Response({"detail": "Please fill out all address fields."}, status=status.HTTP_400_BAD_REQUEST)

        subtotal_amount = Decimal("0.00")
        items_to_create = []

        for item in cart_items:
            product = item.product
            price = Decimal(str(product.discount_price or product.price or "0.00"))
            qty = int(item.quantity or 1)
            subtotal = price * qty
            subtotal_amount += subtotal

            items_to_create.append({
                "product": product,
                "product_name": getattr(product, 'name', 'Sports Gear'),
                "price": price,
                "quantity": qty,
                "subtotal": subtotal
            })

        shipping_charge = Decimal("100.00") if subtotal_amount < Decimal("999.00") else Decimal("0.00")
        total_amount = subtotal_amount + shipping_charge

        order = Order.objects.create(
            user=user,
            order_number=f"ORD-{uuid.uuid4().hex[:8].upper()}",
            total_amount=total_amount,
            shipping_address=shipping_address,
            city=city,
            state=state,
            postal_code=postal_code,
            payment_method=payment_method,
            payment_status="Pending" if payment_method == "COD" else "Paid",
            order_status="Pending" if payment_method == "COD" else "Confirmed",
            status_reason=f"Order placed successfully. Store team is preparing dispatch. Shipping charge: ₹{shipping_charge}."
        )

        for item_data in items_to_create:
            OrderItem.objects.create(order=order, **item_data)

        if Payment:
            Payment.objects.create(
                order=order,
                payment_method=payment_method,
                amount=total_amount,
                transaction_id=request.data.get("razorpay_payment_id") if payment_method != "COD" else None,
                status="Success" if payment_method != "COD" else "Pending",
            )

        try:
            if cart: cart.items.all().delete()
            CartItem.objects.filter(cart__user=user).delete()
        except Exception:
            pass

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


# 2. Customer Order List
class UserOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).select_related('user').prefetch_related('items').order_by('-created_at')
    

class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'order_number'

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).select_related('user').prefetch_related('items')


class CancelOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        order = get_object_or_404(Order, id=order_id, user=request.user)
        reason = request.data.get("reason", "").strip()

        if order.order_status in ['Shipped', 'Delivered']:
            return Response({"detail": f"Order cannot be cancelled as it is already {order.order_status}."}, status=status.HTTP_400_BAD_REQUEST)

        order.order_status = 'Cancelled'
        order.status_reason = f"Cancelled by customer: {reason}"
        order.save()
        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)
        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)


class AdminOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not (user.is_staff or user.is_superuser):
            return Order.objects.none()
        return Order.objects.select_related('user').prefetch_related('items').all().order_by('-created_at')


class AdminOrderStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, order_id):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Staff only."}, status=status.HTTP_403_FORBIDDEN)

        order = get_object_or_404(Order, id=order_id)
        order_status = request.data.get('order_status')
        if order_status:
            order.order_status = order_status
            order.status_reason = request.data.get('status_reason', f"Order marked as {order_status} by staff.")
            order.save()

        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)


# 7. Admin Customer Registry List
class AdminCustomerListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Staff only."}, status=status.HTTP_403_FORBIDDEN)

        customers = User.objects.filter(is_staff=False, is_superuser=False).order_by('-id')
        data = []
        for c in customers:
            first = getattr(c, 'first_name', '') or ''
            last = getattr(c, 'last_name', '') or ''
            full_name = f"{first} {last}".strip() or getattr(c, 'name', '') or getattr(c, 'username', 'Customer')
            created_dt = getattr(c, 'created_at', None) or getattr(c, 'date_joined', None)

            data.append({
                "id": c.id,
                "full_name": full_name,
                "email": getattr(c, 'email', ''),
                "phone": getattr(c, 'phone', 'Not Provided'),
                "total_orders": Order.objects.filter(user=c).count(),
                "date_joined": created_dt.strftime("%d %b %Y, %I:%M %p") if created_dt else "N/A"
            })
        return Response(data, status=status.HTTP_200_OK)


class AdminReturnOrdersListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Staff only."}, status=status.HTTP_403_FORBIDDEN)

        returns = Order.objects.exclude(return_status='NONE').select_related('user').prefetch_related('items').order_by('-return_requested_at')
        return Response(OrderSerializer(returns, many=True).data, status=status.HTTP_200_OK)
    

class AdminOrderDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, order_id):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Permission denied. Staff only."}, status=status.HTTP_403_FORBIDDEN)

        order = get_object_or_404(Order, id=order_id)
        if order.order_status != 'Cancelled':
            return Response(
                {"detail": "Only cancelled orders can be deleted by admin."},
                status=status.HTTP_400_BAD_REQUEST
            )
        order.delete()
        return Response({"detail": "Cancelled order deleted successfully."}, status=status.HTTP_200_OK)


from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .models import Order

User = get_user_model()

class AdminCustomerListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not (getattr(request.user, 'is_staff', False) or getattr(request.user, 'is_superuser', False)):
            return Response({"detail": "Permission denied. Staff only."}, status=status.HTTP_403_FORBIDDEN)

        try:
            user_fields = [f.name for f in User._meta.get_fields()]

            filter_kwargs = {}
            if 'is_staff' in user_fields:
                filter_kwargs['is_staff'] = False
            if 'is_superuser' in user_fields:
                filter_kwargs['is_superuser'] = False

            customers = User.objects.filter(**filter_kwargs)

            if 'created_at' in user_fields:
                customers = customers.order_by('-created_at')
            elif 'date_joined' in user_fields:
                customers = customers.order_by('-date_joined')
            else:
                customers = customers.order_by('-id')

            data = []
            for c in customers:
                first = getattr(c, 'first_name', '') or ''
                last = getattr(c, 'last_name', '') or ''
                full_name = f"{first} {last}".strip()

                if not full_name and hasattr(c, 'name'):
                    full_name = getattr(c, 'name', '') or ''

                if not full_name:
                    email_val = getattr(c, 'email', '')
                    username_val = getattr(c, 'username', '')
                    full_name = email_val.split('@')[0] if email_val else (username_val or 'Customer')

                try:
                    order_count = Order.objects.filter(user=c).count()
                except Exception:
                    order_count = 0

                joined_dt = getattr(c, 'created_at', None) or getattr(c, 'date_joined', None)
                formatted_date = joined_dt.strftime("%d %b %Y, %I:%M %p") if joined_dt else "N/A"

                data.append({
                    "id": c.id,
                    "full_name": full_name,
                    "email": getattr(c, 'email', '') or getattr(c, 'username', ''),
                    "phone": getattr(c, 'phone', '') or 'Not Provided',
                    "username": getattr(c, 'username', ''),
                    "is_active": getattr(c, 'is_active', True),
                    "total_orders": order_count,
                    "date_joined": formatted_date
                })

            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"detail": f"Database error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



from decimal import Decimal
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.shortcuts import get_object_or_404
from .models import Order
from .serializers import OrderSerializer

# 1. Customer Return/Replace Request View
import uuid
from decimal import Decimal
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework import permissions, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Order, OrderItem
from .serializers import OrderSerializer

User = get_user_model()

# ⚡ Return/Replace Handler (Order table me direct new status set karega)
import uuid
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import permissions, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Order, OrderItem
from .serializers import OrderSerializer

User = get_user_model()

# 1. Customer Return / Replacement Request View
class CustomerReturnRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        order = get_object_or_404(Order, id=order_id, user=request.user)

        # 7-Day Delivered Check
        if (order.order_status or '').lower() != 'delivered':
            return Response({"detail": "Return/Replacement can only be requested after order is Delivered."}, status=status.HTTP_400_BAD_REQUEST)

        delivered_time = order.updated_at or order.created_at
        if timezone.now() - delivered_time > timedelta(days=7):
            return Response({"detail": "The 7-day return/replacement window for this order has expired."}, status=status.HTTP_400_BAD_REQUEST)

        return_type = request.data.get('return_type', 'REFUND') # 'REFUND' | 'REPLACE'
        return_reason = request.data.get('return_reason', '').strip()
        diff_amount = Decimal(str(request.data.get('diff_amount', '0.00')))
        new_product_name = request.data.get('new_product_name', '').strip()

        if return_type not in ('REFUND', 'REPLACE') or not return_reason:
            return Response({'detail': 'A valid request type and reason are required.'}, status=status.HTTP_400_BAD_REQUEST)

        replacement_product = None
        if return_type == 'REPLACE':
            replacement_product_id = request.data.get('replacement_product_id')
            replacement_product = get_object_or_404(Product, id=replacement_product_id)
            new_product_name = replacement_product.name
            if not order.items.exists():
                return Response({'detail': 'The original order has no replaceable item.'}, status=status.HTTP_400_BAD_REQUEST)
            order.replacement_product = replacement_product
            order.original_product_name = order.items.first().product_name
            order.replacement_product_name = replacement_product.name
            order.replacement_diff_amount = diff_amount
            order.replacement_payment_status = request.data.get('payment_status', 'NONE')

        order.return_type = return_type
        order.return_status = 'REQUESTED'
        order.return_requested_at = timezone.now()

        if return_type == 'REPLACE':
            order.return_reason = f"Exchange for: {new_product_name} | Reason: {return_reason}"
            if diff_amount < Decimal('0.00'):
                order.status_reason = f"Replace in process: Exchanging with {new_product_name}. Refund of excess ₹{abs(diff_amount)} will be credited to your bank account within 7 working days."
            elif diff_amount > Decimal('0.00'):
                order.status_reason = f"Replace in process: Exchanging with {new_product_name}. Additional ₹{diff_amount} received."
            else:
                order.status_reason = f"Replace in process: Equal value exchange with {new_product_name}."
        else:
            order.return_reason = return_reason
            order.status_reason = f"Return Requested: {return_reason}. Full refund of ₹{order.total_amount} will be credited to bank account within 7 working days after pickup inspection."

        order.save()
        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)


# 2. Admin Return / Replace Action View
class AdminReturnActionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, order_id):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Staff access required."}, status=status.HTTP_403_FORBIDDEN)

        order = get_object_or_404(Order, id=order_id)
        action = request.data.get('action') # 'APPROVE' | 'REJECT'

        if action == 'APPROVE':
            order.return_status = 'APPROVED'
            order.order_status = 'Confirmed'
            if order.return_type == 'REPLACE':
                original_item = order.items.first()
                if order.replacement_product and original_item:
                    original_item.product = order.replacement_product
                    original_item.product_name = order.replacement_product.name
                    original_item.price = order.replacement_product.discount_price or order.replacement_product.price
                    original_item.subtotal = original_item.price * original_item.quantity
                    original_item.save()
                    order.total_amount = original_item.subtotal
                order.status_reason = "Replacement approved by admin. New item dispatch pipeline initiated."
            else:
                order.status_reason = f"Return approved by admin. Courier assigned for pickup. Refund of ₹{order.total_amount} initiated."
            order.save()
            return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)

        elif action == 'REJECT':
            order.return_status = 'REJECTED'
            order.status_reason = "Request rejected during warehouse inspection verification."
            order.save()
            return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)

        elif action == 'COMPLETE':
            order.return_status = 'COMPLETED'
            order.status_reason = "Return/replacement completed by admin."
            order.save()
            return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)

        return Response({"detail": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)
    

class AdminDeleteOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, order_id):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Staff only."}, status=status.HTTP_403_FORBIDDEN)

        order = get_object_or_404(Order, id=order_id)
        order.delete()
        return Response({"detail": "Order deleted successfully."}, status=status.HTTP_200_OK)