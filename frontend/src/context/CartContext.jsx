import { createContext, useState, useEffect, useContext, useRef } from 'react';
import API from '../services/api';
import { AuthContext } from './AuthContext';
import { FaCheckCircle, FaShoppingBag, FaTimes, FaShieldAlt, FaExclamationTriangle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useFeedback } from '../components/FeedbackProvider';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { notify } = useFeedback();
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('guest_cart');
    return saved ? JSON.parse(saved) : { items: [], total_items: 0, total_amount: '0.00' };
  });
  const [loading, setLoading] = useState(true);
  const [cartPopup, setCartPopup] = useState(null);
  const [adminWarningPopup, setAdminWarningPopup] = useState(false);
  const quantityRequests = useRef(new Map());
  const cartRef = useRef(cart);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const recalculateCart = (items) => {
    const total_items = items.reduce((sum, item) => sum + item.quantity, 0);
    const total_amount = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const shipping_charge = total_amount > 999 ? 100 : 0;
    return { items, total_items, total_amount: total_amount.toFixed(2), shipping_charge, grand_total: (total_amount + shipping_charge).toFixed(2) };
  };

  const fetchCart = async () => {
    const token = localStorage.getItem('access_token');
    
    if (!token || !user) {
      const saved = localStorage.getItem('guest_cart');
      setCart(saved ? JSON.parse(saved) : { items: [], total_items: 0, total_amount: '0.00' });
      setLoading(false);
      return;
    }

    if (user.is_staff || user.is_superuser) {
      setCart({ items: [], total_items: 0, total_amount: '0.00' });
      setLoading(false);
      return;
    }

    const cacheKey = `cart_cache_${user.id}`;
    const cachedCart = localStorage.getItem(cacheKey);
    if (cachedCart) {
      try {
        setCart(JSON.parse(cachedCart));
        setLoading(false);
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }

    try {
      const saved = localStorage.getItem('guest_cart');
      if (saved) {
        const guestCart = JSON.parse(saved);
        await Promise.all(guestCart.items.map((item) => API.post('/cart/add/', {
            product_id: item.product.id, 
            quantity: item.quantity,
            size: item.size 
          }).catch(() => {})));
        localStorage.removeItem('guest_cart');
      }

      const res = await API.get('/cart/');
      setCart(res.data);
      localStorage.setItem(cacheKey, JSON.stringify(res.data));
    } catch {
      setCart({ items: [], total_items: 0, total_amount: '0.00' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const triggerToast = (product, quantity = 1) => {
    setCartPopup({
      name: product.name,
      image: product.display_image || product.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200',
      price: product.discount_price || product.price,
      quantity,
    });

    setTimeout(() => {
      setCartPopup(null);
    }, 3500);
  };

  const addToCart = async (product, quantity = 1, size = null, color = null) => {
    if (user?.is_staff || user?.is_superuser) {
      setAdminWarningPopup(true);
      setTimeout(() => setAdminWarningPopup(false), 4000);
      return;
    }

    const token = localStorage.getItem('access_token');

    if (token && user) {
      const price = Number(product.discount_price || product.price);
      const optimisticItem = {
        id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        product,
        price,
        quantity,
        size: size || 'Standard',
        color: color || 'Default'
      };
      let previousCart;

      setCart((prev) => {
        previousCart = prev;
        const existingIndex = prev.items.findIndex(
          (item) => item.product?.id === product.id && (size ? item.size === size : true)
        );
        const items = [...prev.items];

        if (existingIndex >= 0) {
          items[existingIndex] = {
            ...items[existingIndex],
            quantity: items[existingIndex].quantity + quantity
          };
        } else {
          items.push(optimisticItem);
        }

        const updatedCart = recalculateCart(items);
        localStorage.setItem(`cart_cache_${user.id}`, JSON.stringify(updatedCart));
        return updatedCart;
      });
      triggerToast(product, quantity);

      try {
        const payload = { product_id: product.id, quantity };
        if (size) payload.size = size;
        const res = await API.post('/cart/add/', payload);
        setCart(res.data);
        localStorage.setItem(`cart_cache_${user.id}`, JSON.stringify(res.data));
      } catch (err) {
        if (previousCart) {
          setCart(previousCart);
          localStorage.setItem(`cart_cache_${user.id}`, JSON.stringify(previousCart));
        }
        notify(err.response?.data?.detail || "Failed to add to cart.", { type: 'error', title: 'Unable to add item' });
      }
      return;
    }

    // Guest Cart (localStorage)
    setCart((prev) => {
      const items = [...prev.items];
      const existingIdx = items.findIndex(
        (i) => i.product.id === product.id && (size ? i.size === size : true)
      );
      const price = Number(product.discount_price || product.price);

      if (existingIdx > -1) {
        items[existingIdx].quantity += quantity;
      } else {
        items.push({
          id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          product,
          price,
          quantity,
          size: size || 'Standard',
          color: color || 'Default'
        });
      }

      const updatedCart = recalculateCart(items);
      localStorage.setItem('guest_cart', JSON.stringify(updatedCart));
      triggerToast(product, quantity);
      return updatedCart;
    });
  };

  const updateCartItem = async (itemId, quantity) => {
    if (quantity <= 0) return removeCartItem(itemId);

    const token = localStorage.getItem('access_token');
    if (token && user && !String(itemId).startsWith('guest_')) {
      const pending = quantityRequests.current.get(itemId) || {
        requestedQuantity: quantity,
        running: false,
        previousCart: cart
      };
      pending.requestedQuantity = quantity;
      quantityRequests.current.set(itemId, pending);

      setCart((prev) => {
        const updatedCart = recalculateCart(prev.items.map((item) => (
          item.id === itemId ? { ...item, quantity } : item
        )));
        cartRef.current = updatedCart;
        localStorage.setItem(`cart_cache_${user.id}`, JSON.stringify(updatedCart));
        return updatedCart;
      });

      if (pending.running) return;

      pending.running = true;
      try {
        while (quantityRequests.current.get(itemId) === pending) {
          const requestedQuantity = pending.requestedQuantity;
          const res = await API.put(`/cart/update/${itemId}/`, { quantity: requestedQuantity });
          if (quantityRequests.current.get(itemId) !== pending) break;
          if (pending.requestedQuantity === requestedQuantity) {
            cartRef.current = res.data;
            setCart(res.data);
            localStorage.setItem(`cart_cache_${user.id}`, JSON.stringify(res.data));
            break;
          }
        }
      } catch (err) {
        if (quantityRequests.current.get(itemId) === pending) {
          setCart(pending.previousCart);
          localStorage.setItem(`cart_cache_${user.id}`, JSON.stringify(pending.previousCart));
        }
        console.error(err);
      } finally {
        if (quantityRequests.current.get(itemId) === pending) {
          quantityRequests.current.delete(itemId);
        }
      }
      return;
    }

    setCart((prev) => {
      const items = prev.items.map((i) => i.id === itemId ? { ...i, quantity } : i);
      const updated = recalculateCart(items);
      localStorage.setItem('guest_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const adjustCartItem = (itemId, delta) => {
    const pending = quantityRequests.current.get(itemId);
    const currentItem = cartRef.current.items.find((item) => item.id === itemId);
    const currentQuantity = pending?.requestedQuantity ?? currentItem?.quantity ?? 0;
    const nextQuantity = currentQuantity + delta;

    if (nextQuantity <= 0) {
      removeCartItem(itemId);
      return;
    }

    updateCartItem(itemId, nextQuantity);
  };

  const removeCartItem = async (itemId) => {
    const token = localStorage.getItem('access_token');
    const isAuthenticatedCart = token && user && !String(itemId).startsWith('guest_');
    const previousCart = cart;
    quantityRequests.current.delete(itemId);

    setCart((prev) => {
      const updated = recalculateCart(prev.items.filter((item) => item.id !== itemId));
      if (user?.id) localStorage.setItem(`cart_cache_${user.id}`, JSON.stringify(updated));
      else localStorage.setItem('guest_cart', JSON.stringify(updated));
      return updated;
    });

    if (isAuthenticatedCart) {
      try {
        await API.delete(`/cart/remove/${itemId}/`);
      } catch (err) {
        setCart(previousCart);
        localStorage.setItem(`cart_cache_${user.id}`, JSON.stringify(previousCart));
        notify(err.response?.data?.detail || "Failed to remove item.", { type: 'error', title: 'Unable to update cart' });
        console.error(err);
      }
      return;
    }
  };

  const clearCart = async () => {
    const token = localStorage.getItem('access_token');
    if (token && user) {
      await API.post('/cart/clear/').catch(() => {});
    }
    localStorage.removeItem('guest_cart');
    setCart({ items: [], total_items: 0, total_amount: '0.00' });
  };

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateCartItem, adjustCartItem, removeCartItem, clearCart, fetchCart }}>
      {children}

      {/* Customer Confirmation Toast */}
      {cartPopup && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-black text-white border-2 border-volt-500 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 animate-bounce-short">
          <div className="flex items-center gap-3">
            <img
              src={cartPopup.image}
              alt=""
              className="w-12 h-12 object-cover rounded-xl bg-dark-800 border border-gray-700"
            />
            <div>
              <div className="flex items-center gap-1 text-[11px] font-black uppercase text-volt-500">
                <FaCheckCircle size={12} /> Added To Bag!
              </div>
              <div className="text-xs font-bold text-white line-clamp-1">{cartPopup.name}</div>
              <div className="text-[10px] text-gray-400">
                Qty: {cartPopup.quantity} • Rs {Number(cartPopup.price).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/cart"
              onClick={() => setCartPopup(null)}
              className="bg-volt-500 hover:bg-volt-400 text-black px-3 py-1.5 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-md transition-all whitespace-nowrap"
            >
              <FaShoppingBag size={10} /> View Bag
            </Link>
            <button onClick={() => setCartPopup(null)} className="text-gray-400 hover:text-white p-1">
              <FaTimes size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Admin Warning Modal */}
      {adminWarningPopup && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-dark-900 text-white border-2 border-amber-400 rounded-2xl p-4 shadow-2xl flex items-start justify-between gap-3">
          <div className="w-10 h-10 bg-amber-400/20 text-amber-400 rounded-xl flex items-center justify-center flex-shrink-0 border border-amber-400/40">
            <FaShieldAlt size={18} />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-400">
              <FaExclamationTriangle size={11} />
              <span>Admin Action Restricted</span>
            </div>
            <p className="text-xs text-gray-300 font-medium">
              Staff accounts cannot add items to cart. Use the admin workspace to manage stock and inventory.
            </p>
          </div>
          <button onClick={() => setAdminWarningPopup(false)} className="text-gray-400 hover:text-white p-1">
            <FaTimes size={13} />
          </button>
        </div>
      )}
    </CartContext.Provider>
  );
};