import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import Loading from '../components/Loading';
import { useFeedback } from '../components/FeedbackProvider';
import { AuthContext } from '../context/AuthContext';
import { 
  FaUser, FaEnvelope, FaPhone, FaBoxOpen, FaTruck, FaCheckCircle, 
  FaClock, FaTimesCircle, FaShoppingBag, FaArrowRight, FaMapMarkerAlt,
  FaUndoAlt, FaExchangeAlt, FaShieldAlt
} from 'react-icons/fa';

export default function Orders() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { notify } = useFeedback();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Return/Replace Modal state
  const [returnModalOrder, setReturnModalOrder] = useState(null);
  const [returnType, setReturnType] = useState('REFUND'); // 'REFUND' | 'REPLACE'
  const [returnReason, setReturnReason] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Cancel Modal state
  const [showCancelModal, setShowCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    API.get('/orders/user/')
      .then((res) => {
        const orderList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        setOrders(orderList);
      })
      .catch((err) => console.error('Error loading orders:', err))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnReason.trim()) {
      notify('Please mention reason for return / replacement.', { type: 'warning', title: 'Reason required' });
      return;
    }

    setSubmittingReturn(true);
    try {
      const res = await API.post(`/orders/${returnModalOrder.id}/return-request/`, {
        return_type: returnType,
        return_reason: returnReason.trim(),
      });

      setOrders((prev) => prev.map((o) => (o.id === returnModalOrder.id ? res.data : o)));
      setReturnModalOrder(null);
      setReturnReason('');
      notify('Return/Replacement request submitted successfully! Awaiting Admin approval.', { type: 'success', title: 'Request submitted' });
    } catch (err) {
      notify(err.response?.data?.detail || 'Failed to submit request.', { type: 'error', title: 'Request failed' });
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!cancelReason.trim()) {
      notify('Please enter cancellation reason.', { type: 'warning', title: 'Reason required' });
      return;
    }
    setCancellingOrderId(orderId);
    try {
      const res = await API.post(`/orders/${orderId}/cancel/`, { reason: cancelReason.trim() });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data : o)));
      setShowCancelModal(null);
      setCancelReason('');
    } catch (err) {
      notify(err.response?.data?.detail || 'Failed to cancel order.', { type: 'error', title: 'Cancellation failed' });
    } finally {
      setCancellingOrderId(null);
    }
  };

  const getTrackingStep = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'confirmed': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      case 'cancelled': return -1;
      default: return 1;
    }
  };

  if (loading) return <Loading message="Loading customer account & orders..." />;

  const displayName = user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email?.split('@')[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans bg-white">
      
      {/* 1. TOP CUSTOMER DETAILS SUMMARY */}
      <div className="bg-gradient-to-r from-dark-900 via-black to-dark-900 text-white border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-volt-500 text-black flex items-center justify-center font-black text-2xl italic shadow-md">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black uppercase italic">{displayName}</h1>
                <span className="bg-volt-500/20 text-volt-400 border border-volt-400/30 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                  Verified Member
                </span>
              </div>
              <p className="text-xs text-gray-400">Customer Dashboard & Order Hub</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto text-xs">
            <div className="bg-dark-800 border border-gray-800 rounded-2xl p-3 flex items-center gap-3">
              <FaEnvelope className="text-volt-400" />
              <div className="truncate"><span className="text-gray-400 block text-[10px]">Email</span><span className="font-bold">{user?.email}</span></div>
            </div>
            <div className="bg-dark-800 border border-gray-800 rounded-2xl p-3 flex items-center gap-3">
              <FaPhone className="text-volt-400" />
              <div><span className="text-gray-400 block text-[10px]">Phone</span><span className="font-bold">{user?.phone || 'N/A'}</span></div>
            </div>
            <div className="bg-dark-800 border border-gray-800 rounded-2xl p-3 flex items-center gap-3">
              <FaShoppingBag className="text-volt-400" />
              <div><span className="text-gray-400 block text-[10px]">Orders</span><span className="font-black text-volt-400">{orders.length} Placed</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ORDER TRACKING & SHIPMENTS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-xl font-black uppercase italic text-black flex items-center gap-2">
              <FaBoxOpen className="text-volt-600" /> Order Tracking & Status
            </h2>
            <p className="text-xs text-gray-500">Track shipments & request returns/replacements after delivery</p>
          </div>
          <Link to="/products" className="text-xs font-black uppercase tracking-wider text-volt-700 hover:text-black flex items-center gap-1">
            Shop More <FaArrowRight size={10} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center p-12 bg-gray-50 rounded-3xl space-y-2">
            <FaBoxOpen size={30} className="mx-auto text-gray-400" />
            <p className="text-sm font-black uppercase">No Orders Found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const currentStep = getTrackingStep(order.order_status);
              const isDelivered = (order.order_status || '').toLowerCase() === 'delivered';
              const isCancelled = (order.order_status || '').toLowerCase() === 'cancelled';
              const hasReturn = order.return_status && order.return_status !== 'NONE';

              return (
                <div key={order.id} className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
                  
                  {/* Header info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-base">#{order.order_number}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isCancelled ? 'bg-red-100 text-red-700' : isDelivered ? 'bg-emerald-100 text-emerald-800' : 'bg-volt-100 text-volt-900'
                        }`}>
                          {order.order_status}
                        </span>

                        {hasReturn && (
                          <span className="bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                            {order.return_type === 'REFUND' ? 'Refund' : 'Replace'}: {order.return_status}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 block mt-0.5">
                        Placed: {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Total Amount</span>
                        <span className="text-base font-black text-black">₹{Number(order.total_amount).toLocaleString()}</span>
                      </div>

                      {/* Cancel Button (Before Shipped) */}
                      {!isCancelled && currentStep < 3 && (
                        <button
                          onClick={() => {
                            setCancelReason('');
                            setShowCancelModal(order);
                          }}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-[11px] font-bold uppercase"
                        >
                          Cancel
                        </button>
                      )}

                      {/* ⚡ RETURN / REPLACE BUTTON (Enabled ONLY AFTER DELIVERED) */}
                      <button
                        disabled={!isDelivered || hasReturn}
                        onClick={() => setReturnModalOrder(order)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                          isDelivered && !hasReturn
                            ? 'bg-black text-volt-400 hover:bg-volt-500 hover:text-black cursor-pointer shadow-sm'
                            : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'
                        }`}
                        title={!isDelivered ? "Return/Replace option unlocks only after product is Delivered" : ""}
                      >
                        <FaUndoAlt size={11} /> {hasReturn ? `${order.return_type}: ${order.return_status}` : 'Return / Replace'}
                      </button>
                    </div>
                  </div>

                  {/* Visual Tracker */}
                  {!isCancelled && (
                    <div className="grid grid-cols-4 relative py-2">
                      <div className="absolute top-4 left-[12%] right-[12%] h-1 bg-gray-200 -z-0">
                        <div className="h-full bg-volt-500 transition-all duration-500" style={{ width: `${((currentStep - 1) / 3) * 100}%` }} />
                      </div>
                      {[
                        { step: 1, label: 'Order Placed', icon: FaCheckCircle },
                        { step: 2, label: 'Confirmed', icon: FaShieldAlt },
                        { step: 3, label: 'Shipped', icon: FaTruck },
                        { step: 4, label: 'Delivered', icon: FaBoxOpen },
                      ].map((s) => {
                        const Icon = s.icon;
                        const isDone = currentStep >= s.step;
                        return (
                          <div key={s.step} className="flex flex-col items-center relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDone ? 'bg-black text-volt-400 shadow' : 'bg-gray-100 text-gray-400'}`}>
                              <Icon size={12} />
                            </div>
                            <span className={`text-[10px] font-black uppercase mt-1.5 text-center ${isDone ? 'text-black' : 'text-gray-400'}`}>
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Status Notes / Reasons */}
                  {order.status_reason && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs flex items-center gap-2 text-gray-700">
                      <FaClock className="text-volt-600 shrink-0" />
                      <span><strong>Status Note:</strong> {order.status_reason}</span>
                    </div>
                  )}

                  {/* ⚡ ITEMS WITH IMAGES & DETAILS */}
                  <div className="divide-y divide-gray-100 border-t border-gray-100 pt-3">
                    {order.items?.map((item) => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.product_image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100'}
                            alt={item.product_name}
                            className="w-12 h-12 object-contain bg-gray-50 border border-gray-200 rounded-xl p-1"
                          />
                          <div>
                            <span className="font-black text-gray-900 block">{item.product_name}</span>
                            <span className="text-[10px] text-gray-400">Qty: {item.quantity} • Standard Tournament Grade</span>
                            {order.original_product_name && order.replacement_product_name && (
                              <span className="text-[10px] text-purple-700 font-bold block">
                                Replacement: {order.original_product_name} replaced by {order.replacement_product_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-black text-black">₹{Number(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 text-[11px] text-gray-600 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-gray-400" />
                    <span>Destination: {order.shipping_address}, {order.city} ({order.postal_code})</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

{/* ========================================================= */}
      {/* ⚡ UPDATED RETURN / REPLACE MODAL */}
      {/* ========================================================= */}
      {returnModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-black uppercase text-black">
                  Return / Replace: #{returnModalOrder.order_number}
                </h3>
                <span className="text-[11px] text-gray-500 font-bold">
                  Choose refund to bank or exchange with another sports item
                </span>
              </div>
              <button 
                onClick={() => setReturnModalOrder(null)} 
                className="p-1.5 text-gray-400 hover:text-black rounded-lg hover:bg-gray-100"
              >
                <FaTimesCircle size={18} />
              </button>
            </div>

            {/* Solution Selector Tabs */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                Choose Solution *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* 1. GET RETURN MONEY */}
                <button
                  type="button"
                  onClick={() => {
                    setReturnType('REFUND');
                    setReturnReason('');
                  }}
                  className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    returnType === 'REFUND'
                      ? 'border-volt-500 bg-volt-50/60 shadow-sm ring-2 ring-volt-400 text-black'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <FaUndoAlt size={20} className={returnType === 'REFUND' ? 'text-black' : 'text-gray-400'} />
                  <span className="font-black uppercase text-xs tracking-wider">Get Return Money</span>
                  <span className="text-[9px] text-gray-500 font-medium">Refund to original payment mode</span>
                </button>

                {/* 2. REPLACE PRODUCT */}
                <button
                  type="button"
                  onClick={() => {
                    setReturnType('REPLACE');
                    setReturnReason('');
                  }}
                  className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    returnType === 'REPLACE'
                      ? 'border-volt-500 bg-volt-50/60 shadow-sm ring-2 ring-volt-400 text-black'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <FaExchangeAlt size={20} className={returnType === 'REPLACE' ? 'text-black' : 'text-gray-400'} />
                  <span className="font-black uppercase text-xs tracking-wider">Replace Product</span>
                  <span className="text-[9px] text-gray-500 font-medium">Pick another item from catalog</span>
                </button>
              </div>
            </div>

            {/* ================= CONDITION 1: REFUND SELECTED ================= */}
            {returnType === 'REFUND' && (
              <form onSubmit={handleReturnSubmit} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
                    Select Return Reason *
                  </label>
                  <select
                    required
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-volt-500 cursor-pointer"
                  >
                    <option value="">-- Choose Reason for Return --</option>
                    <option value="Defective or Damaged Gear">Defective or Damaged Sports Gear</option>
                    <option value="Incorrect Size / Fit Issue">Size doesn't fit properly</option>
                    <option value="Received Wrong Item / Variant">Received wrong color or different model</option>
                    <option value="Product Quality Not Satisfactory">Build or finish quality did not match expectation</option>
                    <option value="Order Arrived Too Late">Arrived after my match / tournament date</option>
                    <option value="Changed Mind / No Longer Needed">No longer needed</option>
                  </select>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                  <FaClock className="mt-0.5 shrink-0 text-amber-700" />
                  <span>Amount will be credited back to your original source account once item is picked and inspected.</span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setReturnModalOrder(null)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReturn || !returnReason}
                    className="px-6 py-2.5 bg-volt-500 hover:bg-volt-400 text-black rounded-xl text-xs font-black uppercase tracking-wider shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {submittingReturn ? 'Submitting...' : 'Submit Return Request'}
                  </button>
                </div>
              </form>
            )}

            {/* ================= CONDITION 2: REPLACE PRODUCT SELECTED ================= */}
            {returnType === 'REPLACE' && (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!returnReason) return;
                navigate(`/products?replace_order_id=${returnModalOrder.id}&order_num=${encodeURIComponent(returnModalOrder.order_number)}&old_price=${Number(returnModalOrder.items?.[0]?.price || 0)}&old_item_name=${encodeURIComponent(returnModalOrder.items?.[0]?.product_name || '')}&replace_reason=${encodeURIComponent(returnReason)}`);
              }} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
                    Select Replacement Reason *
                  </label>
                  <select
                    required
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-volt-500 cursor-pointer"
                  >
                    <option value="">-- Choose Reason for Replacement --</option>
                    <option value="Defective or Damaged Gear">Defective or damaged sports gear</option>
                    <option value="Incorrect Size / Fit Issue">Size does not fit properly</option>
                    <option value="Received Wrong Item / Variant">Received wrong color or model</option>
                    <option value="Product Quality Not Satisfactory">Product quality was not satisfactory</option>
                  </select>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2 text-xs">
                  <span className="font-black uppercase text-black block">How Replacement Works:</span>
                  <p className="text-gray-600 text-[11px] leading-relaxed">
                    Clicking below will take you to our sports catalog. Select your preferred alternative gear or different size/variant, and your replacement order will be synced automatically.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setReturnModalOrder(null)}
                    className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!returnReason}
                    className="flex-1 py-3 px-5 bg-black hover:bg-volt-500 hover:text-black text-volt-400 font-black rounded-xl text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FaShoppingBag size={13} />
                    <span>Choose Another Product</span>
                    <FaArrowRight size={11} />
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black uppercase text-black">Cancel Order: #{showCancelModal.order_number}</h3>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
              Select cancellation reason *
            </label>
            <select
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-volt-500 cursor-pointer"
            >
              <option value="">-- Choose a reason --</option>
              <option value="Changed my mind">Changed my mind</option>
              <option value="Ordered by mistake">Ordered by mistake</option>
              <option value="Found a better price">Found a better price</option>
              <option value="Delivery is taking too long">Delivery is taking too long</option>
              <option value="Need to change the delivery address">Need to change the delivery address</option>
              <option value="Other reason">Other reason</option>
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowCancelModal(null); setCancelReason(''); }} className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold">Close</button>
              <button
                type="button"
                disabled={cancellingOrderId || !cancelReason}
                onClick={() => handleCancelOrder(showCancelModal.id)}
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-black uppercase disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {cancellingOrderId ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


// import { useState, useEffect, useContext } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import API from '../services/api';
// import Loading from '../components/Loading';
// import { AuthContext } from '../context/AuthContext';
// import { 
//   FaBoxOpen, FaTruck, FaCheckCircle, FaClock, FaShoppingBag, 
//   FaArrowRight, FaMapMarkerAlt, FaUndoAlt, FaExchangeAlt, FaShieldAlt,
//   FaTimesCircle
// } from 'react-icons/fa';

// export default function Orders() {
//   const { user } = useContext(AuthContext);
//   const navigate = useNavigate();

//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // Return / Replace Modal State
//   const [returnModalOrder, setReturnModalOrder] = useState(null);
//   const [returnType, setReturnType] = useState('REFUND');
//   const [returnReason, setReturnReason] = useState('');
//   const [submitting, setSubmitting] = useState(false);

//   const fetchOrders = () => {
//     API.get('/orders/user/')
//       .then((res) => {
//         const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
//         setOrders(list);
//       })
//       .catch((err) => console.error(err))
//       .finally(() => setLoading(false));
//   };

//   useEffect(() => {
//     if (!user) {
//       navigate('/login');
//       return;
//     }
//     fetchOrders();
//   }, [user]);

//   // 7-Day Return Policy Validator
//   const isWithin7Days = (order) => {
//     const orderDate = new Date(order.updated_at || order.created_at);
//     const diffDays = (new Date() - orderDate) / (1000 * 60 * 60 * 24);
//     return diffDays <= 7;
//   };

//   const handleRefundSubmit = async (e) => {
//     e.preventDefault();
//     if (!returnReason.trim()) return alert('Please select a return reason.');

//     setSubmitting(true);
//     try {
//       const res = await API.post(`/orders/${returnModalOrder.id}/return-request/`, {
//         return_type: 'REFUND',
//         return_reason: returnReason.trim(),
//         diff_amount: '0.00'
//       });
//       setOrders((prev) => prev.map((o) => (o.id === returnModalOrder.id ? res.data : o)));
//       setReturnModalOrder(null);
//       alert('Return request registered! ₹' + Number(returnModalOrder.total_amount).toLocaleString() + ' will be refunded within 7 days of pickup.');
//     } catch (err) {
//       alert(err.response?.data?.detail || 'Failed to submit return request.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Replacement Handoff to Catalog
//   const handleStartReplacement = () => {
//     const item = returnModalOrder.items?.[0] || {};
//     const replacementPayload = {
//       replaceOrderId: returnModalOrder.id,
//       replaceOrderNum: returnModalOrder.order_number,
//       oldItemName: item.product_name || 'Original Delivered Item',
//       oldItemPrice: Number(item.price || returnModalOrder.total_amount || 0),
//       oldItemImage: item.product_image || ''
//     };
    
//     // Store in sessionStorage to survive page transitions
//     sessionStorage.setItem('hrazm_replacement_data', JSON.stringify(replacementPayload));
//     setReturnModalOrder(null);

//     // Redirect to Products catalog
//     navigate(`/products?mode=replace&order_num=${returnModalOrder.order_number}`);
//   };

//   const getOrderTimelineStep = (order) => {
//     if (order.return_type === 'REPLACE' && order.return_status && order.return_status !== 'NONE') {
//       switch (order.return_status) {
//         case 'REQUESTED': return 1;
//         case 'APPROVED': return 2;
//         case 'COMPLETED': return 4;
//         case 'REJECTED': return -1;
//         default: return 1;
//       }
//     }

//     switch ((order.order_status || '').toLowerCase()) {
//       case 'confirmed': return 2;
//       case 'shipped': return 3;
//       case 'delivered': return 4;
//       case 'cancelled': return -1;
//       default: return 1;
//     }
//   };

//   if (loading) return <Loading message="Loading orders..." />;

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans bg-white">
//       <div className="flex items-center justify-between border-b border-gray-200 pb-4">
//         <div>
//           <h1 className="text-2xl font-black uppercase italic tracking-tight text-black flex items-center gap-2">
//             <FaBoxOpen className="text-volt-600" /> My Orders & Tracking
//           </h1>
//           <p className="text-xs text-gray-500 mt-0.5">Amazon/Flipkart Style 7-Day Return & Replacement Guarantee</p>
//         </div>
//         <Link to="/products" className="text-xs font-black uppercase tracking-wider text-volt-700 hover:text-black flex items-center gap-1">
//           Explore Catalog <FaArrowRight size={10} />
//         </Link>
//       </div>

//       {orders.length === 0 ? (
//         <div className="text-center p-12 bg-gray-50 rounded-3xl">
//           <FaBoxOpen size={30} className="mx-auto text-gray-400 mb-2" />
//           <p className="text-sm font-black uppercase">No Orders Placed Yet</p>
//         </div>
//       ) : (
//         <div className="space-y-6">
//           {orders.map((order) => {
//             const currentStep = getOrderTimelineStep(order);
//             const isDelivered = (order.order_status || '').toLowerCase() === 'delivered';
//             const isCancelled = (order.order_status || '').toLowerCase() === 'cancelled';
//             const hasReturn = order.return_status && order.return_status !== 'NONE';
//             const eligible7Days = isDelivered && isWithin7Days(order);

//             return (
//               <div key={order.id} className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
//                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
//                   <div>
//                     <div className="flex items-center gap-2 flex-wrap">
//                       <span className="font-mono font-black text-base">#{order.order_number}</span>
                      
//                       {order.return_type === 'REPLACE' && hasReturn ? (
//                         <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-purple-600 text-white shadow-sm flex items-center gap-1">
//                           <FaExchangeAlt size={9} /> Replaced Product - {order.return_status === 'APPROVED' ? 'Approved' : 'In Fulfillment'}
//                         </span>
//                       ) : order.return_type === 'REFUND' && hasReturn ? (
//                         <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white shadow-sm flex items-center gap-1">
//                           <FaUndoAlt size={9} /> Return Requested - {order.return_status}
//                         </span>
//                       ) : (
//                         <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
//                           isCancelled ? 'bg-red-100 text-red-700' : isDelivered ? 'bg-emerald-100 text-emerald-800' : 'bg-volt-100 text-volt-900'
//                         }`}>
//                           {order.order_status}
//                         </span>
//                       )}
//                     </div>
//                     <span className="text-[11px] text-gray-400 block mt-1">
//                       Placed: {new Date(order.created_at).toLocaleDateString('en-IN')}
//                     </span>
//                   </div>

//                   <div className="flex items-center gap-3">
//                     <div className="text-right">
//                       <span className="text-[10px] text-gray-400 uppercase font-bold block">Total Amount</span>
//                       <span className="text-base font-black text-black">₹{Number(order.total_amount).toLocaleString()}</span>
//                     </div>

//                     {/* ⚡ 7-DAY RETURN / REPLACE POLICY BUTTON */}
//                     <button
//                       disabled={!eligible7Days || hasReturn}
//                       onClick={() => {
//                         setReturnModalOrder(order);
//                         setReturnType('REFUND');
//                         setReturnReason('');
//                       }}
//                       className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
//                         eligible7Days && !hasReturn
//                           ? 'bg-black text-volt-400 hover:bg-volt-500 hover:text-black cursor-pointer shadow-sm'
//                           : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'
//                       }`}
//                       title={!isDelivered ? "Available only after Delivery" : !eligible7Days ? "7-day return policy expired" : ""}
//                     >
//                       <FaUndoAlt size={11} /> 
//                       {hasReturn ? (order.return_type === 'REPLACE' ? 'Replaced Product' : 'Return Submitted') : 'Return / Replace'}
//                     </button>
//                   </div>
//                 </div>

//                 {/* Real-time Order Fulfillment Stepper */}
//                 {!isCancelled && (
//                   <div className="grid grid-cols-4 relative py-2">
//                     <div className="absolute top-4 left-[12%] right-[12%] h-1 bg-gray-200 -z-0">
//                       <div className="h-full bg-volt-500 transition-all duration-500" style={{ width: `${((currentStep - 1) / 3) * 100}%` }} />
//                     </div>
//                     {[
//                       { step: 1, label: hasReturn ? 'Request Submitted' : 'Order Placed', icon: FaCheckCircle },
//                       { step: 2, label: hasReturn ? 'Store Approved' : 'Confirmed', icon: FaShieldAlt },
//                       { step: 3, label: hasReturn ? 'Pickup / Exchange Dispatched' : 'Shipped', icon: FaTruck },
//                       { step: 4, label: hasReturn ? 'Completed' : 'Delivered', icon: FaBoxOpen },
//                     ].map((s) => {
//                       const Icon = s.icon;
//                       const isDone = currentStep >= s.step;
//                       return (
//                         <div key={s.step} className="flex flex-col items-center relative z-10">
//                           <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDone ? 'bg-black text-volt-400 shadow' : 'bg-gray-100 text-gray-400'}`}>
//                             <Icon size={12} />
//                           </div>
//                           <span className={`text-[10px] font-black uppercase mt-1.5 text-center ${isDone ? 'text-black' : 'text-gray-400'}`}>
//                             {s.label}
//                           </span>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}

//                 {order.status_reason && (
//                   <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs flex items-center gap-2 text-gray-700">
//                     <FaClock className="text-volt-600 shrink-0" />
//                     <span><strong>Live Note:</strong> {order.status_reason}</span>
//                   </div>
//                 )}

//                 {/* Items in this order */}
//                 <div className="divide-y divide-gray-100 border-t border-gray-100 pt-3">
//                   {order.items?.map((item) => (
//                     <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
//                       <div className="flex items-center gap-3">
//                         <img
//                           src={item.product_image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100'}
//                           alt={item.product_name}
//                           className="w-12 h-12 object-contain bg-gray-50 border border-gray-200 rounded-xl p-1"
//                         />
//                         <div>
//                           <span className="font-black text-gray-900 block">{item.product_name}</span>
//                           <span className="text-[10px] text-gray-400">Qty: {item.quantity}</span>
//                         </div>
//                       </div>
//                       <span className="font-black text-black">₹{Number(item.price * item.quantity).toLocaleString()}</span>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="bg-gray-50 rounded-xl p-3 text-[11px] text-gray-600 flex items-center gap-2">
//                   <FaMapMarkerAlt className="text-gray-400" />
//                   <span>Destination: {order.shipping_address}, {order.city} ({order.postal_code})</span>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}

//       {/* ⚡ AMAZON / FLIPKART STYLE RETURN & REPLACE MODAL */}
//       {returnModalOrder && (
//         <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
//           <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in">
//             <div className="flex items-center justify-between border-b pb-3">
//               <div>
//                 <h3 className="text-base font-black uppercase text-black">
//                   Return / Replace: #{returnModalOrder.order_number}
//                 </h3>
//                 <span className="text-[11px] text-emerald-700 font-bold">
//                   ✓ Verified 7-Day Return Policy Eligible
//                 </span>
//               </div>
//               <button onClick={() => setReturnModalOrder(null)} className="text-gray-400 hover:text-black cursor-pointer">
//                 <FaTimesCircle size={18} />
//               </button>
//             </div>

//             <div className="grid grid-cols-2 gap-3">
//               <button
//                 type="button"
//                 onClick={() => setReturnType('REFUND')}
//                 className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
//                   returnType === 'REFUND' ? 'border-volt-500 bg-volt-50/60 ring-2 ring-volt-400 text-black font-black' : 'border-gray-200 text-gray-500'
//                 }`}
//               >
//                 <FaUndoAlt size={18} />
//                 <span className="uppercase text-xs">Return & Refund</span>
//                 <span className="text-[9px] text-gray-400 font-normal">Money back to bank in 7 days</span>
//               </button>

//               <button
//                 type="button"
//                 onClick={() => setReturnType('REPLACE')}
//                 className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
//                   returnType === 'REPLACE' ? 'border-volt-500 bg-volt-50/60 ring-2 ring-volt-400 text-black font-black' : 'border-gray-200 text-gray-500'
//                 }`}
//               >
//                 <FaExchangeAlt size={18} />
//                 <span className="uppercase text-xs">Replace Product</span>
//                 <span className="text-[9px] text-gray-400 font-normal">Exchange with another item</span>
//               </button>
//             </div>

//             {/* Option 1: Return & Refund */}
//             {returnType === 'REFUND' && (
//               <form onSubmit={handleRefundSubmit} className="space-y-4 pt-1">
//                 <div>
//                   <label className="block text-xs font-black uppercase text-gray-700 mb-1.5">Select Reason for Return *</label>
//                   <select
//                     required
//                     value={returnReason}
//                     onChange={(e) => setReturnReason(e.target.value)}
//                     className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs font-bold text-gray-800"
//                   >
//                     <option value="">-- Choose Reason --</option>
//                     <option value="Defective or Damaged Gear">Defective or Damaged Gear</option>
//                     <option value="Incorrect Size / Fit Issue">Size doesn't fit properly</option>
//                     <option value="Received Wrong Item / Variant">Received wrong product or variant</option>
//                     <option value="Product Quality Not Satisfactory">Build quality did not meet expectation</option>
//                     <option value="Changed Mind / No Longer Needed">No longer needed</option>
//                   </select>
//                 </div>

//                 <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-bold">
//                   💰 Refund of ₹{Number(returnModalOrder.total_amount).toLocaleString()} will be automatically processed into your bank account within 7 working days after courier pickup.
//                 </div>

//                 <div className="flex justify-end gap-2 pt-2 border-t">
//                   <button type="button" onClick={() => setReturnModalOrder(null)} className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold uppercase">Cancel</button>
//                   <button type="submit" disabled={submitting || !returnReason} className="px-6 py-2 bg-volt-500 text-black rounded-xl text-xs font-black uppercase">
//                     {submitting ? 'Submitting...' : 'Confirm Return'}
//                   </button>
//                 </div>
//               </form>
//             )}

//             {/* Option 2: Replace Product */}
//             {returnType === 'REPLACE' && (
//               <div className="space-y-4 pt-1">
//                 <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs space-y-2">
//                   <span className="font-black uppercase text-black block">Amazon / Flipkart Style Exchange:</span>
//                   <p className="text-gray-600 text-[11px] leading-relaxed">
//                     Select any sports product from our catalog. In the Cart, both the original item and the replacement will be compared:
//                   </p>
//                   <ul className="list-disc pl-4 text-[10px] text-gray-500 space-y-1">
//                     <li>If the new item is cheaper: The remaining balance will be refunded within 7 days.</li>
//                     <li>If the new item is more expensive: Simply pay the difference amount.</li>
//                   </ul>
//                 </div>

//                 <div className="flex gap-2 border-t pt-3">
//                   <button type="button" onClick={() => setReturnModalOrder(null)} className="py-2.5 px-4 bg-gray-100 text-xs font-bold uppercase rounded-xl">Cancel</button>
//                   <button
//                     type="button"
//                     onClick={handleStartReplacement}
//                     className="flex-1 py-2.5 px-4 bg-black hover:bg-volt-500 hover:text-black text-volt-400 font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
//                   >
//                     <FaShoppingBag size={12} /> Choose Replacement Product →
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }