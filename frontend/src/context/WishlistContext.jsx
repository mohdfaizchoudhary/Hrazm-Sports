import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from './AuthContext';

export const WishlistContext = createContext();

const emptyWishlist = [];

export function WishlistProvider({ children }) {
  const { user } = useContext(AuthContext);
  const storageKey = user?.id ? `wishlist_${user.id}` : 'wishlist_guest';
  const skipPersist = useRef(false);
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || emptyWishlist;
    } catch {
      return emptyWishlist;
    }
  });

  useEffect(() => {
    skipPersist.current = true;
    try {
      setItems(JSON.parse(localStorage.getItem(storageKey)) || emptyWishlist);
    } catch {
      setItems(emptyWishlist);
    }
  }, [storageKey]);

  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const isWishlisted = (productId) => items.some((item) => String(item.id) === String(productId));

  const toggleWishlist = (product) => {
    setItems((currentItems) => {
      const nextItems = isWishlisted(product.id)
        ? currentItems.filter((item) => String(item.id) !== String(product.id))
        : [...currentItems, product];
      return nextItems;
    });
  };

  const removeFromWishlist = (productId) => {
    setItems((currentItems) => currentItems.filter((item) => String(item.id) !== String(productId)));
  };

  return (
    <WishlistContext.Provider value={{ items, count: items.length, isWishlisted, toggleWishlist, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}