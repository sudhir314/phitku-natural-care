import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader, KeyRound, CheckCircle, ShieldAlert, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/apiClient';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [regStep, setRegStep] = useState(1); 

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePasswordStrength = (password) => {
    const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return strongPasswordRegex.test(password);
  };

  const handleResendOTP = async () => {
    try {
        await apiClient.post('/auth/register-init', {
            name: formData.name, 
            email: formData.email
        });
        toast.success(`New Code sent to ${formData.email}`);
    } catch (error) {
        toast.error("Failed to resend OTP");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        if (isLogin) {
            if(!formData.email || !formData.password) {
                throw new Error("Please fill in all fields");
            }
            
            const { data } = await apiClient.post('/auth/login', {
                email: formData.email.toLowerCase().trim(), 
                password: formData.password
            });
            handleAuthSuccess(data, "Welcome back!");
            return;
        }
        
        if (regStep === 1) {
            if(!formData.name || !formData.email) throw new Error("Name and Email required");
            
            await apiClient.post('/auth/register-init', {
                name: formData.name, 
                email: formData.email.toLowerCase().trim()
            });
            
            toast.success(`OTP sent to ${formData.email}`);
            setRegStep(2); 
        }
        else if (regStep === 2) {
            if(!formData.otp) throw new Error("Please enter the OTP");
            
            const cleanOTP = formData.otp.trim();
            await apiClient.post('/auth/verify-otp', {
                email: formData.email.toLowerCase().trim(), 
                otp: cleanOTP
            });
            
            toast.success("OTP Verified! Now set your password.");
            setRegStep(3); 
        }
        else if (regStep === 3) {
            if(!formData.password || !formData.confirmPassword) {
                throw new Error("Please fill both password fields");
            }
            if(formData.password !== formData.confirmPassword) {
                setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
                throw new Error("Passwords do not match!");
            }
            if (!validatePasswordStrength(formData.password)) {
                throw new Error("Password is weak! Use 8+ chars with letters & numbers.");
            }

            const { data } = await apiClient.post('/auth/register-finalize', {
                email: formData.email.toLowerCase().trim(), 
                otp: formData.otp.trim(), 
                password: formData.password
            });
            
            handleAuthSuccess(data, "Account created successfully!");
        }

    } catch (error) {
        const serverMessage = error.response?.data?.message;
        toast.error(serverMessage || error.message || "Something went wrong");
    } finally {
        setLoading(false);
    }
  };

  const handleAuthSuccess = (data, message) => {
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (onLogin) onLogin(data.user);
      toast.success(message);
      navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
             {isLogin ? "Login to access your account" : 
               regStep === 1 ? "Enter details to verify email" :
               regStep === 2 ? "Check your inbox for code" :
               "Secure your account"
             }
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {isLogin && (
                <>
                    <div className="relative">
                        <Mail className="absolute top-3 left-3 text-gray-400" size={20} />
                        <input name="email" type="email" placeholder="Email Address" required className="pl-10 w-full p-3 border rounded-lg focus:ring-green-500 outline-none" onChange={handleChange} />
                    </div>
                    <div className="relative">
                        <Lock className="absolute top-3 left-3 text-gray-400" size={20} />
                        <input name="password" type="password" placeholder="Password" required className="pl-10 w-full p-3 border rounded-lg focus:ring-green-500 outline-none" onChange={handleChange} />
                    </div>
                    {/* --- NEW: FORGOT PASSWORD LINK --- */}
                    <div className="text-right">
                        <Link to="/forgot-password" class="text-xs font-medium text-green-600 hover:text-green-500">
                            Forgot Password?
                        </Link>
                    </div>
                </>
            )}

            {!isLogin && regStep === 1 && (
                <div className="animate-in fade-in slide-in-from-right duration-300 space-y-4">
                    <div className="relative">
                        <User className="absolute top-3 left-3 text-gray-400" size={20} />
                        <input name="name" type="text" placeholder="Full Name" required className="pl-10 w-full p-3 border rounded-lg focus:ring-green-500 outline-none" onChange={handleChange} value={formData.name} />
                    </div>
                    <div className="relative">
                        <Mail className="absolute top-3 left-3 text-gray-400" size={20} />
                        <input name="email" type="email" placeholder="Email Address" required className="pl-10 w-full p-3 border rounded-lg focus:ring-green-500 outline-none" onChange={handleChange} value={formData.email} />
                    </div>
                </div>
            )}

            {!isLogin && regStep === 2 && (
                <div className="animate-in fade-in zoom-in duration-300">
                    <div className="text-center mb-4 text-sm font-medium text-green-600 bg-green-50 p-2 rounded border border-green-100">
                        OTP sent to <b>{formData.email}</b>
                    </div>
                    <div className="relative mb-2">
                        <KeyRound className="absolute top-3 left-3 text-green-600" size={20} />
                        <input name="otp" type="text" maxLength="6" placeholder="Enter 6-digit OTP" required className="pl-10 w-full p-3 border border-green-300 rounded-lg focus:ring-green-500 text-xl tracking-[0.5em] font-bold text-center outline-none" onChange={handleChange} value={formData.otp} autoFocus />
                    </div>
                    <div className="text-right">
                        <button type="button" onClick={handleResendOTP} className="text-xs text-green-700 hover:underline flex items-center justify-end gap-1 ml-auto">
                            <RefreshCw size={12} /> Resend Code
                        </button>
                    </div>
                </div>
            )}

            {!isLogin && regStep === 3 && (
                 <div className="animate-in fade-in slide-in-from-right duration-300 space-y-4">
                     <div className="flex items-center gap-2 text-green-700 text-sm font-bold mb-2 bg-green-50 p-2 rounded border border-green-100">
                        <CheckCircle size={16} /> Email Verified! Set Password.
                     </div>
                     <div className="text-xs text-gray-500 flex gap-2 items-start">
                        <ShieldAlert size={14} className="text-gray-400 mt-0.5 shrink-0" />
                        <span>Password must be 8+ chars and include at least one letter and number.</span>
                     </div>
                     <div className="relative">
                        <Lock className="absolute top-3 left-3 text-gray-400" size={20} />
                        <input name="password" type="password" placeholder="Create Password" required className="pl-10 w-full p-3 border rounded-lg focus:ring-green-500 outline-none" onChange={handleChange} value={formData.password} />
                    </div>
                    <div className="relative">
                        <Lock className="absolute top-3 left-3 text-gray-400" size={20} />
                        <input name="confirmPassword" type="password" placeholder="Confirm Password" required className={`pl-10 w-full p-3 border rounded-lg focus:ring-green-500 outline-none ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`} onChange={handleChange} value={formData.confirmPassword} />
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="text-xs text-red-500 font-bold text-center animate-pulse">
                            Passwords do not match!
                        </p>
                    )}
                 </div>
            )}

          </div>

          <button type="submit" disabled={loading} className={`w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white transition shadow-md hover:shadow-lg ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800'}`}>
            {loading ? <Loader className="animate-spin" /> : isLogin ? "Sign In" : regStep === 1 ? "Send OTP" : regStep === 2 ? "Verify OTP" : "Create Account"} 
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => { setIsLogin(!isLogin); setRegStep(1); setFormData({name:'', email:'', password:'', confirmPassword:'', otp:''}); }} className="font-bold text-green-700 hover:underline">
                    {isLogin ? "Register Now" : "Login Here"}
                </button>
            </p>
            
            {!isLogin && regStep > 1 && (
                <button onClick={() => setRegStep(regStep - 1)} className="text-xs text-gray-500 hover:text-black mt-4 underline">
                    &larr; Go Back
                </button>
            )}
        </div>

      </div>
    </div>
  );
};

export default Login;