import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';

interface AddressVerificationStepProps {
  data: any;
  updateData: (updates: any) => void;
  onNext: () => void;
  onPrev: () => void;
  verificationId: string | null;
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
];

export default function AddressVerificationStep({
  data,
  updateData,
  onNext,
  onPrev,
  verificationId
}: AddressVerificationStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitAddressVerification = trpc.creatorVerification.submitAddressVerification.useMutation();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!data.addressLine1.trim()) {
      newErrors.addressLine1 = 'Street address is required';
    } else if (data.addressLine1.length < 5) {
      newErrors.addressLine1 = 'Please enter a complete street address';
    }

    if (!data.city.trim()) {
      newErrors.city = 'City is required';
    } else if (data.city.length < 2) {
      newErrors.city = 'Please enter a valid city name';
    }

    if (!data.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!data.postalCode.trim()) {
      newErrors.postalCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(data.postalCode)) {
      newErrors.postalCode = 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !verificationId) return;

    setIsSubmitting(true);
    try {
      const result = await submitAddressVerification.mutateAsync({
        verificationId,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country
      });

      if (result.success) {
        onNext();
      } else {
        setErrors({ submit: 'Failed to submit address verification' });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to submit address verification' });
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Address Verification</h2>
          <p className="text-gray-600">
            Please provide your current residential address. This helps us comply with financial regulations.
          </p>
        </div>

        {/* Address Requirements Notice */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Address Requirements</h3>
              <p className="mt-1 text-sm text-blue-700">
                Your address must match the one on your uploaded proof of address document. 
                We currently only support US addresses.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Street Address */}
          <div>
            <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-2">
              Street Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="addressLine1"
              value={data.addressLine1}
              onChange={(e) => handleInputChange('addressLine1', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.addressLine1 ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="123 Main Street"
            />
            {errors.addressLine1 && (
              <p className="mt-1 text-sm text-red-600">{errors.addressLine1}</p>
            )}
          </div>

          {/* Address Line 2 */}
          <div>
            <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-2">
              Apartment, Suite, etc. (Optional)
            </label>
            <input
              type="text"
              id="addressLine2"
              value={data.addressLine2}
              onChange={(e) => handleInputChange('addressLine2', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Apt 4B, Suite 200, etc."
            />
          </div>

          {/* City, State, ZIP Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* City */}
            <div className="md:col-span-1">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                value={data.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.city ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="New York"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">{errors.city}</p>
              )}
            </div>

            {/* State */}
            <div className="md:col-span-1">
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <select
                id="state"
                value={data.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.state ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select State</option>
                {US_STATES.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="mt-1 text-sm text-red-600">{errors.state}</p>
              )}
            </div>

            {/* ZIP Code */}
            <div className="md:col-span-1">
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                ZIP Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="postalCode"
                value={data.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.postalCode ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="12345"
                maxLength={10}
              />
              {errors.postalCode && (
                <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
              )}
            </div>
          </div>

          {/* Country (Fixed to US) */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <input
              type="text"
              id="country"
              value="United States"
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              We currently only support US addresses for creator verification
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
                  Continue to Banking
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