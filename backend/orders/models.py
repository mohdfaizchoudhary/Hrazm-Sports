from django.db import models
from django.conf import settings
from products.models import Product

class Order(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Confirmed', 'Confirmed'),
        ('Shipped', 'Shipped'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
    )
    
    RETURN_TYPE_CHOICES = (
        ('NONE', 'None'),
        ('REFUND', 'Get Return Money'),
        ('REPLACE', 'Replace Product'),
    )
    
    RETURN_STATUS_CHOICES = (
        ('NONE', 'None'),
        ('REQUESTED', 'Requested'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('COMPLETED', 'Completed'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=50, unique=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    payment_method = models.CharField(max_length=50, default='COD')
    payment_status = models.CharField(max_length=50, default='Pending')
    order_status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    status_reason = models.TextField(blank=True, null=True)
    
    # ⚡ New Return / Replace Fields
    return_type = models.CharField(max_length=20, choices=RETURN_TYPE_CHOICES, default='NONE')
    return_status = models.CharField(max_length=20, choices=RETURN_STATUS_CHOICES, default='NONE')
    return_reason = models.TextField(blank=True, null=True)
    return_requested_at = models.DateTimeField(blank=True, null=True)
    replacement_product = models.ForeignKey(Product, on_delete=models.SET_NULL, blank=True, null=True, related_name='replacement_orders')
    original_product_name = models.CharField(max_length=255, blank=True, null=True)
    replacement_product_name = models.CharField(max_length=255, blank=True, null=True)
    replacement_diff_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    replacement_payment_status = models.CharField(max_length=20, default='NONE')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.order_number    
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"