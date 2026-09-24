import { useLocation, Link } from 'react-router-dom';
import { FaCheckCircle, FaBolt, FaShoppingBag, FaTruck, FaReceipt } from 'react-icons/fa';

export default function OrderSuccess() {
  const location = useLocation();
  const order = location.state?.order;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="w-20 h-20 bg-volt-500 text-black rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(163,230,53,0.4)]">
        <FaCheckCircle size={36} />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-widest text-volt-600 bg-volt-50 px-3 py-1 rounded-full border border-volt-200">
          Order Verified & Dispatched
        </span>
        <h1 className="text-4xl font-black italic uppercase text-black">
          You're Geared Up!
        </h1>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Thank you for choosing Hrazm Sports. Your athletic gear is being packed for express transit.
        </p>
      </div>

      {order && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 text-left space-y-4 shadow-sm text-xs font-bold">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <span className="text-gray-500 uppercase">Order ID:</span>
            <span className="font-mono font-black text-black">{order.order_number}</span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <span className="text-gray-500 uppercase">Total Paid:</span>
            <span className="font-black text-black text-sm">Rs {Number(order.total_amount).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <span className="text-gray-500 uppercase">Payment Mode:</span>
            <span className="text-gray-800">{order.payment_method}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 uppercase">Shipping To:</span>
            <span className="text-gray-800 text-right max-w-xs truncate">{order.shipping_address}, {order.city}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 pt-4">
        <Link to="/orders">
          <button className="bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm">
            <FaReceipt /> Track In My Orders
          </button>
        </Link>
        <Link to="/products">
          <button className="bg-volt-500 hover:bg-volt-400 text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md">
            <FaShoppingBag /> Continue Shopping
          </button>
        </Link>
      </div>
    </div>
  );
}