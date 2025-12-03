import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; 
import apiClient from '../api/apiClient'; 
import qrCodeImg from '../assets/payment-qr.jpg'; 
// Import icons for the animation
import { Package, Truck, CheckCircle } from 'lucide-react';

// --- NEW: Success Animation Component ---
const OrderSuccessAnimation = ({ onComplete }) => {
  const [stage, setStage] = useState(0); // 0: Packing, 1: Shipping, 2: Confirmed

  useEffect(() => {
    // Timeline: 
    // 0s: Packing starts
    // 1.5s: Switch to Shipping
    // 4.0s: Switch to Confirmed
    // 5.5s: Finish (Redirect)
    
    const timer1 = setTimeout(() => setStage(1), 1500);
    const timer2 = setTimeout(() => setStage(2), 4000);
    const timer3 = setTimeout(onComplete, 5500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      <div className="text-center">
        
        {/* STAGE 0: PACKAGING */}
        {stage === 0 && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="relative mb-6 inline-block">
              <Package size={80} className="text-orange-500 animate-bounce" />
              <div className="absolute -bottom-4 left-0 right-0 h-2 bg-black/10 rounded-full blur-sm animate-pulse"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Packing your order...</h2>
            <p className="text-gray-500 mt-2">Gathering your natural goodies</p>
          </div>
        )}

        {/* STAGE 1: SHIPPING (Truck Moving) */}
        {stage === 1 && (
          <div className="animate-in fade-in slide-in-from-right duration-700">
             <div className="mb-6 relative w-64 h-24 mx-auto overflow-hidden">
                {/* Moving Road */}
                <div className="absolute bottom-0 left-0 right-0 border-b-4 border-gray-300"></div>
                {/* Moving Truck */}
                <div className="absolute bottom-1 left-0 animate-[drive_2s_linear_infinite]">
                    <Truck size={80} className="text-blue-600" />
                </div>
                {/* Wind/Speed Lines */}
                <div className="absolute top-4 right-10 w-8 h-1 bg-gray-200 rounded animate-pulse"></div>
                <div className="absolute top-8 right-4 w-12 h-1 bg-gray-200 rounded animate-pulse delay-75"></div>
             </div>
            <h2 className="text-2xl font-bold text-gray-800">On its way!</h2>
            <p className="text-gray-500 mt-2">Dispatched for delivery</p>
          </div>
        )}

        {/* STAGE 2: CONFIRMED */}
        {stage === 2 && (
          <div className="animate-in zoom-in duration-500">
            <div className="mb-6 inline-flex p-4 bg-green-100 rounded-full">
                <CheckCircle size={80} className="text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Order Confirmed!</h2>
            <p className="text-gray-500 mt-2">Thank you for shopping with Phitku.</p>
          </div>
        )}

        {/* Progress Dots */}
        <div className="flex gap-2 justify-center mt-12">
            <div className={`h-2 w-2 rounded-full transition-colors duration-300 ${stage >= 0 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
            <div className={`h-2 w-2 rounded-full transition-colors duration-300 ${stage >= 1 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
            <div className={`h-2 w-2 rounded-full transition-colors duration-300 ${stage >= 2 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
        </div>
      </div>

      {/* Custom Animation Styles for this component */}
      <style>{`
        @keyframes drive {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
};

const Payment = ({ order, clearCart, user }) => {
  const [method, setMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false); // Controls the Animation Overlay
  const navigate = useNavigate();

  // Fix for the console warning
  useEffect(() => {
    if (!order || order.total === 0) {
      navigate('/');
    }
  }, [order, navigate]);

  if (!order || order.total === 0) return null;

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to finalize your order.");
      navigate('/login');
      return;
    }

    // 1. Start the Animation immediately
    setIsProcessing(true);

    try {
        const orderData = {
            items: order.items.map(item => ({
                product: item._id, 
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            shippingAddress: order.details,
            totalPrice: order.total
        };
        
        // 2. Submit Order to Backend (happens in background while animation plays)
        const res = await apiClient.post('/orders', orderData);

        if (res.status >= 400) {
            throw new Error(res.data.message || 'Order submission failed');
        }
        
        // We don't navigate yet. We let the animation component call 'onComplete'
        
    } catch (error) {
        console.error("Order Error:", error);
        // If error, stop animation and show error
        setIsProcessing(false);
        toast.error("Payment failed. Please try again.");
    }
  };

  // 3. Called when animation finishes (approx 5.5 seconds)
  const handleAnimationComplete = () => {
      clearCart(); 
      navigate('/account');
      toast.success("Order placed successfully!");
  };

  return (
    <>
      {/* Show Animation Overlay if processing */}
      {isProcessing && <OrderSuccessAnimation onComplete={handleAnimationComplete} />}

      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center">Checkout</h2>
          <div className="mb-6 text-center">
              <p className="text-gray-500">Total Amount to Pay</p>
              <p className="text-3xl font-bold text-green-600">Rs. {order.total}</p>
          </div>

          <div className="flex gap-2 mb-6">
              <button onClick={() => setMethod('card')} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${method === 'card' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Card</button>
              <button onClick={() => setMethod('upi')} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${method === 'upi' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>UPI ID</button>
              <button onClick={() => setMethod('scan')} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${method === 'scan' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Scan QR</button>
          </div>

          <form onSubmit={handlePayment} className="space-y-4">
              {method === 'card' && (
                  <div className="space-y-4 animate-in fade-in">
                      <input required type="text" placeholder="Card Number" className="w-full px-4 py-2 border rounded-md outline-none focus:border-green-500" maxLength="16" />
                      <div className="flex gap-4">
                          <input required type="text" placeholder="MM/YY" className="w-1/2 px-4 py-2 border rounded-md outline-none focus:border-green-500" />
                          <input required type="password" placeholder="CVV" className="w-1/2 px-4 py-2 border rounded-md outline-none focus:border-green-500" maxLength="3" />
                      </div>
                      <input required type="text" placeholder="Card Holder Name" className="w-full px-4 py-2 border rounded-md outline-none focus:border-green-500" />
                  </div>
              )}

              {method === 'upi' && (
                  <div className="space-y-4 animate-in fade-in">
                      <input required type="text" placeholder="Enter UPI ID (e.g. name@okhdfcbank)" className="w-full px-4 py-2 border rounded-md outline-none focus:border-green-500" />
                      <div className="bg-blue-50 p-3 rounded text-xs text-blue-700">
                          A payment request will be sent to your UPI app. Please approve it within 5 minutes.
                      </div>
                  </div>
              )}

              {method === 'scan' && (
                  <div className="text-center space-y-4 animate-in fade-in">
                      <p className="text-sm text-gray-600">Scan this QR code with any UPI app</p>
                      <div className="border-2 border-dashed border-green-200 p-2 rounded-xl inline-block">
                          <img src={qrCodeImg} alt="Payment QR Code" className="w-48 h-48 object-contain mx-auto" />
                      </div>
                      <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 text-left">
                          <strong>Note:</strong> After scanning and paying, please click the button below to confirm.
                      </div>
                  </div>
              )}
              
              <button 
                  className="w-full bg-green-600 text-white py-3 rounded-md font-bold hover:bg-green-700 transition shadow-md mt-4"
                  disabled={isProcessing}
              >
                  {method === 'scan' ? 'I Have Paid' : `Pay Rs. ${order.total}`}
              </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 mb-1">Shipping To:</p>
              <p className="text-sm text-gray-700">{order.details.address}, {order.details.city}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Payment;