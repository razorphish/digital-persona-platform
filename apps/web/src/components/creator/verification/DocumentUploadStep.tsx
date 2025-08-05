import React, { useState, useCallback } from "react";

interface DocumentUploadStepProps {
  data: any;
  updateData: (updates: any) => void;
  onNext: () => void;
  onPrev: () => void;
  verificationId: string | null;
}

interface DocumentType {
  type: string;
  name: string;
  description: string;
  required: boolean;
  example?: string;
}

const DOCUMENT_TYPES: DocumentType[] = [
  {
    type: "government_id_front",
    name: "Government ID (Front)",
    description: "Clear photo of the front of your government-issued ID",
    required: true,
    example: "Driver's license, passport, state ID",
  },
  {
    type: "government_id_back",
    name: "Government ID (Back)",
    description: "Clear photo of the back of your government-issued ID",
    required: true,
    example: "Back side with barcode/magnetic strip",
  },
  {
    type: "selfie_with_id",
    name: "Selfie with ID",
    description:
      "Photo of yourself holding your government ID next to your face",
    required: true,
    example: "For facial verification",
  },
  {
    type: "utility_bill",
    name: "Proof of Address",
    description: "Recent utility bill, bank statement, or lease agreement",
    required: false,
    example: "Document showing your current address",
  },
];

