import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  CreditCard,
  MapPin,
  Truck,
  CheckCircle,
  User,
  Mail,
  Phone,
  Home,
  ShoppingBag,
  Smartphone,
  Wallet,
  CreditCard as CreditCardIcon,
  DollarSign,
  AlertCircle,
  Wifi,
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import PaymentSuccessModal from '../components/payment/PaymentSuccessModal';
import { clearCart, clearCartAsync } from '../redux/slices/cartSlice';
import { createOrderAsync } from '../redux/slices/orderSlice';

const PaymentMethodOption = ({ id, label, icon, selected, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`flex w-full min-w-0 items-center gap-2 p-3 sm:gap-3 sm:p-4 border-2 rounded-lg transition-all duration-200 ${
      selected
        ? 'border-primary-600 bg-primary-50 text-primary-700'
        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
    }`}
  >
    <div
      className={`p-2 rounded-full ${
        selected ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {icon}
    </div>
    <span className="min-w-0 break-words text-left text-sm font-medium leading-tight sm:text-base">{label}</span>
    {selected && (
      <CheckCircle className="ml-auto h-4 w-4 shrink-0 text-primary-600 sm:h-5 sm:w-5" />
    )}
  </button>
);

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const cartStateItems = useSelector((state) => state.cart.items);
  const authUser = useSelector((state) => state.auth.user);

  const storedUser = useMemo(() => {
    try {
      const rawUser = localStorage.getItem('user');
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  }, []);

  const currentUser = authUser || storedUser || {};

  const cartItems = cartStateItems.map((item) => ({
    ...item,
    id: item.productId,
    image: item.image || '/api/placeholder/100/100',
  }));

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.08;
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + tax + shipping;
    return { subtotal, tax, shipping, total };
  };

  const totals = calculateTotals();

  const [shippingInfo, setShippingInfo] = useState({
    fullName: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
  });
  const [shippingErrors, setShippingErrors] = useState({});
  const [shippingFormError, setShippingFormError] = useState('');

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [upiId, setUpiId] = useState('');
  const [phonePeNumber, setPhonePeNumber] = useState('');
  const [googlePayNumber, setGooglePayNumber] = useState('');
  const [paytmNumber, setPaytmNumber] = useState('');
  const [amazonPayNumber, setAmazonPayNumber] = useState('');
  const [showPaymentMessage, setShowPaymentMessage] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentMessageType, setPaymentMessageType] = useState('success'); // 'success', 'error', 'warning'
  const [showOrderConfirmModal, setShowOrderConfirmModal] = useState(false);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [lastCreatedOrderId, setLastCreatedOrderId] = useState('');
  const [lastCreatedOrderDisplayId, setLastCreatedOrderDisplayId] = useState('');

  useEffect(() => {
    if (!showPaymentSuccessModal || !lastCreatedOrderId) {
      return undefined;
    }

    const redirectTimer = setTimeout(() => {
      setShowPaymentSuccessModal(false);
      setShowOrderConfirmModal(false);
      navigate(`/my-orders/${lastCreatedOrderId}/track`, { state: { fromSuccess: true } });
    }, 7000);

    return () => clearTimeout(redirectTimer);
  }, [lastCreatedOrderId, navigate, showPaymentSuccessModal]);

  const validateShippingInfo = () => {
    const trimmed = {
      fullName: shippingInfo.fullName.trim(),
      email: shippingInfo.email.trim(),
      phone: shippingInfo.phone.trim(),
      address: shippingInfo.address.trim(),
      city: shippingInfo.city.trim(),
      state: shippingInfo.state.trim(),
      zipCode: shippingInfo.zipCode.trim(),
      country: shippingInfo.country.trim(),
    };

    const nextErrors = {};
    const textOnlyRegex = /^[a-zA-Z\s.-]{2,50}$/;
    const zipRegex = /^\d{5,6}$/;
    const addressRegex = /^[a-zA-Z0-9\s,./#-]{8,120}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = trimmed.phone.replace(/\D/g, '');

    if (trimmed.fullName.length < 2) {
      nextErrors.fullName = 'Please enter your full name';
    }
    if (!emailRegex.test(trimmed.email)) {
      nextErrors.email = 'Please enter a valid email address';
    }
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      nextErrors.phone = 'Please enter a valid phone number';
    }
    if (!addressRegex.test(trimmed.address)) {
      nextErrors.address = 'Please enter a valid address';
    }
    if (!textOnlyRegex.test(trimmed.city)) {
      nextErrors.city = 'Please enter a valid city';
    }
    if (!textOnlyRegex.test(trimmed.state)) {
      nextErrors.state = 'Please enter a valid state';
    }
    if (!zipRegex.test(trimmed.zipCode)) {
      nextErrors.zipCode = 'Please enter a valid ZIP/PIN code';
    }
    if (!textOnlyRegex.test(trimmed.country)) {
      nextErrors.country = 'Please enter a valid country';
    }

    setShippingErrors(nextErrors);

    const hasAddressValidationError =
      nextErrors.address ||
      nextErrors.city ||
      nextErrors.state ||
      nextErrors.zipCode ||
      nextErrors.country;

    if (hasAddressValidationError) {
      setShippingFormError(
        'These credentials are wrong. Please enter valid address, pin, state, city and country.'
      );
    } else {
      setShippingFormError('');
    }

    return Object.keys(nextErrors).length === 0;
  };

  const handleShippingChange = (field, value) => {
    setShippingInfo((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (shippingErrors[field]) {
      setShippingErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }

    if (shippingFormError) {
      setShippingFormError('');
    }
  };

  const handleShippingSubmit = (event) => {
    event.preventDefault();
    if (!validateShippingInfo()) {
      return;
    }
    setStep(2);
  };

  const handlePaymentSubmit = (event) => {
    event.preventDefault();
    setStep(3);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  const handlePlaceOrder = async () => {
    if (!cartItems.length) {
      return;
    }

    setIsLoading(true);
    setShowPaymentMessage(false);

    try {
      const normalizedZipCode = (() => {
        const raw = String(shippingInfo.zipCode || '').trim();
        const digitsOnly = raw.replace(/\D/g, '');
        // Compatibility for older backend ZIP validator expecting 5 digits or 5-4 format.
        if (digitsOnly.length === 6) {
          return digitsOnly.slice(0, 5);
        }
        return raw;
      })();

      const safeShippingInfo = {
        ...shippingInfo,
        zipCode: normalizedZipCode,
      };

      const paymentStatus = paymentMethod === 'cod' ? 'pending' : 'paid';
      const paymentDetails = {
        method: paymentMethod,
        status: paymentStatus,
      };

      // Add method-specific details
      if (paymentMethod === 'card') {
        paymentDetails.cardLast4 = paymentInfo.cardNumber.slice(-4);
        paymentDetails.cardholderName = paymentInfo.cardholderName;
      } else if (paymentMethod === 'upi') {
        paymentDetails.upiId = upiId;
      } else if (paymentMethod === 'phonepe') {
        paymentDetails.phonePeNumber = phonePeNumber;
      } else if (paymentMethod === 'googlepay') {
        paymentDetails.googlePayNumber = googlePayNumber;
      } else if (paymentMethod === 'paytm') {
        paymentDetails.paytmNumber = paytmNumber;
      } else if (paymentMethod === 'amazonpay') {
        paymentDetails.amazonPayNumber = amazonPayNumber;
      }

      const createdOrder = await dispatch(
        createOrderAsync({
          status: paymentMethod === 'cod' ? 'pending' : 'processing',
          total: Number(totals.total.toFixed(2)),
          shippingInfo: safeShippingInfo,
          payment: paymentDetails,
          items: cartItems.map((item) => ({
            id: item.productId || item.id,
            productId: item.productId || item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
        })
      ).unwrap();

      // Show success modal instead of message
      setLastCreatedOrderId(createdOrder.id);
      setLastCreatedOrderDisplayId(createdOrder.orderId || createdOrder.id);
      setShowPaymentSuccessModal(true);
      setShowPaymentMessage(false);

      try {
        await dispatch(clearCartAsync()).unwrap();
      } catch {
        dispatch(clearCart());
      }
      setIsLoading(false);

    } catch (error) {
      // Show error message
      setShowOrderConfirmModal(false);
      setPaymentMessage(error || 'Payment failed. Please try again later.');
      setPaymentMessageType('error');
      setShowPaymentMessage(true);
      setIsLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-8 w-8 text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No products in cart</h1>
          <p className="text-gray-600 mb-6">Add products to your cart before checkout.</p>
          <Button variant="primary" onClick={() => navigate('/products')}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <div className="mx-auto max-w-4xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-8">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center gap-2 sm:gap-3">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs sm:h-10 sm:w-10 sm:text-base ${
                    step >= stepNum ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step >= stepNum ? <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6" /> : stepNum}
                </div>
                <div className="text-xs font-medium sm:text-sm">
                  {stepNum === 1 && 'Shipping'}
                  {stepNum === 2 && 'Payment'}
                  {stepNum === 3 && 'Review'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <MapPin className="h-6 w-6 text-primary-600" />
                  <h2 className="text-xl font-semibold">Shipping Information</h2>
                </div>

                <form onSubmit={handleShippingSubmit} className="space-y-4">
                  {shippingFormError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {shippingFormError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      type="text"
                      name="fullName"
                      value={shippingInfo.fullName}
                      onChange={(event) => handleShippingChange('fullName', event.target.value)}
                      error={shippingErrors.fullName}
                      required
                      icon={<User className="h-5 w-5 text-gray-400" />}
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      name="email"
                      value={shippingInfo.email}
                      onChange={(event) => handleShippingChange('email', event.target.value)}
                      error={shippingErrors.email}
                      required
                      icon={<Mail className="h-5 w-5 text-gray-400" />}
                    />
                  </div>

                  <Input
                    label="Phone Number"
                    type="tel"
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={(event) => handleShippingChange('phone', event.target.value)}
                    error={shippingErrors.phone}
                    required
                    icon={<Phone className="h-5 w-5 text-gray-400" />}
                  />

                  <Input
                    label="Address"
                    type="text"
                    name="address"
                    value={shippingInfo.address}
                    onChange={(event) => handleShippingChange('address', event.target.value)}
                    error={shippingErrors.address}
                    required
                    icon={<Home className="h-5 w-5 text-gray-400" />}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="City"
                      type="text"
                      name="city"
                      value={shippingInfo.city}
                      onChange={(event) => handleShippingChange('city', event.target.value)}
                      error={shippingErrors.city}
                      required
                    />
                    <Input
                      label="State"
                      type="text"
                      name="state"
                      value={shippingInfo.state}
                      onChange={(event) => handleShippingChange('state', event.target.value)}
                      error={shippingErrors.state}
                      required
                    />
                    <Input
                      label="ZIP Code"
                      type="text"
                      name="zipCode"
                      value={shippingInfo.zipCode}
                      onChange={(event) => handleShippingChange('zipCode', event.target.value)}
                      error={shippingErrors.zipCode}
                      required
                    />
                  </div>

                  <Input
                    label="Country"
                    type="text"
                    name="country"
                    value={shippingInfo.country}
                    onChange={(event) => handleShippingChange('country', event.target.value)}
                    error={shippingErrors.country}
                    required
                  />

                  <div className="flex justify-end pt-4">
                    <Button type="submit" variant="primary">
                      Continue to Payment
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <CreditCard className="h-6 w-6 text-primary-600" />
                  <h2 className="text-xl font-semibold">Payment Method</h2>
                </div>

                <div className="mb-6 space-y-4 overflow-x-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PaymentMethodOption
                      id="card"
                      label="Credit/Debit Card"
                      icon={<CreditCardIcon className="h-6 w-6" />}
                      selected={paymentMethod === 'card'}
                      onSelect={() => setPaymentMethod('card')}
                    />
                    <PaymentMethodOption
                      id="upi"
                      label="UPI Payment"
                      icon={<Smartphone className="h-6 w-6" />}
                      selected={paymentMethod === 'upi'}
                      onSelect={() => setPaymentMethod('upi')}
                    />
                    <PaymentMethodOption
                      id="phonepe"
                      label="PhonePe"
                      icon={<Smartphone className="h-6 w-6" />}
                      selected={paymentMethod === 'phonepe'}
                      onSelect={() => setPaymentMethod('phonepe')}
                    />
                    <PaymentMethodOption
                      id="googlepay"
                      label="Google Pay"
                      icon={<Wallet className="h-6 w-6" />}
                      selected={paymentMethod === 'googlepay'}
                      onSelect={() => setPaymentMethod('googlepay')}
                    />
                    <PaymentMethodOption
                      id="paytm"
                      label="Paytm"
                      icon={<Smartphone className="h-6 w-6" />}
                      selected={paymentMethod === 'paytm'}
                      onSelect={() => setPaymentMethod('paytm')}
                    />
                    <PaymentMethodOption
                      id="amazonpay"
                      label="Amazon Pay"
                      icon={<Wallet className="h-6 w-6" />}
                      selected={paymentMethod === 'amazonpay'}
                      onSelect={() => setPaymentMethod('amazonpay')}
                    />
                    <PaymentMethodOption
                      id="cod"
                      label="Cash on Delivery"
                      icon={<DollarSign className="h-6 w-6" />}
                      selected={paymentMethod === 'cod'}
                      onSelect={() => setPaymentMethod('cod')}
                    />
                  </div>
                </div>

                {paymentMethod === 'card' && (
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <Input
                      label="Card Number"
                      type="text"
                      name="cardNumber"
                      value={paymentInfo.cardNumber}
                      onChange={(event) =>
                        setPaymentInfo({ ...paymentInfo, cardNumber: event.target.value })
                      }
                      placeholder="1234 5678 9012 3456"
                      required
                      icon={<CreditCard className="h-5 w-5 text-gray-400" />}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Expiry Date"
                        type="text"
                        name="expiryDate"
                        value={paymentInfo.expiryDate}
                        onChange={(event) =>
                          setPaymentInfo({ ...paymentInfo, expiryDate: event.target.value })
                        }
                        placeholder="MM/YY"
                        required
                      />
                      <Input
                        label="CVV"
                        type="text"
                        name="cvv"
                        value={paymentInfo.cvv}
                        onChange={(event) =>
                          setPaymentInfo({ ...paymentInfo, cvv: event.target.value })
                        }
                        placeholder="123"
                        required
                      />
                    </div>

                    <Input
                      label="Cardholder Name"
                      type="text"
                      name="cardholderName"
                      value={paymentInfo.cardholderName}
                      onChange={(event) =>
                        setPaymentInfo({ ...paymentInfo, cardholderName: event.target.value })
                      }
                      required
                    />
                  </form>
                )}

                {paymentMethod === 'upi' && (
                  <div className="space-y-4">
                    <Input
                      label="UPI ID"
                      type="text"
                      value={upiId}
                      onChange={(event) => setUpiId(event.target.value)}
                      placeholder="yourname@upi"
                      required
                      icon={<Smartphone className="h-5 w-5 text-gray-400" />}
                    />
                    {!upiId && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <Smartphone className="h-6 w-6 text-blue-600" />
                          <div>
                            <h4 className="font-medium text-blue-900">Don't have a UPI app?</h4>
                            <p className="text-sm text-blue-600">
                              Use our website UPI ID: <strong>freshmarket@upi</strong>
                            </p>
                            <p className="text-sm text-blue-600 mt-2">
                              Send the payment amount to this UPI ID and complete your order.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'phonepe' && (
                  <div className="space-y-4">
                    <Input
                      label="PhonePe Number"
                      type="tel"
                      value={phonePeNumber}
                      onChange={(event) => setPhonePeNumber(event.target.value)}
                      placeholder="+91 9876543210"
                      required
                      icon={<Smartphone className="h-5 w-5 text-gray-400" />}
                    />
                  </div>
                )}

                {paymentMethod === 'googlepay' && (
                  <div className="space-y-4">
                    <Input
                      label="Google Pay Number"
                      type="tel"
                      value={googlePayNumber}
                      onChange={(event) => setGooglePayNumber(event.target.value)}
                      placeholder="+91 9876543210"
                      required
                      icon={<Wallet className="h-5 w-5 text-gray-400" />}
                    />
                  </div>
                )}

                {paymentMethod === 'paytm' && (
                  <div className="space-y-4">
                    <Input
                      label="Paytm Number"
                      type="tel"
                      value={paytmNumber}
                      onChange={(event) => setPaytmNumber(event.target.value)}
                      placeholder="+91 9876543210"
                      required
                      icon={<Smartphone className="h-5 w-5 text-gray-400" />}
                    />
                  </div>
                )}

                {paymentMethod === 'amazonpay' && (
                  <div className="space-y-4">
                    <Input
                      label="Amazon Pay Number"
                      type="tel"
                      value={amazonPayNumber}
                      onChange={(event) => setAmazonPayNumber(event.target.value)}
                      placeholder="+91 9876543210"
                      required
                      icon={<Wallet className="h-5 w-5 text-gray-400" />}
                    />
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-6 w-6 text-green-600" />
                      <div>
                        <h4 className="font-medium text-green-900">Cash on Delivery</h4>
                        <p className="text-sm text-green-600">
                          Pay with cash when your order is delivered
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    Back to Shipping
                  </Button>
                  <Button type="submit" variant="primary" onClick={handlePaymentSubmit}>
                    Continue to Review
                  </Button>
                </div>
              </div>
            )}

            {showPaymentMessage && (
              <div className={`mb-6 p-4 rounded-lg border-l-4 ${
                paymentMessageType === 'success' 
                  ? 'bg-green-50 border-green-500 text-green-800' 
                  : paymentMessageType === 'error'
                  ? 'bg-red-50 border-red-500 text-red-800'
                  : 'bg-yellow-50 border-yellow-500 text-yellow-800'
              }`}>
                <div className="flex items-center space-x-3">
                  {paymentMessageType === 'success' && (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                  {paymentMessageType === 'error' && (
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  )}
                  {paymentMessageType === 'warning' && (
                    <Wifi className="h-6 w-6 text-yellow-600" />
                  )}
                  <div>
                    <p className="font-medium">{paymentMessage}</p>
                  </div>
                </div>
              </div>
            )}

            <PaymentSuccessModal
              isOpen={showOrderConfirmModal || showPaymentSuccessModal}
              mode={showPaymentSuccessModal ? 'success' : 'confirm'}
              onClose={() => {
                if (showPaymentSuccessModal) {
                  setShowPaymentSuccessModal(false);
                  setShowOrderConfirmModal(false);
                  navigate('/my-orders');
                } else {
                  setShowOrderConfirmModal(false);
                }
              }}
              onConfirm={handlePlaceOrder}
              isLoading={isLoading}
              onViewOrder={(orderId) => {
                setShowPaymentSuccessModal(false);
                setShowOrderConfirmModal(false);
                navigate(`/my-orders/${orderId}/track`, { state: { fromSuccess: true } });
              }}
              orderDetails={{
                orderId: lastCreatedOrderDisplayId || lastCreatedOrderId,
                orderInternalId: lastCreatedOrderId,
                total: totals.total,
                paymentMethod: paymentMethod
              }}
            />

            {step === 3 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Truck className="h-6 w-6 text-primary-600" />
                  <h2 className="text-xl font-semibold">Review Order</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Shipping to:</h3>
                    <p className="text-gray-600">{shippingInfo.fullName}</p>
                    <p className="text-gray-600">{shippingInfo.address}</p>
                    <p className="text-gray-600">
                      {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}
                    </p>
                    <p className="text-gray-600">{shippingInfo.country}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Payment method:</h3>
                    {paymentMethod === 'card' && (
                      <>
                        <p className="text-gray-600">
                          Credit/Debit Card ending in {paymentInfo.cardNumber.slice(-4) || '0000'}
                        </p>
                        <p className="text-gray-600">Cardholder: {paymentInfo.cardholderName}</p>
                      </>
                    )}
                    {paymentMethod === 'upi' && (
                      <p className="text-gray-600">UPI Payment: {upiId}</p>
                    )}
                    {paymentMethod === 'phonepe' && (
                      <p className="text-gray-600">PhonePe: {phonePeNumber}</p>
                    )}
                    {paymentMethod === 'googlepay' && (
                      <p className="text-gray-600">Google Pay: {googlePayNumber}</p>
                    )}
                    {paymentMethod === 'paytm' && (
                      <p className="text-gray-600">Paytm: {paytmNumber}</p>
                    )}
                    {paymentMethod === 'amazonpay' && (
                      <p className="text-gray-600">Amazon Pay: {amazonPayNumber}</p>
                    )}
                    {paymentMethod === 'cod' && (
                      <p className="text-gray-600">Cash on Delivery</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Order Summary</h3>
                    <div className="space-y-2">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-2">
                          <span className="min-w-0 break-words text-gray-600">
                            {item.name} x {item.quantity}
                          </span>
                          <span className="shrink-0 font-medium">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span>{formatPrice(totals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Shipping</span>
                          <span>{formatPrice(totals.shipping)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax</span>
                          <span>{formatPrice(totals.tax)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                          <span>Total</span>
                          <span>{formatPrice(totals.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="ghost" onClick={() => setStep(2)}>
                      Back to Payment
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => setShowOrderConfirmModal(true)}
                      disabled={isLoading}
                      size="lg"
                    >
                      {isLoading ? 'Processing...' : `Place Order - ${formatPrice(totals.total)}`}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-2 text-sm">
                    <span className="min-w-0 break-words text-gray-600">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Shipping</span>
                  <span>{formatPrice(totals.shipping)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Tax</span>
                  <span>{formatPrice(totals.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span>{formatPrice(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
