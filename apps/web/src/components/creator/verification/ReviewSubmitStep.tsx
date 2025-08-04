import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';

interface ReviewSubmitStepProps {
  data: any;
  onPrev: () => void;
  verificationId: string | null;
  verificationStatus: string;
}

export default function ReviewSubmitStep({
  data,
  onPrev,
  verificationId,
  verificationStatus
}: ReviewSubmitStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

  const finalizeVerification = trpc.creatorVerification.finalizeVerification.useMutation();

  const handleFinalSubmit = async () => {
    if (!verificationId) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await finalizeVerification.mutateAsync({
        verificationId
      });

      if (result.success) {
        // Redirect to success page or dashboard
        router.push('/creator/verification/success');
      } else {
        setSubmitError('Failed to submit verification for review');
      }
    } catch (error) {
      setSubmitError('Failed to submit verification for review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const maskSensitiveData = (value: string, type: 'account' | 'routing' | 'tax' | 'id') => {
    if (!value) return '';
    
    switch (type) {
      case 'account':
        return '****' + value.slice(-4);
      case 'routing':
        return '****' + value.slice(-4);
      case 'tax':
        if (value.includes('-')) {
          return '***-**-' + value.slice(-4);
        }
        return '****' + value.slice(-4);
      case 'id':
        return '****' + value.slice(-4);
      default:
        return value;
    }
  };

  const getUploadedDocumentCount = () => {
    return data.uploadedDocuments.filter((doc: any) => doc.uploaded).length;
  };

  const formatIdType = (type: string) => {
    switch (type) {
      case 'drivers_license': return 'Driver\'s License';
      case 'passport': return 'Passport';
      case 'state_id': return 'State ID';
      case 'national_id': return 'National ID';
      default: return type;
    }
  };

  const formatAccountType = (type: string) => {
    switch (type) {
      case 'checking': return 'Checking Account';
      case 'savings': return 'Savings Account';
      default: return type;
    }
  };

  const formatTaxIdType = (type: string) => {
    switch (type) {
      case 'ssn': return 'Social Security Number';
      case 'ein': return 'Employer Identification Number';
      case 'itin': return 'Individual Taxpayer Identification Number';
      default: return type;
    }
  };

  if (verificationStatus === 'approved') {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🎉 Verification Approved!</h2>
          <p className="text-gray-600 mb-8">
            Congratulations! Your creator verification has been approved. You can now start monetizing your personas 
            and earning revenue from your subscribers.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => router.push('/creator/dashboard')}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Go to Creator Dashboard
            </button>
            <button
              onClick={() => router.push('/personas')}
              className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Setup Persona Monetization
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'in_review') {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Under Review</h2>
          <p className="text-gray-600 mb-8">
            Your verification has been submitted and is currently being reviewed by our team. 
            This typically takes 1-3 business days.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Next Steps:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• We'll email you once your verification is complete</li>
              <li>• You can check your status anytime on this page</li>
              <li>• Start preparing your personas for monetization</li>
            </ul>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Submit</h2>
          <p className="text-gray-600">
            Please review all your information before submitting for verification. Once submitted, 
            our team will review your application within 1-3 business days.
          </p>
        </div>

        {/* Review Sections */}
        <div className="space-y-6">
          {/* Identity Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Identity Information</h3>
              <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Legal Name</p>
                <p className="font-medium">{data.legalName}</p>
              </div>
              <div>
                <p className="text-gray-500">Date of Birth</p>
                <p className="font-medium">
                  {data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">ID Type</p>
                <p className="font-medium">{formatIdType(data.governmentIdType)}</p>
              </div>
              <div>
                <p className="text-gray-500">ID Number</p>
                <p className="font-medium">{maskSensitiveData(data.governmentIdNumber, 'id')}</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Uploaded Documents</h3>
              <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {getUploadedDocumentCount()} document(s) uploaded successfully
            </p>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              {data.uploadedDocuments.map((doc: any) => (
                doc.uploaded && (
                  <div key={doc.type} className="flex items-center text-green-700">
                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {doc.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Address */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
              <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-sm">
              <p className="font-medium">
                {data.addressLine1}
                {data.addressLine2 && `, ${data.addressLine2}`}
              </p>
              <p className="text-gray-600">
                {data.city}, {data.state} {data.postalCode}
              </p>
              <p className="text-gray-600">{data.country}</p>
            </div>
          </div>

          {/* Banking */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Banking Information</h3>
              <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Bank Name</p>
                <p className="font-medium">{data.bankName}</p>
              </div>
              <div>
                <p className="text-gray-500">Account Type</p>
                <p className="font-medium">{formatAccountType(data.bankAccountType)}</p>
              </div>
              <div>
                <p className="text-gray-500">Routing Number</p>
                <p className="font-medium">{maskSensitiveData(data.routingNumber, 'routing')}</p>
              </div>
              <div>
                <p className="text-gray-500">Account Number</p>
                <p className="font-medium">{maskSensitiveData(data.accountNumber, 'account')}</p>
              </div>
            </div>
          </div>

          {/* Tax Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Tax Information</h3>
              <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Tax ID Type</p>
                <p className="font-medium">{formatTaxIdType(data.taxIdType)}</p>
              </div>
              <div>
                <p className="text-gray-500">Tax ID</p>
                <p className="font-medium">{maskSensitiveData(data.taxId, 'tax')}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500">W-9 Form</p>
                <p className="font-medium text-green-600">✓ Electronically signed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Final Consent */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-blue-800 mb-3">🔒 Privacy & Security Notice</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              • All your information is encrypted and stored securely
            </p>
            <p>
              • We only use this data for verification and payment processing
            </p>
            <p>
              • Your information is never shared with third parties
            </p>
            <p>
              • You can request data deletion at any time (subject to legal requirements)
            </p>
          </div>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-8 border-t mt-8">
          <button
            onClick={onPrev}
            disabled={isSubmitting}
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <button
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-lg"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting for Review...
              </>
            ) : (
              <>
                Submit for Review
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Submission Timeline */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            After submission, verification typically takes 1-3 business days. 
            We'll email you once your verification is complete.
          </p>
        </div>
      </div>
    </div>
  );
}