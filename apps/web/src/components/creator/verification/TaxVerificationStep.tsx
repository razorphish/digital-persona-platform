import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';

interface TaxVerificationStepProps {
  data: any;
  updateData: (updates: any) => void;
  onNext: () => void;
  onPrev: () => void;
  verificationId: string | null;
}

export default function TaxVerificationStep({
  data,
  updateData,
  onNext,
  onPrev,
  verificationId
}: TaxVerificationStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTaxId, setShowTaxId] = useState(false);

  const submitTaxVerification = trpc.creatorVerification.submitTaxVerification.useMutation();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!data.taxIdType) {
      newErrors.taxIdType = 'Tax ID type is required';
    }

    if (!data.taxId.trim()) {
      newErrors.taxId = 'Tax ID is required';
    } else {
      const cleanTaxId = data.taxId.replace(/\D/g, '');
      if (data.taxIdType === 'ssn' && cleanTaxId.length !== 9) {
        newErrors.taxId = 'SSN must be 9 digits';
      } else if (data.taxIdType === 'ein' && cleanTaxId.length !== 9) {
        newErrors.taxId = 'EIN must be 9 digits';
      } else if (data.taxIdType === 'itin' && cleanTaxId.length !== 9) {
        newErrors.taxId = 'ITIN must be 9 digits';
      }
    }

    if (!data.w9FormSubmitted) {
      newErrors.w9FormSubmitted = 'You must acknowledge tax form requirements';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !verificationId) return;

    setIsSubmitting(true);
    try {
      const result = await submitTaxVerification.mutateAsync({
        verificationId,
        taxIdType: data.taxIdType,
        taxId: data.taxId,
        w9FormSubmitted: data.w9FormSubmitted
      });

      if (result.success) {
        onNext();
      } else {
        setErrors({ submit: 'Failed to submit tax verification' });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to submit tax verification' });
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

  const formatTaxId = (value: string, type: string) => {
    const digits = value.replace(/\D/g, '');
    if (type === 'ssn') {
      if (digits.length <= 3) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
    } else if (type === 'ein') {
      if (digits.length <= 2) return digits;
      return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`;
    }
    return digits;
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tax Information</h2>
          <p className="text-gray-600">
            We need your tax information to comply with IRS requirements for payment processing.
          </p>
        </div>

        {/* Tax Compliance Notice */}
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">IRS Requirements</h3>
              <p className="mt-1 text-sm text-amber-700">
                The IRS requires us to collect tax information from creators who earn over $600 per year. 
                We'll send you a 1099 form at the end of the tax year.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tax ID Type */}
          <div>
            <label htmlFor="taxIdType" className="block text-sm font-medium text-gray-700 mb-2">
              Tax ID Type <span className="text-red-500">*</span>
            </label>
            <select
              id="taxIdType"
              value={data.taxIdType}
              onChange={(e) => handleInputChange('taxIdType', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.taxIdType ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select tax ID type</option>
              <option value="ssn">Social Security Number (SSN)</option>
              <option value="ein">Employer Identification Number (EIN)</option>
              <option value="itin">Individual Taxpayer Identification Number (ITIN)</option>
            </select>
            {errors.taxIdType && (
              <p className="mt-1 text-sm text-red-600">{errors.taxIdType}</p>
            )}
            <div className="mt-2 text-xs text-gray-500">
              <p><strong>SSN:</strong> For individual creators (most common)</p>
              <p><strong>EIN:</strong> For business entities or LLCs</p>
              <p><strong>ITIN:</strong> For non-resident aliens</p>
            </div>
          </div>

          {/* Tax ID Number */}
          <div>
            <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-2">
              {data.taxIdType === 'ssn' ? 'Social Security Number' :
               data.taxIdType === 'ein' ? 'EIN Number' :
               data.taxIdType === 'itin' ? 'ITIN Number' :
               'Tax ID Number'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showTaxId ? "text" : "password"}
                id="taxId"
                value={formatTaxId(data.taxId, data.taxIdType)}
                onChange={(e) => handleInputChange('taxId', e.target.value.replace(/\D/g, ''))}
                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.taxId ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={
                  data.taxIdType === 'ssn' ? '123-45-6789' :
                  data.taxIdType === 'ein' ? '12-3456789' :
                  data.taxIdType === 'itin' ? '123-45-6789' :
                  'Enter tax ID'
                }
                maxLength={data.taxIdType ? 11 : 20}
              />
              <button
                type="button"
                onClick={() => setShowTaxId(!showTaxId)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showTaxId ? (
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
            {errors.taxId && (
              <p className="mt-1 text-sm text-red-600">{errors.taxId}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              This information is encrypted and used only for tax reporting
            </p>
          </div>

          {/* W-9 Form Acknowledgment */}
          <div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">📋 Tax Form Requirements</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  <strong>W-9 Form:</strong> By providing your tax information, you're electronically signing a W-9 form, 
                  which allows us to report your earnings to the IRS.
                </p>
                <p>
                  <strong>1099 Reporting:</strong> If you earn $600 or more in a calendar year, we'll send you a 1099-NEC form 
                  by January 31st of the following year.
                </p>
                <p>
                  <strong>Tax Responsibility:</strong> You're responsible for reporting this income on your tax return and 
                  paying any applicable taxes.
                </p>
              </div>
              
              <div className="mt-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={data.w9FormSubmitted}
                    onChange={(e) => handleInputChange('w9FormSubmitted', e.target.checked)}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    I understand the tax requirements and electronically sign the W-9 form by providing my tax information. 
                    I acknowledge that I'm responsible for reporting this income and paying applicable taxes.
                    <span className="text-red-500 ml-1">*</span>
                  </span>
                </label>
                {errors.w9FormSubmitted && (
                  <p className="mt-1 text-sm text-red-600">{errors.w9FormSubmitted}</p>
                )}
              </div>
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
                  Continue to Review
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