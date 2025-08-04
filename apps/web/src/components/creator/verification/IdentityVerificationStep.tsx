import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';

interface IdentityVerificationStepProps {
  data: any;
  updateData: (updates: any) => void;
  onNext: () => void;
  verificationId: string | null;
}

export default function IdentityVerificationStep({
  data,
  updateData,
  onNext,
  verificationId
}: IdentityVerificationStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitIdentityVerification = trpc.creatorVerification.submitIdentityVerification.useMutation();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!data.legalName.trim()) {
      newErrors.legalName = 'Legal name is required';
    } else if (data.legalName.length < 2) {
      newErrors.legalName = 'Legal name must be at least 2 characters';
    }

    if (!data.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const age = new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear();
      if (age < 18) {
        newErrors.dateOfBirth = 'You must be at least 18 years old';
      }
      if (age > 120) {
        newErrors.dateOfBirth = 'Please enter a valid date of birth';
      }
    }

    if (!data.governmentIdType) {
      newErrors.governmentIdType = 'ID type is required';
    }

    if (!data.governmentIdNumber.trim()) {
      newErrors.governmentIdNumber = 'ID number is required';
    } else if (data.governmentIdNumber.length < 6) {
      newErrors.governmentIdNumber = 'ID number must be at least 6 characters';
    }

    if (!data.governmentIdExpiryDate) {
      newErrors.governmentIdExpiryDate = 'ID expiry date is required';
    } else if (new Date(data.governmentIdExpiryDate) <= new Date()) {
      newErrors.governmentIdExpiryDate = 'ID must not be expired';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !verificationId) return;

    setIsSubmitting(true);
    try {
      const result = await submitIdentityVerification.mutateAsync({
        verificationId,
        legalName: data.legalName,
        dateOfBirth: new Date(data.dateOfBirth),
        governmentIdType: data.governmentIdType,
        governmentIdNumber: data.governmentIdNumber,
        governmentIdExpiryDate: new Date(data.governmentIdExpiryDate)
      });

      if (result.success) {
        onNext();
      } else {
        setErrors({ submit: 'Failed to submit identity verification' });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to submit identity verification' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    updateData({ [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Identity Verification</h2>
          <p className="text-gray-600">
            We need to verify your identity to ensure platform security and compliance with financial regulations.
          </p>
        </div>

        {/* Security Notice */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Your Information is Secure</h3>
              <p className="mt-1 text-sm text-blue-700">
                All personal information is encrypted and stored securely. We never share your data with third parties.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Legal Name */}
          <div>
            <label htmlFor="legalName" className="block text-sm font-medium text-gray-700 mb-2">
              Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="legalName"
              value={data.legalName}
              onChange={(e) => handleInputChange('legalName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.legalName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your full legal name as it appears on your ID"
            />
            {errors.legalName && (
              <p className="mt-1 text-sm text-red-600">{errors.legalName}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              This must match the name on your government-issued ID exactly
            </p>
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="dateOfBirth"
              value={formatDateForInput(data.dateOfBirth)}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value ? new Date(e.target.value) : null)}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.dateOfBirth && (
              <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              You must be at least 18 years old to become a creator
            </p>
          </div>

          {/* Government ID Type */}
          <div>
            <label htmlFor="governmentIdType" className="block text-sm font-medium text-gray-700 mb-2">
              Government ID Type <span className="text-red-500">*</span>
            </label>
            <select
              id="governmentIdType"
              value={data.governmentIdType}
              onChange={(e) => handleInputChange('governmentIdType', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.governmentIdType ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select ID type</option>
              <option value="drivers_license">Driver's License</option>
              <option value="passport">Passport</option>
              <option value="state_id">State ID</option>
              <option value="national_id">National ID</option>
            </select>
            {errors.governmentIdType && (
              <p className="mt-1 text-sm text-red-600">{errors.governmentIdType}</p>
            )}
          </div>

          {/* Government ID Number */}
          <div>
            <label htmlFor="governmentIdNumber" className="block text-sm font-medium text-gray-700 mb-2">
              ID Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="governmentIdNumber"
              value={data.governmentIdNumber}
              onChange={(e) => handleInputChange('governmentIdNumber', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.governmentIdNumber ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your ID number"
            />
            {errors.governmentIdNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.governmentIdNumber}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              This information is encrypted and securely stored
            </p>
          </div>

          {/* ID Expiry Date */}
          <div>
            <label htmlFor="governmentIdExpiryDate" className="block text-sm font-medium text-gray-700 mb-2">
              ID Expiry Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="governmentIdExpiryDate"
              value={formatDateForInput(data.governmentIdExpiryDate)}
              onChange={(e) => handleInputChange('governmentIdExpiryDate', e.target.value ? new Date(e.target.value) : null)}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.governmentIdExpiryDate ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.governmentIdExpiryDate && (
              <p className="mt-1 text-sm text-red-600">{errors.governmentIdExpiryDate}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Your ID must be valid and not expired
            </p>
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
          <div className="flex justify-end pt-6 border-t">
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
                  Continue to Documents
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