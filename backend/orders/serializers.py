from rest_framework import serializers
from .models import Order, OrderItem
from products.serializers import ProductSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class OrderUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name']

    def get_full_name(self, obj):
        if not obj:
            return "Customer"
        if hasattr(obj, 'get_full_name') and obj.get_full_name():
            return obj.get_full_name()
        first = getattr(obj, 'first_name', '')
        last = getattr(obj, 'last_name', '')
        if first or last:
            return f"{first} {last}".strip()
        if getattr(obj, 'email', None):
            return obj.email.split('@')[0]
        return getattr(obj, 'username', 'Customer')


class OrderItemSerializer(serializers.ModelSerializer):
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'price', 'quantity', 'subtotal', 'product_image']

    def get_product_image(self, obj):
        if obj.product:
            if hasattr(obj.product, 'display_image') and obj.product.display_image:
                return obj.product.display_image
            if hasattr(obj.product, 'image_url') and obj.product.image_url:
                return obj.product.image_url
        return ''


class OrderSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    customer = OrderUserSerializer(source='user', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 
            'order_number', 
            'user', 
            'customer', 
            'total_amount', 
            'shipping_address', 
            'city', 
            'state', 
            'postal_code', 
            'payment_method', 
            'payment_status', 
            'order_status', 
            'status_reason', 
            'items', 
            'created_at', 
            'updated_at'
            , 'return_type', 'return_status', 'return_reason', 'return_requested_at',
            'replacement_product', 'original_product_name', 'replacement_product_name',
            'replacement_diff_amount', 'replacement_payment_status'
        ]
        read_only_fields = ['id', 'order_number', 'user', 'created_at', 'updated_at']

    def get_items(self, obj):
        order_items = getattr(obj, 'items', None)
        if order_items is not None and hasattr(order_items, 'all'):
            items_qs = order_items.all()
        else:
            items_qs = obj.orderitem_set.all()
        return OrderItemSerializer(items_qs, many=True).data

    def get_customer(self, obj):
        user = obj.user
        return {
            'id': user.id,
            'full_name': getattr(user, 'first_name', '') or getattr(user, 'name', '') or user.email.split('@')[0],
            'email': getattr(user, 'email', ''),
            'phone': getattr(user, 'phone', 'N/A')
        }