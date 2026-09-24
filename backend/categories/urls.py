from django.urls import path
from .views import (
    CategoryListView, 
    CategoryDetailView, 
    SubCategoryListView, 
    SubCategoryDetailView
)

urlpatterns = [
    path('', CategoryListView.as_view(), name='category-list'),
    path('<int:pk>/', CategoryDetailView.as_view(), name='category-detail'),
    path('subcategories/', SubCategoryListView.as_view(), name='subcategory-list'),
    path('subcategories/<int:pk>/', SubCategoryDetailView.as_view(), name='subcategory-detail'),
]