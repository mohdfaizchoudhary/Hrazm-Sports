import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { 
  FaShieldAlt, 
  FaCheckCircle, 
  FaMobileAlt, 
  FaCreditCard, 
  FaUniversity,
  FaBolt,
  FaLock
} from 'react-icons/fa';
import { useFeedback } from '../components/FeedbackProvider';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useFeedback();
  const order = location.state?.order;

  const [loading, setLoading] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-xs font-bold text-gray-500">No active order to process payment for.</p>
        <button onClick={() => navigate('/')} className="mt-4 bg-volt-500 text-black px-4 py-2 rounded-xl text-xs font-black uppercase">
          Go to Home
        </button>
      </div>
    );
  }

  const handleSimulatedPayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate backend payment success
      setTimeout(() => {
        setLoading(false);
        navigate('/order-success', { state: { order } });
      }, 1500);
    } catch {
      notify('Payment authorization failed.', { type: 'error', title: 'Payment failed' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-lg w-full shadow-xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1 border-b border-gray-100 pb-4">
          <div className="w-12 h-12 bg-volt-50 text-black rounded-2xl flex items-center justify-center mx-auto mb-2 border border-volt-200 shadow-sm">
            <FaBolt className="text-volt-600" size={20} />
          </div>
          <h2 className="text-2xl font-black italic uppercase text-black">Hrazm Secure Pay</h2>
          <p className="text-xs text-gray-500 font-bold">
            Order #{order.order_number} • Total: <span className="text-black font-black">Rs {Number(order.total_amount).toLocaleString()}</span>
          </p>
        </div>

        <form onSubmit={handleSimulatedPayment} className="space-y-4 text-xs font-bold">
          
          {order.payment_method === 'UPI' ? (
            <div className="space-y-4">
              <div className="p-4 bg-dark-900 rounded-2xl text-center text-white space-y-2">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Scan & Pay via QR</span>
                <div className="w-36 h-36 bg-white rounded-xl mx-auto p-2 flex items-center justify-center shadow-inner">
                  {/* Dynamic QR SVG */}
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=hrazmsports@bank&pn=HrazmSports&am=${order.total_amount}`} alt="UPI QR" className="w-full h-full" />
                </div>
                <span className="text-[11px] text-volt-400 font-mono">hrazmsports@sportsupi</span>
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Or Enter UPI ID (VPA)</label>
                <input
                  type="text"
                  placeholder="yourname@okaxis"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs focus:outline-none focus:border-volt-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-gray-700 mb-1">Card Number</label>
                <input
                  type="text"
                  placeholder="4532 •••• •••• 8901"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs focus:outline-none focus:border-volt-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs focus:outline-none focus:border-volt-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">CVV / Security</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="•••"
                    required
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs focus:outline-none focus:border-volt-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-volt-500 hover:bg-volt-400 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 mt-4 transition-all"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <FaLock className="animate-spin" /> Authorizing Payment...
              </span>
            ) : (
              `Pay Rs ${Number(order.total_amount).toLocaleString()} Securely`
            )}
          </button>
        </form>

        <div className="text-center text-[10px] text-gray-400 font-bold uppercase flex items-center justify-center gap-2">
          <FaShieldAlt className="text-volt-500" /> Bank Level 256-Bit SSL Protection
        </div>

      </div>
    </div>
  );
}