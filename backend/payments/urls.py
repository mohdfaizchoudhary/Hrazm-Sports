from django.urls import path
from .views import CreatePaymentIntentView, CreateRazorpayOrderView, VerifyPaymentView

urlpatterns = [
    path("create/", CreatePaymentIntentView.as_view(), name="payment-create"),
    path("razorpay/order/", CreateRazorpayOrderView.as_view(), name="razorpay-order-create"),
    path("verify/", VerifyPaymentView.as_view(), name="payment-verify"),
]