export default function DocumentUploadStep({
  data,
  updateData,
  onNext,
  onPrev,
  verificationId,
}: DocumentUploadStepProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [draggedOver, setDraggedOver] = useState<string | null>(null);

  const handleFileUpload = useCallback(
    async (file: File, documentType: string) => {
      if (!file || !verificationId) return;

      // Validate file
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];

      if (file.size > maxSize) {
        setUploadErrors((prev) => ({
          ...prev,
          [documentType]: "File size must be less than 10MB",
        }));
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        setUploadErrors((prev) => ({
          ...prev,
          [documentType]: "File must be JPEG, PNG, or PDF",
        }));
        return;
      }

      setUploadingFiles((prev) => new Set([...Array.from(prev), documentType]));
      setUploadErrors((prev) => ({ ...prev, [documentType]: "" }));

      try {
        // In a real implementation, this would upload to the backend
        // For now, we'll simulate the upload and store the file locally
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate upload delay

        // Update the document in the data
        const updatedDocuments = data.uploadedDocuments.map((doc: any) =>
          doc.type === documentType ? { ...doc, file, uploaded: true } : doc
        );

        updateData({ uploadedDocuments: updatedDocuments });
      } catch (error) {
        setUploadErrors((prev) => ({
          ...prev,
          [documentType]: "Upload failed. Please try again.",
        }));
      } finally {
        setUploadingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(documentType);
          return newSet;
        });
      }
    },
    [verificationId, data.uploadedDocuments, updateData]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, documentType: string) => {
      e.preventDefault();
      setDraggedOver(null);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0], documentType);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, documentType: string) => {
      e.preventDefault();
      setDraggedOver(documentType);
    },
    []
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOver(null);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0], documentType);
      }
    },
    [handleFileUpload]
  );

  const removeFile = useCallback(
    (documentType: string) => {
      const updatedDocuments = data.uploadedDocuments.map((doc: any) =>
        doc.type === documentType
          ? { ...doc, file: null, uploaded: false }
          : doc
      );
      updateData({ uploadedDocuments: updatedDocuments });
      setUploadErrors((prev) => ({ ...prev, [documentType]: "" }));
    },
    [data.uploadedDocuments, updateData]
  );

  const getUploadedDocument = (documentType: string) => {
    return data.uploadedDocuments.find((doc: any) => doc.type === documentType);
  };

  const isRequiredDocumentUploaded = () => {
    const requiredTypes = DOCUMENT_TYPES.filter((dt) => dt.required).map(
      (dt) => dt.type
    );
    return requiredTypes.every((type) => {
      const doc = getUploadedDocument(type);
      return doc && doc.uploaded;
    });
  };

  const canContinue = isRequiredDocumentUploaded();

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Document Upload
          </h2>
          <p className="text-gray-600">
            Upload clear photos of your documents for identity verification. All
            uploads are encrypted and secure.
          </p>
        </div>

        {/* Upload Guidelines */}
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Photo Guidelines
              </h3>
              <div className="mt-1 text-sm text-amber-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Take photos in good lighting</li>
                  <li>Ensure all text is clearly readable</li>
                  <li>No glare or shadows on the documents</li>
                  <li>Include all four corners of the document</li>
                  <li>Maximum file size: 10MB</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Document Upload Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {DOCUMENT_TYPES.map((docType) => {
            const uploadedDoc = getUploadedDocument(docType.type);
            const isUploading = uploadingFiles.has(docType.type);
            const hasError = uploadErrors[docType.type];
            const isDraggedOver = draggedOver === docType.type;

            return (
              <div
                key={docType.type}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900 flex items-center">
                      {docType.name}
                      {docType.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {docType.description}
                    </p>
                    {docType.example && (
                      <p className="text-xs text-gray-500 mt-1">
                        {docType.example}
                      </p>
                    )}
                  </div>
                  {uploadedDoc?.uploaded && (
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                          className="h-4 w-4 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Area */}
                <div
                  className={`
                    relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
                    ${
                      isDraggedOver
                        ? "border-indigo-400 bg-indigo-50"
                        : uploadedDoc?.uploaded
                        ? "border-green-300 bg-green-50"
                        : hasError
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300 hover:border-gray-400"
                    }
                  `}
                  onDrop={(e) => handleDrop(e, docType.type)}
                  onDragOver={(e) => handleDragOver(e, docType.type)}
                  onDragLeave={handleDragLeave}
                >
                  <input
                    type="file"
                    id={`file-${docType.type}`}
                    className="sr-only"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileSelect(e, docType.type)}
                    disabled={isUploading}
                  />

                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <svg
                        className="animate-spin h-8 w-8 text-indigo-600 mb-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <p className="text-sm text-gray-600">Uploading...</p>
                    </div>
                  ) : uploadedDoc?.uploaded ? (
                    <div className="flex flex-col items-center">
                      <div className="h-16 w-16 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                        {uploadedDoc.file?.type.startsWith("image/") ? (
                          <img
                            src={URL.createObjectURL(uploadedDoc.file)}
                            alt="Uploaded document"
                            className="h-14 w-14 object-cover rounded"
                          />
                        ) : (
                          <svg
                            className="h-8 w-8 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm font-medium text-green-800">
                        ✓ Uploaded
                      </p>
                      <p className="text-xs text-green-600">
                        {uploadedDoc.file?.name}
                      </p>
                      <button
                        onClick={() => removeFile(docType.type)}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <svg
                        className="h-12 w-12 text-gray-400 mb-2"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="text-center">
                        <label
                          htmlFor={`file-${docType.type}`}
                          className="cursor-pointer"
                        >
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Click to upload or drag and drop
                          </span>
                          <span className="mt-1 block text-xs text-gray-500">
                            PNG, JPG, PDF up to 10MB
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {hasError && (
                  <p className="mt-2 text-sm text-red-600">{hasError}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Facial Verification Notice */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Facial Verification
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                After uploading your documents, we'll use AI to verify that your
                selfie matches your government ID. This helps prevent identity
                fraud and keeps the platform secure.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <button
            onClick={onPrev}
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          <button
            onClick={onNext}
            disabled={!canContinue}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            Continue to Address
            <svg
              className="ml-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Progress Indicator */}
        {!canContinue && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Please upload all required documents to continue (
              {DOCUMENT_TYPES.filter((dt) => dt.required).length -
                DOCUMENT_TYPES.filter((dt) => dt.required).filter(
                  (dt) => getUploadedDocument(dt.type)?.uploaded
                ).length}{" "}
              remaining)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
