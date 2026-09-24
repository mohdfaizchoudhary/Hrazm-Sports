from django.urls import path
from .views import (
    ProductListCreateView,
    ProductDetailView,
    FeaturedProductListView
)

urlpatterns = [
    path('', ProductListCreateView.as_view(), name='product-list-create'),
    path('featured/', FeaturedProductListView.as_view(), name='featured-products'),
    path('<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
]