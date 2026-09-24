import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { useFeedback } from '../components/FeedbackProvider';
import { 
  FaShieldAlt, 
  FaMapMarkerAlt, 
  FaCreditCard, 
  FaMoneyBillWave, 
  FaMobileAlt,
  FaCheckCircle,
  FaReceipt,
  FaShoppingBag,
  FaTimes,
  FaQrcode,
  FaLock
} from 'react-icons/fa';

export default function Checkout() {
  const { cart, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { notify } = useFeedback();

  const [shippingData, setShippingData] = useState({
    shipping_address: '',
    city: '',
    state: '',
    postal_code: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccessModal, setOrderSuccessModal] = useState(null);
  const [showUpiQr, setShowUpiQr] = useState(false);
  const [cardData, setCardData] = useState({ name: '', number: '', expiry: '', cvv: '' });

  // Set the store's UPI ID here
  const OWNER_UPI_ID = "9068104055-2@ybl"; 
  const subtotal = Number(cart?.total_amount || 0);
  const shippingCharge = Number(cart?.shipping_charge ?? (subtotal > 999 ? 0 : 100));
  const grandTotal = Number(cart?.grand_total ?? subtotal + shippingCharge);

  // Auto-filled UPI amount URI
  const upiPaymentUri = `upi://pay?pa=${OWNER_UPI_ID}&pn=Hrazm%20Sports&am=${grandTotal}&cu=INR&tn=Sports%20Order`;
  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiPaymentUri)}`;

  const handleCardNumberChange = (event) => {
    const rawNumber = event.target.value.replace(/\D/g, '').slice(0, 16);
    setCardData((current) => ({
      ...current,
      number: rawNumber.replace(/(.{4})/g, '$1 ').trim(),
    }));
  };

  const handleCardExpiryChange = (event) => {
    const rawExpiry = event.target.value.replace(/\D/g, '').slice(0, 4);
    setCardData((current) => ({
      ...current,
      expiry: rawExpiry.length > 2 ? `${rawExpiry.slice(0, 2)}/${rawExpiry.slice(2)}` : rawExpiry,
    }));
  };

  const loadRazorpay = () => new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Unable to load Razorpay checkout.'));
    document.body.appendChild(script);
  });

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!cart?.items?.length) {
      notify('Your cart is empty.', { type: 'warning', title: 'Nothing to checkout' });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        ...shippingData,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'COD' ? 'Pending' : 'Paid',
      };

      if (paymentMethod === 'COD') {
        const res = await API.post('/orders/', payload);
        await clearCart();
        setOrderSuccessModal(res.data);
        return;
      }

      if (paymentMethod === 'CARD') {
        const cleanCardNumber = cardData.number.replace(/\s/g, '');
        if (!cardData.name.trim() || cleanCardNumber.length !== 16 || !/^\d{2}\/\d{2}$/.test(cardData.expiry) || !/^\d{3,4}$/.test(cardData.cvv)) {
          setError('Please enter the cardholder name, 16-digit card number, expiry date, and CVV.');
          setLoading(false);
          return;
        }
      }

      await loadRazorpay();
      const gateway = await API.post('/payments/razorpay/order/', {
        amount: Math.round(grandTotal * 100),
        payment_method: paymentMethod,
      });

      const razorpay = new window.Razorpay({
        key: gateway.data.key_id,
        amount: gateway.data.amount,
        currency: gateway.data.currency,
        name: 'Hrazm Sports',
        description: 'Sports order payment',
        order_id: gateway.data.razorpay_order_id,
        prefill: {
          name: paymentMethod === 'CARD' ? cardData.name : user?.name || '',
          email: user?.email || '',
        },
        ...(paymentMethod === 'CARD' ? {
          config: {
            display: {
              blocks: {
                card: {
                  name: 'Pay by card',
                  instruments: [{ method: 'card' }],
                },
              },
              sequence: ['block.card'],
              preferences: { show_default_blocks: false },
            },
          },
        } : {}),
        theme: { color: '#b4f000' },
        handler: async (response) => {
          try {
            const res = await API.post('/orders/', {
              ...payload,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await clearCart();
            setOrderSuccessModal(res.data);
          } catch (err) {
            setError(err.response?.data?.detail || 'Payment succeeded, but order confirmation failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      razorpay.on('payment.failed', () => {
        setError('Payment failed. Your cart is unchanged and no order was placed.');
        setLoading(false);
      });
      razorpay.open();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Unable to start payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8 font-sans">
      
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-black italic uppercase text-black">
          Athlete <span className="text-volt-600">Checkout</span>
        </h1>
        <p className="text-xs text-gray-500 font-bold uppercase mt-0.5">
          Delivery Address & Payment Selection
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Address Section */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
              <FaMapMarkerAlt className="text-volt-600" /> 1. Shipping Destination
            </h2>

            <div className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-gray-700 mb-1">Full Street Address / House / Flat</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 102, Sports Enclave, Near Stadium"
                  value={shippingData.shipping_address}
                  onChange={(e) => setShippingData({ ...shippingData, shipping_address: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs focus:outline-none focus:border-volt-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={shippingData.city}
                    onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs focus:outline-none focus:border-volt-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={shippingData.state}
                    onChange={(e) => setShippingData({ ...shippingData, state: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs focus:outline-none focus:border-volt-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={shippingData.postal_code}
                    onChange={(e) => setShippingData({ ...shippingData, postal_code: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs focus:outline-none focus:border-volt-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Three Payment Modes Only */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
              <FaCreditCard className="text-volt-600" /> 2. Select Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">
              {[
                { id: 'UPI', label: 'Instant UPI / QR', desc: 'Pre-filled bill QR', icon: FaMobileAlt },
                { id: 'CARD', label: 'Credit / Debit Card', desc: 'Visa, MasterCard, RuPay', icon: FaCreditCard },
                { id: 'COD', label: 'Cash on Delivery', desc: 'Pay at doorstep', icon: FaMoneyBillWave },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id);
                      setShowUpiQr(false);
                      setCardData({ name: '', number: '', expiry: '', cvv: '' });
                      setError('');
                    }}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center gap-2 transition-all ${
                      isSelected
                        ? 'border-volt-500 bg-volt-50/60 shadow-xs'
                        : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={24} className={isSelected ? 'text-volt-700' : 'text-gray-500'} />
                    <div>
                      <span className={`text-xs font-black uppercase block ${isSelected ? 'text-black' : 'text-gray-700'}`}>
                        {m.label}
                      </span>
                      <span className="text-[10px] text-gray-400 font-normal">{m.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50/50">
              {/* UPI */}
              {paymentMethod === 'UPI' && (
                <div className="space-y-4 text-xs font-bold text-gray-800">
                  <div className="flex items-center gap-2 text-sm font-black uppercase text-black">
                    <FaQrcode className="text-volt-600" size={16} /> Pay securely with UPI
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                    <button
                      type="button"
                      onClick={() => setShowUpiQr((visible) => !visible)}
                      className="bg-black text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider"
                    >
                      QR Code
                    </button>

                    {showUpiQr && (
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="p-2 border-2 border-dashed border-gray-300 rounded-xl bg-white shadow-xs">
                          <img src={upiQrUrl} alt="UPI QR Code" className="w-48 h-48 object-contain" />
                        </div>

                        <div className="space-y-2 text-center sm:text-left flex-1">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Store Merchant UPI ID</div>
                          <div className="font-mono text-sm bg-gray-100 px-3 py-1.5 rounded-lg inline-block text-black font-bold">
                            {OWNER_UPI_ID}
                          </div>

                          <div className="text-sm text-emerald-600 font-black">
                            Pre-Set Amount: ₹{grandTotal.toLocaleString()}
                          </div>

                          <div className="p-3 bg-volt-50 border border-volt-200 rounded-xl text-[11px] text-volt-900 font-medium">
                            Scan with <strong>Google Pay, PhonePe, Paytm, or BHIM</strong>. Complete the Razorpay checkout to verify payment and place the order.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Card */}
              {paymentMethod === 'CARD' && (
                <div className="space-y-4 text-xs font-bold text-gray-800">
                  <div className="flex items-center gap-2 text-sm font-black uppercase text-black">
                    <FaCreditCard className="text-volt-600" size={16} /> Credit / Debit Card
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200 text-xs text-gray-600 font-medium">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-gray-700 mb-1">Cardholder Full Name</label>
                        <input type="text" required value={cardData.name} onChange={(event) => setCardData({ ...cardData, name: event.target.value })} placeholder="e.g. John Doe" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-volt-500" />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-1">Card Number</label>
                        <input type="text" inputMode="numeric" autoComplete="cc-number" required value={cardData.number} onChange={handleCardNumberChange} placeholder="4532 8920 1192 4029" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono tracking-wider focus:outline-none focus:border-volt-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-700 mb-1">Expiry Date (MM/YY)</label>
                          <input type="text" inputMode="numeric" autoComplete="cc-exp" required value={cardData.expiry} onChange={handleCardExpiryChange} placeholder="08/29" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-volt-500" />
                        </div>
                        <div>
                          <label className="block text-gray-700 mb-1">CVV</label>
                          <input type="password" inputMode="numeric" autoComplete="cc-csc" maxLength={4} required value={cardData.cvv} onChange={(event) => setCardData({ ...cardData, cvv: event.target.value.replace(/\D/g, '') })} placeholder="•••" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-volt-500" />
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 text-[11px] text-gray-500">Razorpay will securely authorize this payment after you click Confirm &amp; Place Order. Card data is not sent to our backend.</p>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <FaLock size={11} className="text-volt-600" />
                    <span>256-Bit Encrypted Direct Bank Settlement</span>
                  </div>
                </div>
              )}

              {/* COD */}
              {paymentMethod === 'COD' && (
                <div className="space-y-2 text-xs font-bold text-gray-800">
                  <div className="flex items-center gap-2 text-sm font-black uppercase text-black">
                    <FaMoneyBillWave className="text-volt-600" size={16} /> Cash on Delivery (Doorstep)
                  </div>
                  <p className="text-gray-500 font-normal text-xs bg-white p-4 rounded-xl border border-gray-200">
                    Pay with Cash or UPI directly to our delivery courier partner at your doorstep.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-3xl p-6 space-y-5 shadow-sm">
          <h3 className="font-black italic uppercase text-black text-base border-b border-gray-100 pb-3">
            Order Summary
          </h3>

          <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-1 text-xs">
            {cart?.items?.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-black line-clamp-1">{item.product?.name}</span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    Size: {item.size || 'N/A'} • Qty: {item.quantity}
                  </span>
                </div>
                <span className="font-black text-black">
                  ₹{(Number(item.price) * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2.5 pt-2 border-t border-gray-100 text-xs font-bold text-gray-600">
            <div className="flex justify-between">
              <span>Items Total</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Express Delivery</span>
              <span>{shippingCharge ? `₹${shippingCharge.toLocaleString()}` : 'FREE'}</span>
            </div>
            <div className="flex justify-between text-base font-black text-black pt-2 border-t border-gray-100">
              <span>Grand Total</span>
              <span>₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-volt-500 hover:bg-volt-400 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(180,240,0,0.35)] flex items-center justify-center gap-2 transition-all"
          >
            {loading ? 'Processing Payment...' : paymentMethod === 'COD' ? 'Confirm & Place Order' : 'Confirm & Place Order'}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {orderSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl border border-gray-200 animate-scale-in relative">
            <button 
              onClick={() => navigate('/orders')}
              className="absolute top-4 right-4 text-gray-400 hover:text-black"
            >
              <FaTimes size={16} />
            </button>

            <div className="w-16 h-16 bg-volt-500 text-black rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <FaCheckCircle size={32} />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase text-volt-800 bg-volt-100 px-3 py-1 rounded-full border border-volt-200">
                Order Confirmed
              </span>
              <h2 className="text-2xl font-black italic uppercase text-black mt-2">
                Order Received!
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Order <strong className="text-black font-mono">#{orderSuccessModal.order_number}</strong> placed via <strong className="text-black uppercase">{paymentMethod}</strong> for ₹{Number(orderSuccessModal.total_amount).toLocaleString()}.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => navigate('/orders')}
                className="w-full bg-black hover:bg-gray-900 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <FaReceipt /> View Order Tracking
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-volt-500 hover:bg-volt-400 text-black py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <FaShoppingBag /> Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}