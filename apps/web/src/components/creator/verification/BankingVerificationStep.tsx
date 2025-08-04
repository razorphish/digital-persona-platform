import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';

interface BankingVerificationStepProps {
  data: any;
  updateData: (updates: any) => void;
  onNext: () => void;
  onPrev: () => void;
  verificationId: string | null;
}

export default function BankingVerificationStep({
  data,
  updateData,
  onNext,
  onPrev,
  verificationId
}: BankingVerificationStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  const submitBankingVerification = trpc.creatorVerification.submitBankingVerification.useMutation();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!data.bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }

    if (!data.bankAccountType) {
      newErrors.bankAccountType = 'Account type is required';
    }

    if (!data.routingNumber.trim()) {
      newErrors.routingNumber = 'Routing number is required';
    } else if (!/^\d{9}$/.test(data.routingNumber)) {
      newErrors.routingNumber = 'Routing number must be exactly 9 digits';
    }

    if (!data.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (data.accountNumber.length < 4 || data.accountNumber.length > 20) {
      newErrors.accountNumber = 'Account number must be between 4 and 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !verificationId) return;

    setIsSubmitting(true);
    try {
      const result = await submitBankingVerification.mutateAsync({
        verificationId,
        bankName: data.bankName,
        bankAccountType: data.bankAccountType,
        routingNumber: data.routingNumber,
        accountNumber: data.accountNumber
      });

      if (result.success) {
        onNext();
      } else {
        setErrors({ submit: 'Failed to submit banking verification' });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to submit banking verification' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    updateData({ [field]: value });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Banking Information</h2>
          <p className="text-gray-600">
            We need your banking information to send you payments. All data is encrypted and secure.
          </p>
        </div>

        {/* Security Notice */}
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Bank-Level Security</h3>
              <p className="mt-1 text-sm text-green-700">
                Your banking information is encrypted with the same security standards used by major banks. 
                We only use this information to send you payments.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bank Name */}
          <div>
            <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-2">
              Bank Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="bankName"
              value={data.bankName}
              onChange={(e) => handleInputChange('bankName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.bankName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Chase Bank, Bank of America, Wells Fargo, etc."
            />
            {errors.bankName && (
              <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>
            )}
          </div>

          {/* Account Type */}
          <div>
            <label htmlFor="bankAccountType" className="block text-sm font-medium text-gray-700 mb-2">
              Account Type <span className="text-red-500">*</span>
            </label>
            <select
              id="bankAccountType"
              value={data.bankAccountType}
              onChange={(e) => handleInputChange('bankAccountType', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.bankAccountType ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select account type</option>
              <option value="checking">Checking Account</option>
              <option value="savings">Savings Account</option>
            </select>
            {errors.bankAccountType && (
              <p className="mt-1 text-sm text-red-600">{errors.bankAccountType}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Most creators use checking accounts for faster transfers
            </p>
          </div>

          {/* Routing Number */}
          <div>
            <label htmlFor="routingNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Routing Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="routingNumber"
              value={data.routingNumber}
              onChange={(e) => handleInputChange('routingNumber', e.target.value.replace(/\D/g, '').slice(0, 9))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.routingNumber ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="123456789"
              maxLength={9}
            />
            {errors.routingNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.routingNumber}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              9-digit number found on your checks or bank statements
            </p>
          </div>

          {/* Account Number */}
          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Account Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showAccountNumber ? "text" : "password"}
                id="accountNumber"
                value={data.accountNumber}
                onChange={(e) => handleInputChange('accountNumber', e.target.value.replace(/\D/g, ''))}
                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.accountNumber ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Your account number"
                maxLength={20}
              />
              <button
                type="button"
                onClick={() => setShowAccountNumber(!showAccountNumber)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showAccountNumber ? (
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.05 8.05m1.828 1.828l4.242 4.242m0 0L16.95 15.95M14.12 14.12l1.828 1.828m-4.242-4.242a3 3 0 114.243 4.243m-4.243-4.243L8.05 8.05" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.accountNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Found on your checks, bank statements, or online banking
            </p>
          </div>

          {/* Payout Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">💰 Payout Information</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• <strong>Revenue Share:</strong> You keep 97% of all subscription revenue</p>
              <p>• <strong>Payout Schedule:</strong> Weekly on Fridays</p>
              <p>• <strong>Minimum Payout:</strong> $10 (earnings below this carry over)</p>
              <p>• <strong>Processing Time:</strong> 2-5 business days to your account</p>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{errors.submit}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <button
              type="button"
              onClick={onPrev}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  Continue to Tax Info
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}