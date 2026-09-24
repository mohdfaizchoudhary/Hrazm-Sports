import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import AdminLogin from '../pages/AdminLogin';
import Signup from '../pages/Signup';
import Products from '../pages/Products';
import ProductDetails from '../pages/ProductDetails';
import CategoryProducts from '../pages/CategoryProducts';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import Orders from '../pages/Orders';
import OrderSuccess from '../pages/OrderSuccess';
import Profile from '../pages/Profile';
import AdminProducts from '../pages/AdminProducts';
import Wishlist from '../pages/Wishlist';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/portal-admin-secure-auth" element={<AdminLogin />} />

      <Route path="/products" element={<Products />} />
      <Route path="/product/:id" element={<ProductDetails />} />
      <Route path="/category/:slug" element={<CategoryProducts />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/wishlist" element={<Wishlist />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin/products" element={<AdminProducts />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}