from rest_framework import serializers
from .models import Cart, CartItem
from products.serializers import ProductListSerializer


class CartProductSerializer(ProductListSerializer):
    class Meta(ProductListSerializer.Meta):
        fields = ['id', 'name', 'brand', 'price', 'discount_price', 'display_image', 'available_sizes']

class CartItemSerializer(serializers.ModelSerializer):
    product = CartProductSerializer(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "product", "quantity", "price", "subtotal"]

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_amount = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()
    shipping_charge = serializers.SerializerMethodField()
    grand_total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["id", "items", "total_amount", "shipping_charge", "grand_total", "total_items", "updated_at"]

    def get_total_amount(self, obj):
        return sum(item.subtotal for item in obj.items.all())

    def get_total_items(self, obj):
        return sum(item.quantity for item in obj.items.all())

    def get_shipping_charge(self, obj):
        return 100 if self.get_total_amount(obj) > 999 else 0

    def get_grand_total(self, obj):
        return self.get_total_amount(obj) + self.get_shipping_charge(obj)