import json
from rest_framework import serializers
from categories.serializers import CategorySerializer, SubCategorySerializer
from .models import Product

class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True, default='')
    display_image = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category_name', 'subcategory_name',
            'product_type', 'gender', 'brand', 'price', 'discount_price',
            'discount_percentage', 'rating', 'rating_count', 'is_featured', 'display_image', 'available_sizes'
        ]

    def get_display_image(self, obj):
        if obj.image_url:
            return obj.image_url
        if obj.gallery_images:
            first = obj.gallery_images.split(',')[0].strip()
            if first:
                return first
        return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'

    def get_discount_percentage(self, obj):
        if obj.discount_price and obj.price > obj.discount_price:
            return int(((obj.price - obj.discount_price) / obj.price) * 100)
        return 0


class ProductDetailSerializer(serializers.ModelSerializer):
    category_details = CategorySerializer(source='category', read_only=True)
    subcategory_details = SubCategorySerializer(source='subcategory', read_only=True)
    display_image = serializers.SerializerMethodField()
    images_list = serializers.SerializerMethodField()
    sizes_list = serializers.SerializerMethodField()
    colors_list = serializers.SerializerMethodField()
    color_map = serializers.SerializerMethodField()
    about_points = serializers.SerializerMethodField()
    whats_in_box_list = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'category_details', 
            'subcategory', 'subcategory_details', 'product_type', 'gender',
            'brand', 'price', 'discount_price', 'discount_percentage',
            'stock', 'rating', 'rating_count', 'is_featured', 'available_sizes',
            'sizes_list', 'available_colors', 'colors_list', 'image_url', 
            'display_image', 'gallery_images', 'color_images', 'color_map',
            'images_list', 'about_item', 'about_points', 'description', 
            'material', 'age_range', 'item_weight', 'dimensions',
            'construction_type', 'stitching_type', 'whats_in_the_box', 
            'whats_in_box_list', 'created_at', 'updated_at'
        ]

    def get_display_image(self, obj):
        if obj.image_url:
            return obj.image_url
        if obj.gallery_images:
            first = obj.gallery_images.split(',')[0].strip()
            if first:
                return first
        return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'

    def get_color_map(self, obj):
        try:
            return json.loads(obj.color_images) if obj.color_images else []
        except Exception:
            return []

    def get_images_list(self, obj):
        imgs = []
        if obj.image_url:
            imgs.append(obj.image_url)
        if obj.gallery_images:
            extra = [img.strip() for img in obj.gallery_images.split(',') if img.strip()]
            for item in extra:
                if item not in imgs:
                    imgs.append(item)
        return imgs if imgs else ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600']

    def get_sizes_list(self, obj):
        if obj.available_sizes:
            return [s.strip() for s in obj.available_sizes.split(',') if s.strip()]
        return []

    def get_colors_list(self, obj):
        if obj.available_colors:
            return [c.strip() for c in obj.available_colors.split(',') if c.strip()]
        return ['White', 'Red']

    def get_about_points(self, obj):
        if obj.about_item:
            return [line.strip() for line in obj.about_item.split('\n') if line.strip()]
        return []

    def get_whats_in_box_list(self, obj):
        if obj.whats_in_the_box:
            return [line.strip() for line in obj.whats_in_the_box.split('\n') if line.strip()]
        return []

    def get_discount_percentage(self, obj):
        if obj.discount_price and obj.price > obj.discount_price:
            return int(((obj.price - obj.discount_price) / obj.price) * 100)
        return 0

ProductSerializer = ProductDetailSerializer