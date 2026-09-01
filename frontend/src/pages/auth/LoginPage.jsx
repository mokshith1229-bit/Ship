import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LuUser, 
  LuLock, 
  LuEye, 
  LuEyeOff, 
  LuChevronRight, 
  LuStar
} from 'react-icons/lu';
import { MdErrorOutline } from 'react-icons/md';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../hooks/useAuth';
import editedLogo from '../../assets/editedlogo.PNG';
import textLogo from '../../assets/HIRATE text.PNG';
import BackgroundVideoLoop from '../../components/BackgroundVideoLoop';
import './LoginPage.css';

// Module-level variable persists across client-side navigation but resets on hard refresh
let hasPlayedEntranceAnimation = false;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  
  const [shouldAnimate] = useState(!hasPlayedEntranceAnimation);
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (!hasPlayedEntranceAnimation) {
      hasPlayedEntranceAnimation = true;
    }
    
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.login(formData.username, formData.password);
      if (response.success && response.data) {
        login(response.data.token, response.data.user);
        navigate(from, { replace: true });
      } else {
        setError(response.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Network error or invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-page-container ${shouldAnimate ? 'play-cinematic-animation' : ''}`}>
      <BackgroundVideoLoop />
      {/* Dark Overlay Filter */}
      <div className="login-bg-overlay"></div>

      {/* Main Login Card */}
      <div className="login-card">
        {/* Content Wrapper to stay above background */}
        <div className="relative z-10 flex flex-col w-full h-full">
          {/* Logos & Header */}
          <div className="flex flex-col items-center mb-6">
          <img 
            src={editedLogo} 
            alt="HiRATE Logo" 
            className="anim-logo w-24 h-auto drop-shadow-[0_0_15px_rgba(92,184,92,0.3)] mb-2" 
          />
          <img 
            src={textLogo} 
            alt="HiRATE Text" 
            className="anim-textlogo w-48 h-auto mb-1" 
          />
          
          <div className="login-divider anim-divider"></div>
          
          <div className="tagline-container anim-tagline">
            <span>SAFE ROADS</span>
            <LuStar className="text-[8px] text-amber-400" />
            <span>STRONG NATION</span>
            <LuStar className="text-[8px] text-amber-400" />
            <span>BETTER FUTURE</span>
          </div>
          
          <h1 className="welcome-title anim-welcome">Welcome <span>Back!</span></h1>
          <p className="welcome-subtitle anim-subtitle">Sign in to continue to HiRATE</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-900/50 border border-red-500/50 rounded-lg p-3 flex items-start anim-input-user">
              <MdErrorOutline className="text-red-400 text-lg mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}
          
          {/* Username/Email Input */}
          <div className="login-input-group anim-input-user">
            <LuUser className="login-input-icon" />
            <input 
              type="text" 
              placeholder="Username / Email" 
              className="login-input"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
            />
          </div>

          {/* Password Input */}
          <div className="login-input-group anim-input-pass">
            <LuLock className="login-input-icon" />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              className="login-input"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
            <button 
              type="button" 
              className="login-input-eye"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <LuEyeOff /> : <LuEye />}
            </button>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="login-utilities anim-utils">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-password">Forgot Password?</a>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className={`btn-primary anim-btn ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
            {!loading && <LuChevronRight className="text-xl" />}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer anim-footer">
          Need help? <a href="#">Contact Administrator</a>
        </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
