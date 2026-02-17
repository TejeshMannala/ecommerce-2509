import React, { useState } from 'react';
import { Mail, MessageSquare, Phone, Send, User } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import axiosInstance from '../api/axiosInstance';

const initialForm = {
  name: '',
  email: '',
  mobile: '',
  subject: '',
  message: '',
};

const ContactUs = () => {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [historyEmail, setHistoryEmail] = useState('');
  const [historyMessages, setHistoryMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const validate = () => {
    const nextErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^\d{10,15}$/;

    if (!formData.name.trim()) nextErrors.name = 'Name is required';
    if (!emailRegex.test(formData.email.trim())) nextErrors.email = 'Valid email is required';
    if (!mobileRegex.test(formData.mobile.replace(/\D/g, ''))) {
      nextErrors.mobile = 'Valid mobile number is required';
    }
    if (!formData.subject.trim()) nextErrors.subject = 'Subject is required';
    if (formData.message.trim().length < 10) nextErrors.message = 'Message must be at least 10 characters';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (submitError) setSubmitError('');
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      setSubmitError('');

      const submittedEmail = formData.email.trim();
      await axiosInstance.post('/support-messages', {
        name: formData.name.trim(),
        email: submittedEmail,
        mobile: formData.mobile.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      setIsSubmitted(true);
      setHistoryEmail(submittedEmail);
      await loadSupportHistory(submittedEmail);
      setFormData(initialForm);
      setTimeout(() => {
        setIsSubmitted(false);
      }, 2000);
    } catch (error) {
      setSubmitError(error?.response?.data?.message || error?.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadSupportHistory = async (emailValue = historyEmail) => {
    const targetEmail = String(emailValue || '').trim();
    if (!targetEmail) {
      setHistoryError('Enter your email to view support replies');
      setHistoryMessages([]);
      return;
    }

    try {
      setHistoryLoading(true);
      setHistoryError('');
      const response = await axiosInstance.get('/support-messages', {
        params: { email: targetEmail },
      });
      const messages = Array.isArray(response?.data?.messages) ? response.data.messages : [];
      setHistoryMessages(messages);
    } catch (error) {
      setHistoryError(error?.response?.data?.message || error?.message || 'Failed to load support replies');
      setHistoryMessages([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-fresh-green text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="max-w-3xl text-sm sm:text-base md:text-lg text-primary-100 leading-relaxed">
            Have a question or need help with an order? Send us a message and our team will respond quickly.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            <aside className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Get in Touch</h2>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Mail className="h-4 w-4 text-primary-600" />
                support@freshmarket.com
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Phone className="h-4 w-4 text-primary-600" />
                +1 800 123 4567
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <MessageSquare className="h-4 w-4 text-primary-600" />
                Mon - Sat, 9:00 AM - 8:00 PM
              </div>
            </aside>

            <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
              {isSubmitted && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  Message sent successfully.
                </div>
              )}
              {submitError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Name"
                    value={formData.name}
                    onChange={(event) => handleChange('name', event.target.value)}
                    error={errors.name}
                    icon={<User className="h-4 w-4" />}
                    placeholder="Enter your name"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(event) => handleChange('email', event.target.value)}
                    error={errors.email}
                    icon={<Mail className="h-4 w-4" />}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Mobile Number"
                    type="tel"
                    value={formData.mobile}
                    onChange={(event) => handleChange('mobile', event.target.value)}
                    error={errors.mobile}
                    icon={<Phone className="h-4 w-4" />}
                    placeholder="Enter your mobile number"
                  />
                  <Input
                    label="Subject"
                    value={formData.subject}
                    onChange={(event) => handleChange('subject', event.target.value)}
                    error={errors.subject}
                    icon={<MessageSquare className="h-4 w-4" />}
                    placeholder="Enter subject"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(event) => handleChange('message', event.target.value)}
                    rows={5}
                    className={`w-full rounded-lg border px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 ${
                      errors.message
                        ? 'border-red-500 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    placeholder="Write your message..."
                  />
                  {errors.message && <p className="text-sm text-red-600">{errors.message}</p>}
                </div>

                <div className="pt-1">
                  <Button type="submit" variant="primary" className="w-full sm:w-auto" disabled={isSubmitting}>
                    <Send className="h-4 w-4" />
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </form>

              <div className="mt-8 border-t border-gray-200 pt-5">
                <h3 className="text-lg font-semibold text-gray-900">Your Support Replies</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Enter your email to check admin replies to your support messages.
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="email"
                    value={historyEmail}
                    onChange={(event) => setHistoryEmail(event.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full sm:w-auto"
                    onClick={() => loadSupportHistory()}
                    disabled={historyLoading}
                  >
                    {historyLoading ? 'Loading...' : 'Check Replies'}
                  </Button>
                </div>

                {historyError ? <p className="mt-3 text-sm text-red-600">{historyError}</p> : null}

                <div className="mt-4 space-y-3">
                  {historyMessages.length === 0 && !historyLoading && !historyError ? (
                    <p className="text-sm text-gray-500">No support history found for this email.</p>
                  ) : (
                    historyMessages.map((entry) => (
                      <div key={entry._id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm font-semibold text-gray-900">{entry.subject}</p>
                        <p className="mt-1 text-sm text-gray-700">{entry.message}</p>
                        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                          Status: {entry.status}
                        </p>
                        <div className="mt-2 rounded-md border border-primary-100 bg-primary-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Admin Reply</p>
                          <p className="mt-1 text-sm text-primary-900">
                            {entry.adminReply ? entry.adminReply : 'No reply yet. Our team will respond soon.'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;
