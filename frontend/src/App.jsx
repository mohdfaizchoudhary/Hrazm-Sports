import { BrowserRouter as Router } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AppRoutes from './routes/AppRoutes';
import { FeedbackProvider } from './components/FeedbackProvider';
import ScrollToTop from './components/ScrollToTop';

const rawGoogleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const hasValidGoogleId = rawGoogleClientId && !rawGoogleClientId.includes('YOUR_GOOGLE_CLIENT_ID');

export default function App() {
  const appContent = (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <div className="flex flex-col min-h-screen bg-white">
              <Navbar />
              <main className="flex-grow">
                <AppRoutes />
              </main>
              <Footer />
            </div>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );

  const content = hasValidGoogleId ? (
      <GoogleOAuthProvider clientId={rawGoogleClientId}>
        {appContent}
      </GoogleOAuthProvider>
  ) : appContent;

  return <FeedbackProvider>{content}</FeedbackProvider>;
}