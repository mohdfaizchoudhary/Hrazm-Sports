from django.core.management.base import BaseCommand
from categories.models import Category
from products.models import Product

class Command(BaseCommand):
    help = "Populate default categories and product records"

    def handle(self, *args, **kwargs):
        categories_data = [
            {"name": "Electronics", "description": "Cutting-edge tech, audio, and personal devices."},
            {"name": "Fashion", "description": "Modern urban wear and high-street essentials."},
            {"name": "Shoes", "description": "Performance sneakers and everyday casual footwear."},
            {"name": "Beauty", "description": "Premium skincare, wellness, and self-care formulations."},
            {"name": "Home & Kitchen", "description": "Contemporary living essentials and modular setups."},
            {"name": "Accessories", "description": "Minimalist everyday carry, eyewear, and timepieces."},
        ]

        cats = {}
        for c in categories_data:
            cat_obj, _ = Category.objects.get_or_create(name=c["name"], defaults={"description": c["description"]})
            cats[c["name"]] = cat_obj

        products_data = [
            ("Wireless Noise Canceling Headphones", "Electronics", 12999.00, 9999.00, 30, 4.9, True, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"),
            ("Minimalist Smart Watch V2", "Electronics", 8999.00, 6499.00, 45, 4.7, True, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80"),
            ("Mechanical RGB Keyboard", "Electronics", 4999.00, 3999.00, 20, 4.8, False, "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80"),
            ("Ultra Slim 4K Display Monitor", "Electronics", 24999.00, 21999.00, 15, 4.9, True, "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80"),
            ("Oversized Organic Cotton Tee", "Fashion", 1499.00, 999.00, 100, 4.5, False, "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80"),
            ("Tailored Linen Shirt", "Fashion", 2499.00, 1999.00, 60, 4.6, True, "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=80"),
            ("Minimal Utility Bomber Jacket", "Fashion", 4999.00, 3799.00, 25, 4.8, True, "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80"),
            ("Ultra-Cushion Running Sneakers", "Shoes", 5999.00, 4499.00, 40, 4.7, True, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80"),
            ("Classic Leather Low-Top Trainers", "Shoes", 4499.00, 3499.00, 35, 4.6, False, "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&q=80"),
            ("Daily Hydration Facial Cleanser", "Beauty", 899.00, 699.00, 150, 4.8, False, "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80"),
            ("Botanical Restorative Face Serum", "Beauty", 1499.00, 1199.00, 80, 4.9, True, "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80"),
            ("Ceramic Pour-Over Coffee Maker", "Home & Kitchen", 2199.00, 1699.00, 50, 4.7, False, "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&q=80"),
            ("Ergonomic Lumbar Cushion", "Home & Kitchen", 1899.00, 1399.00, 65, 4.5, False, "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500&q=80"),
            ("Matte Polarized Sunglasses", "Accessories", 1999.00, 1499.00, 90, 4.6, True, "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&q=80"),
            ("Top-Grain Leather Cardholder", "Accessories", 1299.00, 899.00, 110, 4.8, False, "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&q=80"),
        ]

        for name, cat_name, price, disc_price, stock, rating, is_featured, img_url in products_data:
            Product.objects.get_or_create(
                name=name,
                defaults={
                    "category": cats[cat_name],
                    "description": f"Engineered for durability and form. The {name} integrates into daily commerce.",
                    "price": price,
                    "discount_price": disc_price,
                    "stock": stock,
                    "rating": rating,
                    "is_featured": is_featured,
                    "image_url": img_url,
                    "is_active": True,
                }
            )

        self.stdout.write(self.style.SUCCESS("Database seeding completed."))
