import React from 'react';

interface VerificationStep {
  id: number;
  name: string;
  description: string;
}

interface VerificationProgressProps {
  steps: VerificationStep[];
  currentStep: number;
  verificationStatus: string;
}

export default function VerificationProgress({ 
  steps, 
  currentStep, 
  verificationStatus 
}: VerificationProgressProps) {
  const getStepStatus = (stepId: number) => {
    if (verificationStatus === 'approved' && stepId <= 6) {
      return 'completed';
    }
    if (verificationStatus === 'rejected') {
      return stepId === currentStep ? 'error' : stepId < currentStep ? 'completed' : 'upcoming';
    }
    if (stepId < currentStep) {
      return 'completed';
    }
    if (stepId === currentStep) {
      return 'current';
    }
    return 'upcoming';
  };

  const getStepIcon = (stepId: number, status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'current':
        return (
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return <span className="text-gray-500 font-medium">{stepId}</span>;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600';
      case 'current':
        return 'bg-indigo-600';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-gray-300';
    }
  };

  const getConnectorColor = (stepId: number) => {
    const status = getStepStatus(stepId);
    if (status === 'completed') {
      return 'bg-green-600';
    }
    return 'bg-gray-300';
  };

  return (
    <div className="mb-8">
      {/* Desktop Progress */}
      <div className="hidden md:block">
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center">
            {steps.map((step, stepIdx) => {
              const status = getStepStatus(step.id);
              
              return (
                <li key={step.id} className={`${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                  {/* Connector Line */}
                  {stepIdx !== steps.length - 1 && (
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className={`h-0.5 w-full ${getConnectorColor(step.id)}`} />
                    </div>
                  )}
                  
                  {/* Step Circle */}
                  <div className="relative flex items-center justify-center">
                    <div className={`
                      h-10 w-10 rounded-full flex items-center justify-center
                      ${getStepColor(status)}
                      ${status === 'current' ? 'ring-4 ring-indigo-200' : ''}
                    `}>
                      {getStepIcon(step.id, status)}
                    </div>
                  </div>
                  
                  {/* Step Info */}
                  <div className="mt-3 text-center">
                    <span className={`
                      text-sm font-medium
                      ${status === 'current' ? 'text-indigo-600' : 
                        status === 'completed' ? 'text-green-600' :
                        status === 'error' ? 'text-red-600' : 'text-gray-500'}
                    `}>
                      {step.name}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Mobile Progress */}
      <div className="md:hidden">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Step {currentStep} of {steps.length}
              </p>
              <p className="text-sm text-gray-500">
                {steps[currentStep - 1]?.name} - {steps[currentStep - 1]?.description}
              </p>
            </div>
            <div className={`
              h-8 w-8 rounded-full flex items-center justify-center
              ${getStepColor(getStepStatus(currentStep))}
            `}>
              {getStepIcon(currentStep, getStepStatus(currentStep))}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
          
          {/* Step List */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {steps.map((step) => {
              const status = getStepStatus(step.id);
              return (
                <div 
                  key={step.id}
                  className={`
                    flex items-center text-xs p-2 rounded
                    ${status === 'completed' ? 'bg-green-50 text-green-700' :
                      status === 'current' ? 'bg-indigo-50 text-indigo-700' :
                      status === 'error' ? 'bg-red-50 text-red-700' :
                      'bg-gray-50 text-gray-500'}
                  `}
                >
                  <div className={`
                    h-4 w-4 rounded-full flex items-center justify-center mr-2 flex-shrink-0
                    ${getStepColor(status)}
                  `}>
                    {status === 'completed' ? (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : status === 'current' ? (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    ) : status === 'error' ? (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-xs text-gray-500">{step.id}</span>
                    )}
                  </div>
                  <span className="truncate">{step.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status Message */}
      {verificationStatus === 'approved' && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Verification Approved!</h3>
              <p className="mt-1 text-sm text-green-700">
                Your creator verification has been approved. You can now start monetizing your personas.
              </p>
            </div>
          </div>
        </div>
      )}

      {verificationStatus === 'in_review' && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Under Review</h3>
              <p className="mt-1 text-sm text-yellow-700">
                Your verification is being reviewed by our team. This typically takes 1-3 business days.
              </p>
            </div>
          </div>
        </div>
      )}

      {verificationStatus === 'rejected' && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Verification Rejected</h3>
              <p className="mt-1 text-sm text-red-700">
                Your verification was rejected. Please review the feedback and resubmit with corrected information.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}