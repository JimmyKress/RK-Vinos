import React from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import PromoCarousel from './components/PromoCarousel.jsx'
import Footer from './components/Footer.jsx'
import PilotBanner from './components/PilotBanner.jsx'
import VirtualAssistant from './components/VirtualAssistant.jsx'
import WhatsAppFloatButton from './components/WhatsAppFloatButton.jsx'
import Home from './pages/Home.jsx'
import Catalog from './pages/Catalog.jsx'
import WineDetail from './pages/WineDetail.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import CheckoutSuccess from './pages/CheckoutSuccess.jsx'
import CheckoutFailure from './pages/CheckoutFailure.jsx'
import CheckoutPending from './pages/CheckoutPending.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import VerifyCode from './pages/VerifyCode.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Admin from './pages/Admin.jsx'
import AdminForgotPassword from './pages/AdminForgotPassword.jsx'
import AdminResetPassword from './pages/AdminResetPassword.jsx'
import Profile from './pages/Profile.jsx'
import Feedback from './pages/Feedback.jsx'
import FAQPage from './pages/FAQ.jsx'
import PilotFeedbackPage from './pages/PilotFeedbackPage.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

export default function App() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/rk/') || location.pathname.startsWith('/admin/')
  const hidePromoBar = isAdmin || location.pathname.startsWith('/vino/') || location.pathname === '/login' || location.pathname === '/registro' || location.pathname === '/verificar-codigo' || location.pathname === '/perfil' || location.pathname.startsWith('/checkout') || location.pathname === '/forgot-password' || location.pathname === '/reset-password'
  const hidePilotBanner = isAdmin || location.pathname === '/pilot-feedback' || location.pathname.startsWith('/checkout')

  return (
    <AuthProvider>
      <CartProvider>
        {!isAdmin && <Header />}
        {!hidePromoBar && <PromoCarousel />}
        {!isAdmin && !hidePilotBanner && <PilotBanner />}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalogo" element={<Catalog />} />
            <Route path="/categoria/:type" element={<Catalog />} />
            <Route path="/vino/:slug" element={<WineDetail />} />
            <Route path="/carrito" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/checkout/failure" element={<CheckoutFailure />} />
            <Route path="/checkout/pending" element={<CheckoutPending />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/verificar-codigo" element={<VerifyCode />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/pilot-feedback" element={<PilotFeedbackPage />} />
            <Route path="/rk/Admin" element={<Admin />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
            <Route path="/admin/reset-password" element={<AdminResetPassword />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        {!isAdmin && <Footer />}
        {!isAdmin && <WhatsAppFloatButton />}
      </CartProvider>
    </AuthProvider>
  )
}
