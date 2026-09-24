from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'name',
        'category',
        'product_type',
        'brand',
        'price',
        'discount_price',
        'stock',
        'is_featured',
        'created_at'
    )
    list_filter = ('category', 'product_type', 'is_featured', 'created_at')
    search_fields = ('name', 'description', 'brand')
    prepopulated_fields = {'slug': ('name',)}