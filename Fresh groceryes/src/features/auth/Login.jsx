import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import CountdownTimer from './CountdownTimer';
import ForgotPasswordModal from './ForgotPasswordModal';
import { useAuth } from '../../hooks/useAuth';
import { getRedirectPathFromState, isAuthenticatedUser } from '../../utils/auth';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, error: authError, clearError, isAuthenticated, user } = useAuth();

  const isLoggedIn = isAuthenticatedUser({ isAuthenticated, user });
  const isLocked =
    Number.isFinite(Number(lockedUntil)) && Number(lockedUntil) > Date.now();
  const from = useMemo(() => getRedirectPathFromState(location.state, '/'), [location.state]);
  const redirectedFromProtectedPage = Boolean(location.state?.from);

  useEffect(() => {
    if (isLoggedIn) {
      navigate(from, { replace: true });
    }
  }, [from, isLoggedIn, navigate]);

  const validateForm = () => {
    const nextErrors = {};
    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail) {
      nextErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (errors[name] || errors.submit) {
      setErrors((previous) => ({
        ...previous,
        [name]: '',
        submit: '',
      }));
    }

    if (authError) {
      clearError();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || isLocked) {
      return;
    }

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    clearError();

    const email = formData.email.trim();
    const password = formData.password;
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      // Disable login button when backend lock is active (usually on 6th attempt).
      if (result.statusCode === 429 || (result.error && result.error.includes('Too many login attempts'))) {
        const backendLockTs = Number(result.lockedUntil);
        setLockedUntil(
          Number.isFinite(backendLockTs) ? backendLockTs : Date.now() + 15 * 60 * 1000
        );
        setErrors({});
      } else {
        setErrors((previous) => ({
          ...previous,
          submit: result.error || 'Authentication failed',
        }));
      }
      return;
    }

    navigate(from, { replace: true });
  };

  const submitError = errors.submit || (authError ? (typeof authError === 'string' ? authError : authError.message || 'Authentication failed') : null);

  return (
    <><div className="min-h-screen bg-gray-50 px-3 py-6 sm:px-6 sm:py-10 max-[350px]:px-2 max-[350px]:py-4">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-3 max-[350px]:mb-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>

        <div className="mb-5 text-center max-[350px]:mb-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-fresh-green max-[350px]:h-12 max-[350px]:w-12">
            <span className="text-lg font-bold text-white max-[350px]:text-base">FM</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 max-[350px]:text-xl">Welcome Back</h1>
          <p className="mt-1 text-sm text-gray-600 max-[350px]:text-xs">Sign in to continue shopping</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 max-[350px]:rounded-xl max-[350px]:p-3">
          {redirectedFromProtectedPage && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm text-blue-700">Please sign in to continue with protected actions.</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="Enter your email"
              autoComplete="email"
              icon={<Mail className="h-4 w-4" />} />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Enter your password"
              autoComplete="current-password"
              icon={<Lock className="h-4 w-4" />}
              endAdornment={<button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>} />

            {submitError && !isLocked && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            {isLocked && (
              <CountdownTimer
                lockedUntil={lockedUntil}
                onTimerComplete={() => setLockedUntil(null)} />
            )}

            <Button type="submit" fullWidth size="md" disabled={isSubmitting || isLocked}>
              {isSubmitting ? 'Please wait...' : 'Log In'}
            </Button>
          </form>

          <div className="mt-4 flex justify-between gap-2 text-sm max-[350px]:mt-3 max-[350px]:flex-col max-[350px]:text-xs">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-left text-primary-600 hover:text-primary-700 font-medium"
            >
              Forgot Password?
            </button>
            <button
              type="button"
              onClick={() => navigate('/register', { replace: true })}
              className="text-left text-primary-600 hover:text-primary-700 font-medium"
            >
              Don't have an account? Sign Up
            </button>
          </div>
        </div>
      </div>
    </div><ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)} /></>
  
  );
};

export default Login;
