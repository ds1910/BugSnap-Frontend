import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// ----------------- Toast Component -----------------
const Toast = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`
        fixed top-6 right-6 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border z-[9999]
        transform transition-all duration-300 ease-in-out
        ${visible ? "translate-x-0 opacity-100" : "translate-x-20 opacity-0"}
        ${
          type === "success"
            ? "bg-gradient-to-r from-green-500 to-emerald-600 border-green-400 text-white"
            : "bg-gradient-to-r from-red-500 to-rose-600 border-red-400 text-white"
        }
      `}
    >
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-3 text-white/70 hover:text-white transition">
        ✕
      </button>
    </div>
  );
};

// ----------------- ResetPasswordConfirm Component -----------------
const ResetPasswordConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showSuggestion, setShowSuggestion] = useState(false);

  // Function to generate a secure password
  const generateSecurePassword = () => {
    const length = 16; // Strong password length
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // Generate crypto-safe random numbers
    const getRandomChar = (str) => {
      const arr = new Uint32Array(1);
      window.crypto.getRandomValues(arr);
      return str[arr[0] % str.length];
    };
    
    // Ensure at least one of each required character type
    const requiredChars = [
      getRandomChar(uppercase),
      getRandomChar(lowercase),
      getRandomChar(numbers),
      getRandomChar(symbols)
    ];
    
    // Generate remaining characters
    const remainingLength = length - requiredChars.length;
    const allChars = uppercase + lowercase + numbers + symbols;
    const remainingChars = Array.from({ length: remainingLength }, () => getRandomChar(allChars));
    
    // Combine and shuffle all characters
    const allParts = [...requiredChars, ...remainingChars];
    for (let i = allParts.length - 1; i > 0; i--) {
      const j = Math.floor(window.crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1) * (i + 1));
      [allParts[i], allParts[j]] = [allParts[j], allParts[i]];
    }
    
    return allParts.join('');
  };

  // Function to apply suggested password
  const applySuggestedPassword = () => {
    if (loading) return; // Prevent generation while loading
    
    try {
      const newPassword = generateSecurePassword();
      if (!newPassword || newPassword.length < 8) {
        throw new Error('Generated password is invalid');
      }
      
      setPasswords(prev => ({
        ...prev,
        password: newPassword,
        confirmPassword: newPassword
      }));
      validatePassword(newPassword);
      showToast('Secure password generated and applied!', 'success');
    } catch (error) {
      console.error('Error generating password:', error);
      showToast('Could not generate password. Please try again.', 'error');
    }
  };
  const [passwords, setPasswords] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false
  });
  const [validations, setValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  
  const showToast = (message, type = "success") => setToast({ message, type });
  const token = searchParams.get("token");

  // Password validation function
  const validatePassword = (password) => {
    setValidations({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  };

  // Check if password meets all requirements
  const isPasswordValid = Object.values(validations).every(v => v);

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      showToast("Invalid reset link. Redirecting...", "error");
      setTimeout(() => navigate("/login"), 1500);
    }
  }, [token, navigate]);

  const handlePasswordChange = async (e) => {
    if (loading) return; // Prevent multiple submissions
    e.preventDefault();
    
    // Validate password requirements
    if (!isPasswordValid) {
      return showToast("Please meet all password requirements", "error");
    }

    // Validate password match
    if (passwords.password !== passwords.confirmPassword) {
      return showToast("Passwords don't match", "error");
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${backendUrl}/user/resetPassword`,
        {
          token,
          newPassword: passwords.password
        },
        { withCredentials: true }
      );

      showToast(response.data?.message || "Password reset successful!", "success");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to reset password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans text-gray-900 min-h-screen py-4 px-2 sm:px-4 md:p-8 reset-page-container relative overflow-hidden">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
          .font-sans { font-family: 'Roboto', sans-serif; }

          .gradient-button {
            background-image: linear-gradient(to right, #6366f1, #8b5cf6, #d946ef);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
            display: flex; align-items: center; justify-content: center; gap: 0.5rem;
            width: fit-content;
            margin: 0 auto;
            position: relative;
            overflow: hidden;
          }
          .gradient-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              120deg,
              transparent,
              rgba(255, 255, 255, 0.3),
              transparent
            );
            transition: 0.5s;
          }
          .gradient-button:hover::before {
            left: 100%;
          }
          .gradient-button:hover {
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
          }

          .gradient-text {
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            background-image: linear-gradient(to right, #6366f1, #8b5cf6, #d946ef);
            font-weight: 800;
          }

          .spinner {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 2px solid transparent;
            border-top-color: #fff;
            border-right-color: #fff;
            animation: spinner 0.8s linear infinite;
          }
          
          @keyframes spinner {
            to {
              transform: rotate(360deg);
            }
          }

          .input-gradient {
            background: rgba(255, 255, 255, 0.95);
            border: 2px solid rgba(99, 102, 241, 0.2);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(12px);
            transform-origin: center;
          }
          
          .input-gradient:focus {
            border-color: #8b5cf6;
            box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
            outline: none;
            transform: scale(1.005);
          }
          
          .input-gradient:hover {
            border-color: rgba(99, 102, 241, 0.4);
            background: rgba(255, 255, 255, 1);
          }

          @keyframes checkmark {
            0% { transform: scale(0); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }

          .requirement-check {
            animation: checkmark 0.3s ease-in-out forwards;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .reset-page-container {
            background-color: #f3f4f6;
            background-image: 
              radial-gradient(at 75% 15%, #d9d0f3 0px, transparent 40%),
              radial-gradient(at 25% 95%, #e1d3f9 0px, transparent 40%),
              radial-gradient(at 50% 50%, rgba(99, 102, 241, 0.05) 0px, transparent 70%);
            background-size: 200% 200%;
            background-repeat: no-repeat;
            background-attachment: fixed;
            position: relative;
            animation: gradientMove 15s ease infinite;
          }
          
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>

      {/* Header */}
      <header className="w-full flex justify-between items-center py-6 px-4 md:px-8">
        <div className="flex items-center space-x-2">
          <svg
            className="w-10 h-10 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m5.618-4.103a2.155 2.155 0 010 3.048l-2.484 2.484a2.155 2.155 0 01-3.048 0L9 12M12 2a10 10 0 100 20 10 10 0 000-20z"
            />
          </svg>
          <span className="text-2xl font-bold text-gray-900 logo-text">bugSnap</span>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="text-gray-500 hover:text-gray-900 transition-colors duration-200"
        >
          Back to Login
        </button>
      </header>

      {/* Main */}
      <main className="text-center p-8 max-w-5xl mx-auto space-y-12 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 transform hover:scale-[1.01] transition-all duration-300">
        <div className="fade-in">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Reset Your Password<br />
            <span className="gradient-text">with bugSnap.</span>
          </h1>
          <p className="mt-4 text-xl text-gray-600 font-medium leading-relaxed">
            Create a strong password to keep your account secure.
          </p>

          {/* Password Form */}
          <form onSubmit={handlePasswordChange} className="mt-8 max-w-md mx-auto">
            <div className="space-y-6">
              <div className="relative">
                  <input
                    type={showPassword.password ? "text" : "password"}
                    value={passwords.password}
                    onChange={(e) => {
                      setPasswords(prev => ({ ...prev, password: e.target.value }));
                      validatePassword(e.target.value);
                    }}
                    placeholder="New Password"
                    className="input-gradient w-full px-6 py-4 rounded-2xl text-lg pr-24 border-2 hover:border-indigo-300 focus:border-indigo-500"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => applySuggestedPassword()}
                    className="absolute right-14 top-1/2 transform -translate-y-1/2 text-indigo-600 hover:text-indigo-800 transition-all duration-200 bg-indigo-50 p-2 rounded-lg hover:bg-indigo-100 group"
                    title="Generate strong password"
                  >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, password: !prev.password }))}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword.password ? (
                      <svg className="w-6 h-6" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    )}
                  </button>
                </div>
                
              {/* Password Requirements Card */}
              <div className="mx-auto max-w-md bg-white/90 rounded-2xl shadow-lg border border-indigo-50 overflow-hidden transition-all duration-300 hover:shadow-xl">
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Password Requirements</h3>
                </div>
                <div className="px-6 py-4 space-y-3">
                  <div className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${validations.length ? 'text-green-600 bg-green-50 border border-green-100' : 'text-gray-500 bg-gray-50/50 border border-gray-100'}`}>
                    <span className={validations.length ? 'requirement-check text-green-500' : ''}>
                      {validations.length ? '✓' : '○'}
                    </span>
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${validations.uppercase ? 'text-green-600 bg-green-50 border border-green-100' : 'text-gray-500 bg-gray-50/50 border border-gray-100'}`}>
                    <span className={validations.uppercase ? 'requirement-check text-green-500' : ''}>
                      {validations.uppercase ? '✓' : '○'}
                    </span>
                    <span>One uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${validations.lowercase ? 'text-green-600 bg-green-50 border border-green-100' : 'text-gray-500 bg-gray-50/50 border border-gray-100'}`}>
                    <span className={validations.lowercase ? 'requirement-check text-green-500' : ''}>
                      {validations.lowercase ? '✓' : '○'}
                    </span>
                    <span>One lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${validations.number ? 'text-green-600 bg-green-50 border border-green-100' : 'text-gray-500 bg-gray-50/50 border border-gray-100'}`}>
                    <span className={validations.number ? 'requirement-check text-green-500' : ''}>
                      {validations.number ? '✓' : '○'}
                    </span>
                    <span>One number</span>
                  </div>
                  <div className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${validations.special ? 'text-green-600 bg-green-50 border border-green-100' : 'text-gray-500 bg-gray-50/50 border border-gray-100'}`}>
                    <span className={validations.special ? 'requirement-check text-green-500' : ''}>
                      {validations.special ? '✓' : '○'}
                    </span>
                    <span>One special character</span>
                  </div>
                </div>
              </div>

              <div className="relative mb-6">
                {passwords.confirmPassword && (
                  <div className={`text-sm mt-1 ${passwords.password === passwords.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                    {passwords.password === passwords.confirmPassword ? 
                      '✓ Passwords match' : 
                      '× Passwords do not match'}
                  </div>
                )}
                <input
                  type={showPassword.confirmPassword ? "text" : "password"}
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm New Password"
                  className={`input-gradient w-full px-6 py-4 rounded-2xl text-lg pr-12 border-2 hover:border-indigo-300 focus:border-indigo-500 ${passwords.confirmPassword && passwords.password !== passwords.confirmPassword ? 'border-red-300 bg-red-50/50' : ''}`}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword.confirmPassword ? (
                    <svg className="w-6 h-6" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>
              </div>

            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className={`gradient-button text-white font-semibold py-4 px-12 rounded-full text-lg transition-all duration-300 ${
                  loading ? "opacity-80 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <>
                    <div className="spinner" />
                    <span className="pulse-text">Resetting Password...</span>
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* About Section */}
        <section className="py-12 px-4 about-section">
          <h2 className="text-3xl sm:text-4xl font-bold">Secure Password Tips</h2>
          <p className="mt-4 text-lg text-gray-800 max-w-3xl mx-auto">
            Create a strong password that includes numbers, special characters, 
            and mixed case letters. Avoid using personal information or common words. 
            Your security is our priority at bugSnap.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm">
        &copy; 2025 bugSnap. All rights reserved.
      </footer>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ResetPasswordConfirm;