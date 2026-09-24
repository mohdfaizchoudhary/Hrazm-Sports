import { useContext, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import Loading from '../components/Loading';
import { useFeedback } from '../components/FeedbackProvider';
import { 
  FaTrash, FaPlus, FaMinus, FaBoxOpen, FaTruck, FaLock, 
  FaChevronLeft, FaShieldAlt
} from 'react-icons/fa';

export default function Cart() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { cart, loading, adjustCartItem, removeCartItem } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { notify } = useFeedback();

  const replaceOrderId = searchParams.get('replace_order_id');
  const replaceOrderNum = searchParams.get('order_num');
  const oldItemPrice = Number(searchParams.get('old_price') || 0);
  const oldItemName = searchParams.get('old_item_name') || 'Delivered Item';
  const replaceReason = searchParams.get('replace_reason') || '';

  const [isProcessingReplace, setIsProcessingReplace] = useState(false);

  if (loading) return <Loading message="Loading athlete bag..." />;

  const hasCartItems = cart?.items && cart.items.length > 0;
  const selectedNewItem = hasCartItems ? cart.items[0] : null;
  const newItemPrice = selectedNewItem 
    ? Number(selectedNewItem.price || selectedNewItem.product?.discount_price || selectedNewItem.product?.price || 0) 
    : 0;

  const priceDiff = newItemPrice - oldItemPrice;
  const isCheaper = priceDiff < 0;
  const isExpensive = priceDiff > 0;

  const totalMRP = (cart?.items || []).reduce((sum, item) => {
    const orig = item.product?.price || item.price;
    return sum + Number(orig) * item.quantity;
  }, 0);

  const grandTotal = Number(cart?.total_amount || 0);
  const shippingCharge = Number(cart?.shipping_charge ?? (grandTotal > 999 ? 100 : 0));
  const payableTotal = Number(cart?.grand_total ?? grandTotal + shippingCharge);
  const discountAmount = Math.max(0, totalMRP - grandTotal);

  const handleExecuteReplacement = async () => {
    if (!selectedNewItem) {
      notify("Please keep your chosen replacement item in the cart.", { type: 'warning', title: 'Replacement item required' });
      return;
    }

    setIsProcessingReplace(true);
    try {
      await API.post(`/orders/${replaceOrderId}/return-request/`, {
        return_type: 'REPLACE',
        return_reason: replaceReason,
        replacement_product_id: selectedNewItem.product?.id,
        new_product_name: selectedNewItem.product?.name,
        diff_amount: priceDiff,
        payment_status: isExpensive ? 'PAID' : 'NONE'
      });

      notify("Replacement request submitted successfully! Redirecting to tracking status.", { type: 'success', title: 'Request submitted' });
      navigate('/orders');
    } catch (err) {
      notify(err.response?.data?.detail || "Failed to process replacement.", { type: 'error', title: 'Replacement failed' });
    } finally {
      setIsProcessingReplace(false);
    }
  };

  const handleCheckoutClick = () => {
    if (!user) navigate('/login?redirect=/checkout');
    else navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans pb-16">
      <div className="bg-white border-b border-gray-200 py-3.5 px-4 sm:px-6 mb-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            to="/products" 
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-700 hover:text-black transition-colors"
          >
            <FaChevronLeft size={10} className="text-volt-600" /> Back to Store
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-volt-500 animate-pulse"></span>
            <span className="text-xs font-black uppercase italic tracking-wider text-black">
              Athlete Bag ({cart?.total_items || cart?.items?.length || 0})
            </span>
          </div>
          <div className="w-20 hidden sm:block"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!hasCartItems ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm space-y-4 my-12">
            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto">
              <FaBoxOpen size={30} />
            </div>
            <h2 className="text-xl font-black uppercase text-black">Your Bag is Empty</h2>
            <p className="text-xs text-gray-500">Explore our catalog to add gear.</p>
            <Link
              to="/products"
              className="inline-block bg-volt-500 hover:bg-volt-400 text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md"
            >
              Browse Gear
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <h1 className="text-2xl font-black italic uppercase text-black flex items-center gap-2">
                <span className="text-volt-500">⚡</span> Cart Items ({cart.items.length})
              </h1>

              <div className="bg-black text-white rounded-2xl p-4 flex items-center justify-between text-xs shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-volt-500/20 text-volt-400 flex items-center justify-center shrink-0">
                    <FaTruck size={15} />
                  </div>
                  <div>
                    <span className="font-bold text-gray-400 uppercase text-[10px] tracking-wider block">Express Delivery</span>
                    <span className="font-bold text-white text-xs">Standard Shipping Available Across India</span>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-volt-400 bg-volt-500/10 px-2.5 py-1 rounded-lg border border-volt-500/30">
                  Free Over ₹999
                </span>
              </div>

              <div className="bg-white border border-gray-200 rounded-3xl divide-y divide-gray-100 shadow-sm overflow-hidden">
                {cart.items.map((item) => (
                  <div key={item.id} className="p-5 sm:p-6 flex flex-col sm:flex-row items-start justify-between gap-5 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start gap-4 flex-1">
                      <img
                        src={item.product?.display_image || item.product?.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120'}
                        alt={item.product?.name}
                        className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-2xl bg-gray-50 border border-gray-200 p-1 shrink-0"
                      />

                      <div className="space-y-1.5 flex-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-volt-700 bg-volt-50 border border-volt-200 px-2 py-0.5 rounded-md inline-block">
                          {item.product?.brand || 'HRAZM'}
                        </span>
                        
                        <h3 className="text-sm font-black text-black line-clamp-2">
                          {item.product?.name || item.product_name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-500 font-bold text-[11px] uppercase">Size:</span>
                            <span className="font-black bg-black text-white px-2 py-0.5 rounded-md text-[11px]">
                              {item.size || 'Standard'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 font-bold text-[11px] uppercase">Qty:</span>
                            <div className="flex items-center border border-gray-300 rounded-xl bg-gray-50 overflow-hidden">
                              <button
                                onClick={() => adjustCartItem(item.id, -1)}
                                className="w-7 h-7 flex items-center justify-center font-black text-gray-700 hover:bg-gray-200 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-black text-xs">{item.quantity}</span>
                              <button
                                onClick={() => adjustCartItem(item.id, 1)}
                                className="w-7 h-7 flex items-center justify-center font-black text-gray-700 hover:bg-gray-200 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-baseline gap-2.5 pt-2">
                          <span className="text-base font-black text-black">
                            ₹{(Number(item.price) * item.quantity).toLocaleString()}
                          </span>
                          {item.product?.price && Number(item.product.price) > Number(item.price) && (
                            <span className="text-xs text-gray-400 line-through font-bold">
                              MRP ₹{(Number(item.product.price) * item.quantity).toLocaleString()}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-gray-500 pt-1 flex items-center gap-1.5">
                          <FaTruck size={12} className="text-volt-600" />
                          <span>Standard Express Dispatch Within <strong className="text-black">24 Hours</strong></span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeCartItem(item.id)}
                      className="text-gray-400 hover:text-red-500 p-2.5 rounded-xl hover:bg-red-50 cursor-pointer"
                      title="Remove"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-5 shadow-sm">
                <h3 className="font-black italic uppercase text-base text-black border-b border-gray-100 pb-3 flex items-center gap-2">
                  <span className="text-volt-600">🏷️</span> Order Summary
                </h3>

                {replaceOrderId && selectedNewItem ? (
                  <div className="space-y-4 text-xs font-bold">
                    <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-2.5">
                      <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">
                        Exchange Breakdown
                      </span>

                      <div className="flex justify-between items-start text-gray-600">
                        <span className="truncate max-w-[140px] text-gray-500 font-medium">Original: {oldItemName}</span>
                        <span className="font-black text-black font-mono">₹{oldItemPrice.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-start text-gray-600">
                        <span className="truncate max-w-[140px] text-gray-500 font-medium">New: {selectedNewItem.product?.name}</span>
                        <span className="font-black text-black font-mono">₹{newItemPrice.toLocaleString()}</span>
                      </div>

                      <div className="border-t border-gray-200 pt-2 flex justify-between font-black text-black">
                        <span>Price Difference</span>
                        <span className={isCheaper ? 'text-emerald-600' : isExpensive ? 'text-amber-600' : 'text-blue-600'}>
                          {isCheaper ? `- ₹${Math.abs(priceDiff).toLocaleString()}` : isExpensive ? `+ ₹${priceDiff.toLocaleString()}` : '₹0 (Equal Value)'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Shipping Charges</span>
                      <span className="text-emerald-600 font-black uppercase text-[11px]">Free</span>
                    </div>

                    <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                      <span className="font-black text-xs uppercase text-black">Total Payable Now</span>
                      <span className="text-2xl font-black text-black font-mono">
                        ₹{isExpensive ? priceDiff.toLocaleString() : '0'}
                      </span>
                    </div>

                    {isCheaper && (
                      <div className="bg-volt-50 border border-volt-300 text-black text-xs font-bold p-3 rounded-2xl leading-relaxed shadow-xs">
                        💰 Remaining amount (₹{Math.abs(priceDiff).toLocaleString()}) will be refunded to your account within 7 days.
                      </div>
                    )}

                    <button
                      disabled={isProcessingReplace}
                      onClick={handleExecuteReplacement}
                      className="w-full bg-volt-500 hover:bg-volt-400 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(180,240,0,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessingReplace 
                        ? "Processing..." 
                        : isCheaper 
                        ? "Replace" 
                        : isExpensive 
                        ? `Pay ₹${priceDiff.toLocaleString()} & Replace` 
                        : "Confirm Replace"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs font-bold text-gray-600">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total MRP</span>
                        <span className="text-black font-black">₹{totalMRP.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount on MRP</span>
                        <span>-₹{discountAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Shipping Charges</span>
                        <span className={`font-black uppercase text-[11px] ${shippingCharge ? 'text-black' : 'text-emerald-600'}`}>
                          {shippingCharge ? `₹${shippingCharge.toLocaleString()}` : 'Free'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 flex justify-between items-baseline">
                      <span className="font-black text-sm uppercase text-black">Total Payable</span>
                      <span className="text-2xl font-black text-black">₹{payableTotal.toLocaleString()}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="bg-volt-50 border border-volt-200 text-volt-800 text-xs font-black text-center py-2.5 rounded-xl">
                        ⚡ You saved ₹{discountAmount.toLocaleString()} on this order!
                      </div>
                    )}

                    <button
                      onClick={handleCheckoutClick}
                      className="w-full bg-volt-500 hover:bg-volt-400 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(180,240,0,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {user ? "Proceed to Checkout" : "Login to Proceed"}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase text-gray-400 pt-1">
                  <FaShieldAlt className="text-volt-600" size={12} /> 100% Safe & Secure Checkout
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}