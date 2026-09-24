import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaBolt, FaLock, FaEnvelope } from 'react-icons/fa';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 font-sans bg-white">
      <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full shadow-lg space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-volt-500 text-black rounded-2xl flex items-center justify-center mx-auto text-2xl italic font-black shadow-md">
            <FaBolt />
          </div>
          <h2 className="text-2xl font-black uppercase italic tracking-tight text-gray-900">
            Welcome <span className="text-volt-600">Back</span>
          </h2>
          <p className="text-xs text-gray-500">Sign in to your Hrazm Sports customer account</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Customer Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
          <div>
            <label className="block text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="athlete@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-volt-500 text-xs font-normal"
              />
              <FaEnvelope className="absolute left-3.5 top-3.5 text-gray-400" size={13} />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-volt-500 text-xs font-normal"
              />
              <FaLock className="absolute left-3.5 top-3.5 text-gray-400" size={13} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-volt-500 hover:bg-volt-400 text-black py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Create Account Link */}
        <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
          Don't have an account?{' '}
          <Link to="/Signup" className="text-black font-black hover:underline uppercase">
            Create Account
          </Link>
        </div>

      </div>
    </div>
  );
}