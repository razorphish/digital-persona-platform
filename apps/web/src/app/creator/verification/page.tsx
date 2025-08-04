"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';

// Step Components
import IdentityVerificationStep from '@/components/creator/verification/IdentityVerificationStep';
import DocumentUploadStep from '@/components/creator/verification/DocumentUploadStep';
import AddressVerificationStep from '@/components/creator/verification/AddressVerificationStep';
import BankingVerificationStep from '@/components/creator/verification/BankingVerificationStep';
import TaxVerificationStep from '@/components/creator/verification/TaxVerificationStep';
import ReviewSubmitStep from '@/components/creator/verification/ReviewSubmitStep';
import VerificationProgress from '@/components/creator/verification/VerificationProgress';

interface VerificationData {
  // Identity
  legalName: string;
  dateOfBirth: Date | null;
  governmentIdType: 'drivers_license' | 'passport' | 'state_id' | 'national_id' | '';
  governmentIdNumber: string;
  governmentIdExpiryDate: Date | null;
  
  // Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  
  // Banking
  bankName: string;
  bankAccountType: 'checking' | 'savings' | '';
  routingNumber: string;
  accountNumber: string;
  
  // Tax
  taxIdType: 'ssn' | 'ein' | 'itin' | '';
  taxId: string;
  w9FormSubmitted: boolean;
  
  // Documents
  uploadedDocuments: Array<{
    type: string;
    file: File | null;
    uploaded: boolean;
  }>;
}

const VERIFICATION_STEPS = [
  { id: 1, name: 'Identity', description: 'Personal information' },
  { id: 2, name: 'Documents', description: 'ID verification' },
  { id: 3, name: 'Address', description: 'Address verification' },
  { id: 4, name: 'Banking', description: 'Payout information' },
  { id: 5, name: 'Tax', description: 'Tax compliance' },
  { id: 6, name: 'Review', description: 'Submit for review' }
];

export default function CreatorVerificationPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Verification state
  const [currentStep, setCurrentStep] = useState(1);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>('not_started');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [verificationData, setVerificationData] = useState<VerificationData>({
    // Identity
    legalName: '',
    dateOfBirth: null,
    governmentIdType: '',
    governmentIdNumber: '',
    governmentIdExpiryDate: null,
    
    // Address
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    
    // Banking
    bankName: '',
    bankAccountType: '',
    routingNumber: '',
    accountNumber: '',
    
    // Tax
    taxIdType: '',
    taxId: '',
    w9FormSubmitted: false,
    
    // Documents
    uploadedDocuments: [
      { type: 'government_id_front', file: null, uploaded: false },
      { type: 'government_id_back', file: null, uploaded: false },
      { type: 'selfie_with_id', file: null, uploaded: false },
      { type: 'utility_bill', file: null, uploaded: false },
      { type: 'bank_statement', file: null, uploaded: false },
      { type: 'tax_document', file: null, uploaded: false }
    ]
  });

  // tRPC hooks
  const getVerificationStatus = trpc.creatorVerification.getVerificationStatus.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const startVerification = trpc.creatorVerification.startVerification.useMutation();

  // Initialize verification status
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (getVerificationStatus.data) {
      const status = getVerificationStatus.data;
      setVerificationStatus(status.status);
      setVerificationId(status.verificationId);
      
      // Determine current step based on completed steps
      if (status.status === 'approved') {
        setCurrentStep(6); // Show completed state
      } else if (status.status === 'rejected') {
        setCurrentStep(1); // Allow resubmission
      } else {
        // Calculate step based on completed steps
        const completedSteps = status.completedSteps?.length || 0;
        setCurrentStep(Math.min(completedSteps + 1, 6));
      }
      
      setIsLoading(false);
    }
  }, [getVerificationStatus.data, isAuthenticated, router]);

  // Start verification if not already started
  const handleStartVerification = async () => {
    if (verificationStatus === 'not_started') {
      try {
        setIsLoading(true);
        const result = await startVerification.mutateAsync({
          ipAddress: 'client-ip', // Would be captured from headers in real implementation
          userAgent: navigator.userAgent
        });
        
        if (result.success) {
          setVerificationId(result.verificationId);
          setVerificationStatus('pending');
          setCurrentStep(1);
        } else {
          setError('Failed to start verification process');
        }
      } catch (error) {
        setError('Failed to start verification process');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Step navigation
  const goToStep = (step: number) => {
    if (step >= 1 && step <= 6) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Update verification data
  const updateData = (updates: Partial<VerificationData>) => {
    setVerificationData(prev => ({ ...prev, ...updates }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Creator Verification</h1>
              <p className="text-gray-600">Complete your verification to start monetizing your personas</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                verificationStatus === 'approved' 
                  ? 'bg-green-100 text-green-800'
                  : verificationStatus === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : verificationStatus === 'in_review'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {verificationStatus === 'approved' && '✅ Approved'}
                {verificationStatus === 'rejected' && '❌ Rejected'}
                {verificationStatus === 'in_review' && '🔍 In Review'}
                {verificationStatus === 'pending' && '⏳ In Progress'}
                {verificationStatus === 'not_started' && '📝 Not Started'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <VerificationProgress 
          steps={VERIFICATION_STEPS}
          currentStep={currentStep}
          verificationStatus={verificationStatus}
        />

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          {verificationStatus === 'not_started' ? (
            // Welcome screen
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Creator Verification</h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                To start monetizing your personas and receiving payments, we need to verify your identity. 
                This process ensures platform security and legal compliance.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Identity Verification</h3>
                  <p className="text-sm text-gray-600">Verify your identity with government-issued ID</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Secure Process</h3>
                  <p className="text-sm text-gray-600">All data is encrypted and securely stored</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Start Earning</h3>
                  <p className="text-sm text-gray-600">Receive 97% of all subscription revenue</p>
                </div>
              </div>
              <button
                onClick={handleStartVerification}
                disabled={startVerification.isLoading}
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {startVerification.isLoading ? 'Starting...' : 'Start Verification Process'}
              </button>
            </div>
          ) : (
            // Verification steps
            <div>
              {currentStep === 1 && (
                <IdentityVerificationStep
                  data={verificationData}
                  updateData={updateData}
                  onNext={nextStep}
                  verificationId={verificationId}
                />
              )}
              {currentStep === 2 && (
                <DocumentUploadStep
                  data={verificationData}
                  updateData={updateData}
                  onNext={nextStep}
                  onPrev={prevStep}
                  verificationId={verificationId}
                />
              )}
              {currentStep === 3 && (
                <AddressVerificationStep
                  data={verificationData}
                  updateData={updateData}
                  onNext={nextStep}
                  onPrev={prevStep}
                  verificationId={verificationId}
                />
              )}
              {currentStep === 4 && (
                <BankingVerificationStep
                  data={verificationData}
                  updateData={updateData}
                  onNext={nextStep}
                  onPrev={prevStep}
                  verificationId={verificationId}
                />
              )}
              {currentStep === 5 && (
                <TaxVerificationStep
                  data={verificationData}
                  updateData={updateData}
                  onNext={nextStep}
                  onPrev={prevStep}
                  verificationId={verificationId}
                />
              )}
              {currentStep === 6 && (
                <ReviewSubmitStep
                  data={verificationData}
                  onPrev={prevStep}
                  verificationId={verificationId}
                  verificationStatus={verificationStatus}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}