from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem
from .serializers import CartSerializer
from products.models import Product

class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.is_staff or request.user.is_superuser:
            return Response(
                {"detail": "Admins do not have an active customer cart."},
                status=status.HTTP_403_FORBIDDEN
            )
        cart, _ = Cart.objects.prefetch_related('items__product__category', 'items__product__subcategory').get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

class AddToCartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # 🚫 Block Admin/Staff from adding to cart
        if request.user.is_staff or request.user.is_superuser:
            return Response(
                {"detail": "Admins and Staff accounts cannot add products to cart."},
                status=status.HTTP_403_FORBIDDEN
            )

        user = request.user
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        product = get_object_or_404(Product, id=product_id)
        cart, _ = Cart.objects.get_or_create(user=user)

        price = product.discount_price if product.discount_price else product.price

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity, 'price': price}
        )

        if not created:
            cart_item.quantity += quantity
            cart_item.price = price
            cart_item.save()

        cart = Cart.objects.prefetch_related('items__product__category', 'items__product__subcategory').get(pk=cart.pk)
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

# backend/cart/views.py me UpdateCartItemView
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .models import Cart, CartItem
from .serializers import CartSerializer

class UpdateCartItemView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, item_id):
        return self.handle_update(request, item_id)

    def patch(self, request, item_id):
        return self.handle_update(request, item_id)

    def handle_update(self, request, item_id):
        item = get_object_or_404(CartItem.objects.select_related('cart', 'product'), id=item_id, cart__user=request.user)
        cart_id = item.cart_id
        qty = int(request.data.get('quantity', 1))
        if qty <= 0:
            item.delete()
        else:
            item.quantity = qty
            item.save()
        cart = Cart.objects.prefetch_related('items__product__category', 'items__product__subcategory').get(pk=cart_id)
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


# ⚡ Missing Remove View
class RemoveCartItemView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, item_id):
        item = get_object_or_404(CartItem.objects.select_related('cart', 'product'), id=item_id, cart__user=request.user)
        cart = item.cart
        item.delete()
        cart = Cart.objects.prefetch_related('items__product__category', 'items__product__subcategory').get(pk=cart.pk)
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

    # Fallback support for POST requests from frontend
    def post(self, request, item_id):
        return self.delete(request, item_id)

class ClearCartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.is_staff or request.user.is_superuser:
            return Response({"detail": "Forbidden for staff accounts."}, status=status.HTTP_403_FORBIDDEN)

        cart = Cart.objects.filter(user=request.user).first()
        if cart:
            cart.items.all().delete()
        return Response({"detail": "Cart cleared."})

CartDetailView = CartView