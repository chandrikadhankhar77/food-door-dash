import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { cartService } from '../services/cartService';
import { getErrorMessage } from '../utils/formatPrice';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const emptyCart = { items: [], restaurant: null, subtotal: 0 };

export function CartProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const normalize = (data) => {
    if (!data) return emptyCart;
    const cartData = data.cart || data;
    const items = cartData.items || [];
    const subtotal =
      data.totals?.subtotal ??
      cartData.subtotal ??
      items.reduce((sum, item) => {
        const addOns = (item.addOns || []).reduce((a, x) => a + Number(x.price || 0), 0);
        return sum + (Number(item.price) + addOns) * Number(item.quantity || 1);
      }, 0);
    return {
      ...cartData,
      items,
      restaurant: cartData.restaurant || null,
      subtotal,
      totals: data.totals || cartData.totals,
    };
  };

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(emptyCart);
      return;
    }
    setLoading(true);
    try {
      const data = await cartService.get();
      setCart(normalize(data));
    } catch {
      setCart(emptyCart);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading) fetchCart();
  }, [authLoading, fetchCart]);

  const requireAuth = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to add items to your cart');
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return false;
    }
    return true;
  };

  const addItem = async ({
    foodItem,
    restaurant,
    quantity = 1,
    addOns = [],
    specialInstructions = '',
  }) => {
    if (!requireAuth()) return null;

    const restaurantId = restaurant?._id || restaurant || foodItem.restaurant;
    const currentRestaurantId =
      cart.restaurant?._id || cart.restaurant || null;

    if (
      currentRestaurantId &&
      restaurantId &&
      String(currentRestaurantId) !== String(restaurantId) &&
      cart.items.length > 0
    ) {
      const confirmed = window.confirm(
        'Your cart has items from another restaurant. Clear the cart and add this item?'
      );
      if (!confirmed) return null;
      try {
        const data = await cartService.addItem({
          foodItemId: foodItem._id || foodItem,
          quantity,
          addOns,
          specialInstructions,
          clearExisting: true,
        });
        setCart(normalize(data));
        toast.success('Cart updated with new restaurant');
        setDrawerOpen(true);
        return data;
      } catch (error) {
        toast.error(getErrorMessage(error, 'Could not update cart'));
        return null;
      }
    }

    try {
      const data = await cartService.addItem({
        foodItemId: foodItem._id || foodItem,
        quantity,
        addOns,
        specialInstructions,
      });
      setCart(normalize(data));
      toast.success('Added to cart');
      setDrawerOpen(true);
      return data;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not add to cart'));
      return null;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (!requireAuth()) return;
    try {
      if (quantity < 1) {
        await removeItem(itemId);
        return;
      }
      const data = await cartService.updateItem(itemId, { quantity });
      setCart(normalize(data));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update quantity'));
    }
  };

  const removeItem = async (itemId) => {
    if (!requireAuth()) return;
    try {
      const data = await cartService.removeItem(itemId);
      setCart(normalize(data));
      toast.success('Item removed');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not remove item'));
    }
  };

  const clearCart = async () => {
    if (!requireAuth()) return;
    try {
      const data = await cartService.clear();
      setCart(normalize(data) || emptyCart);
      toast.success('Cart cleared');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not clear cart'));
    }
  };

  const itemCount = useMemo(
    () => (cart.items || []).reduce((sum, i) => sum + Number(i.quantity || 0), 0),
    [cart.items]
  );

  const value = useMemo(
    () => ({
      cart,
      loading,
      itemCount,
      drawerOpen,
      setDrawerOpen,
      fetchCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [cart, loading, itemCount, drawerOpen, fetchCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
