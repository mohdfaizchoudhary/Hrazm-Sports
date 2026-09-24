from django.db import models
from categories.models import Category, SubCategory

class Product(models.Model):
    GENDER_CHOICES = (
        ('Men', 'Men'),
        ('Women', 'Women'),
        ('Unisex', 'Unisex'),
        ('Kids', 'Kids'),
    )

    PRODUCT_TYPE_CHOICES = (
        ('clothing', 'Clothing'),
        ('shoes', 'Shoes'),
        ('equipment', 'Equipment'),
        ('accessories', 'Accessories'),
    )

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    subcategory = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    
    product_type = models.CharField(max_length=50, choices=PRODUCT_TYPE_CHOICES, default='clothing')
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, default='Unisex')
    brand = models.CharField(max_length=100, default='Generic')

    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.PositiveIntegerField(default=10)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=4.5)
    rating_count = models.PositiveIntegerField(default=25)
    is_featured = models.BooleanField(default=False)

    image_url = models.TextField(blank=True, default='')
    gallery_images = models.TextField(blank=True, default='')
    color_images = models.TextField(blank=True, default='')

    available_sizes = models.CharField(max_length=255, blank=True, default='')
    available_colors = models.CharField(max_length=255, blank=True, default='White,Red')

    # Amazon-style specifications & details
    about_item = models.TextField(blank=True, default='', help_text="Enter bullet points separated by newlines")
    description = models.TextField(blank=True, default='')
    material = models.CharField(max_length=100, blank=True, default='Leather')
    age_range = models.CharField(max_length=100, blank=True, default='Adult')
    item_weight = models.CharField(max_length=100, blank=True, default='399 Grams')
    dimensions = models.CharField(max_length=100, blank=True, default='7.2 cm')
    construction_type = models.CharField(max_length=100, blank=True, default='Hand-stitched')
    stitching_type = models.CharField(max_length=100, blank=True, default='Hand-stitched')
    whats_in_the_box = models.TextField(blank=True, default='1 x Sports Gear')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            import uuid
            self.slug = f"{slugify(self.name)}-{uuid.uuid4().hex[:6]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name