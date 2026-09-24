from rest_framework import generics, permissions
from django.db.models import F, Q
from decimal import Decimal
from .models import Product
from .serializers import ProductListSerializer, ProductDetailSerializer

class ProductListCreateView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductDetailSerializer
        if self.request.user.is_authenticated and (self.request.user.is_staff or self.request.user.is_superuser):
            return ProductDetailSerializer
        return ProductListSerializer  # ⚡ Fast loading ke liye sirf list serializer bhejega

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = Product.objects.select_related('category', 'subcategory').only(
            'id', 'name', 'slug', 'category_id', 'subcategory_id', 'product_type',
            'gender', 'brand', 'price', 'discount_price', 'rating', 'rating_count',
            'is_featured', 'image_url', 'gallery_images', 'available_sizes', 'available_colors',
            'description', 'stock', 'created_at', 'updated_at'
        ).order_by('-created_at')

        if self.request.method == 'GET' and self.request.user.is_authenticated and (self.request.user.is_staff or self.request.user.is_superuser):
            queryset = Product.objects.select_related('category', 'subcategory').all().order_by('-created_at')

        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(Q(category__slug__iexact=category) | Q(category__name__iexact=category))

        subcategory = self.request.query_params.get('subcategory')
        if subcategory:
            queryset = queryset.filter(Q(subcategory__slug__iexact=subcategory) | Q(subcategory__name__iexact=subcategory))

        brands = self.request.query_params.get('brand')
        if brands:
            brand_list = [b.strip() for b in brands.split(',') if b.strip()]
            queryset = queryset.filter(brand__in=brand_list)

        genders = self.request.query_params.get('gender')
        if genders:
            gender_list = [g.strip() for g in genders.split(',') if g.strip()]
            queryset = queryset.filter(gender__in=gender_list)

        color = self.request.query_params.get('color')
        if color:
            color_list = [c.strip() for c in color.split(',') if c.strip()]
            color_query = Q()
            for c in color_list:
                color_query |= Q(available_colors__icontains=c)
            queryset = queryset.filter(color_query)

        size = self.request.query_params.get('size')
        if size:
            size_list = [s.strip() for s in size.split(',') if s.strip()]
            size_query = Q()
            for s in size_list:
                size_query |= Q(available_sizes__icontains=s)
            queryset = queryset.filter(size_query)

        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price and min_price != 'Min':
            try:
                queryset = queryset.filter(
                    Q(discount_price__isnull=False, discount_price__gte=float(min_price)) |
                    Q(discount_price__isnull=True, price__gte=float(min_price))
                )
            except ValueError:
                pass

        if max_price and max_price != '3000+':
            try:
                queryset = queryset.filter(
                    Q(discount_price__isnull=False, discount_price__lte=float(max_price)) |
                    Q(discount_price__isnull=True, price__lte=float(max_price))
                )
            except ValueError:
                pass

        rating = self.request.query_params.get('rating')
        if rating:
            try:
                queryset = queryset.filter(rating__gte=float(rating))
            except ValueError:
                pass

        in_stock = self.request.query_params.get('in_stock')
        if in_stock == 'true':
            queryset = queryset.filter(stock__gt=0)

        if self.request.query_params.get('sale') == 'true':
            queryset = queryset.filter(
                discount_price__isnull=False,
                discount_price__lte=F('price') * Decimal('0.70')
            )

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search) | Q(brand__icontains=search)
            )

        return queryset

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.select_related('category', 'subcategory').all()
    serializer_class = ProductDetailSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

class FeaturedProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Product.objects.select_related('category', 'subcategory').filter(is_featured=True).order_by('-created_at')

ProductListView = ProductListCreateView