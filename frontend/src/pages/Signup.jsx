import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { FaBolt, FaLock, FaEnvelope, FaUser, FaPhone } from 'react-icons/fa';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Phone validation (10 digits)
    const cleanedPhone = formData.phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      // ⚡ Explicitly passing phone along with first_name and email
      await API.post('/auth/register/', {
        email: formData.email.trim(),
        password: formData.password,
        first_name: formData.name.trim(),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        username: formData.email.split('@')[0],
      });

      if (login) {
        await login(formData.email.trim(), formData.password);
      }
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.detail 
        || err.response?.data?.email?.[0] 
        || err.response?.data?.phone?.[0]
        || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 font-sans bg-white">
      <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full shadow-lg space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-volt-500 text-black rounded-2xl flex items-center justify-center mx-auto text-2xl italic font-black shadow-md">
            <FaBolt />
          </div>
          <h2 className="text-2xl font-black uppercase italic tracking-tight text-gray-900">
            Create <span className="text-volt-600">Account</span>
          </h2>
          <p className="text-xs text-gray-500">Join Hrazm Sports for exclusive gear & rapid delivery</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
          <div>
            <label className="block text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <input
                type="text"
                name="name"
                required
                placeholder="Virat Kohli"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-volt-500 text-xs font-normal"
              />
              <FaUser className="absolute left-3.5 top-3.5 text-gray-400" size={13} />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                name="email"
                required
                placeholder="athlete@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-volt-500 text-xs font-normal"
              />
              <FaEnvelope className="absolute left-3.5 top-3.5 text-gray-400" size={13} />
            </div>
          </div>

          {/* ⚡ Mobile Number Input */}
          <div>
            <label className="block text-gray-700 mb-1">Mobile Number</label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                required
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-volt-500 text-xs font-normal"
              />
              <FaPhone className="absolute left-3.5 top-3.5 text-gray-400" size={13} />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                name="password"
                required
                placeholder="Create password (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-volt-500 text-xs font-normal"
              />
              <FaLock className="absolute left-3.5 top-3.5 text-gray-400" size={13} />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type="password"
                name="confirmPassword"
                required
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
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
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
          Already have an account?{' '}
          <Link to="/login" className="text-black font-black hover:underline uppercase">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}