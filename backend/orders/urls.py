from django.urls import path
from .views import (
    CreateOrderView,
    UserOrderListView,
    CancelOrderView,
    CustomerReturnRequestView,
    AdminOrderListView,
    AdminOrderStatusUpdateView,
    AdminCustomerListView,
    AdminReturnOrdersListView,
    AdminReturnActionView,
    AdminDeleteOrderView
)

urlpatterns = [
    # Customer routes
    path('', CreateOrderView.as_view(), name='create-order'),
    path('user/', UserOrderListView.as_view(), name='user-orders'),
    path('<int:order_id>/cancel/', CancelOrderView.as_view(), name='cancel-order'),
    path('<int:order_id>/return-request/', CustomerReturnRequestView.as_view(), name='return-request'),

    # Admin routes
    path('admin/all/', AdminOrderListView.as_view(), name='admin-orders-all'),
    path('admin/customers/', AdminCustomerListView.as_view(), name='admin-customers'),
    path('admin/returns/', AdminReturnOrdersListView.as_view(), name='admin-returns-list'),
    path('admin/<int:order_id>/update-status/', AdminOrderStatusUpdateView.as_view(), name='admin-order-status-update'),
    path('admin/<int:order_id>/return-action/', AdminReturnActionView.as_view(), name='admin-return-action'),
    path('admin/<int:order_id>/delete/', AdminDeleteOrderView.as_view(), name='admin-order-delete'),
]