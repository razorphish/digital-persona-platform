/**
 * Creator Verification Service
 *
 * Handles the complete creator verification process including:
 * - Identity verification (government ID + facial recognition)
 * - Address verification
 * - Banking information collection
 * - Tax compliance (W-9 forms)
 * - Document processing and AI verification
 */

import { db } from "@digital-persona/database";
import {
  creatorVerifications,
  verificationDocuments,
  stripeAccounts,
  users,
} from "@digital-persona/database";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

// AWS Services for document processing
import {
  RekognitionClient,
  CompareFacesCommand,
  DetectTextCommand,
} from "@aws-sdk/client-rekognition";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface VerificationDocument {
  type:
    | "government_id_front"
    | "government_id_back"
    | "selfie_with_id"
    | "utility_bill"
    | "bank_statement"
    | "tax_document";
  file: Buffer;
  fileName: string;
  mimeType: string;
}

export interface IdentityVerificationData {
  legalName: string;
  dateOfBirth: Date;
  governmentIdType: "drivers_license" | "passport" | "state_id" | "national_id";
  governmentIdNumber: string;
  governmentIdExpiryDate: Date;
}

export interface AddressVerificationData {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface BankingVerificationData {
  bankName: string;
  bankAccountType: "checking" | "savings";
  routingNumber: string;
  accountNumber: string;
}

export interface TaxVerificationData {
  taxIdType: "ssn" | "ein" | "itin";
  taxId: string;
  w9FormSubmitted: boolean;
}

export interface VerificationResult {
  success: boolean;
  verificationId: string;
  status: "pending" | "in_review" | "approved" | "rejected";
  errors?: string[];
  nextSteps?: string[];
}

export class CreatorVerificationService {
  private s3Client: S3Client;
  private rekognitionClient: RekognitionClient;
  private encryptionKey: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
    });
    this.rekognitionClient = new RekognitionClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
    this.encryptionKey =
      process.env.VERIFICATION_ENCRYPTION_KEY ||
      "default-key-change-in-production";
  }

  /**
   * Start the verification process for a creator
   */
  async startVerification(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<VerificationResult> {
    try {
      // Check if user already has a verification in progress
      const existingVerification = await db
        .select()
        .from(creatorVerifications)
        .where(eq(creatorVerifications.userId, userId))
        .orderBy(desc(creatorVerifications.createdAt))
        .limit(1);

      if (existingVerification.length > 0) {
        const verification = existingVerification[0];

        // If already approved, don't create a new one
        if (verification.status === "approved") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User is already verified",
          });
        }

        // If in progress, return the existing one
        if (
          verification.status === "pending" ||
          verification.status === "in_review"
        ) {
          return {
            success: true,
            verificationId: verification.id,
            status: verification.status,
            nextSteps: this.getNextSteps(verification.status),
          };
        }
      }

      // Create new verification record
      const [newVerification] = await db
        .insert(creatorVerifications)
        .values({
          userId,
          status: "pending",
          ipAddress,
          userAgent,
          verificationDocumentIds: [],
        })
        .returning();

      return {
        success: true,
        verificationId: newVerification.id,
        status: "pending",
        nextSteps: this.getNextSteps("pending"),
      };
    } catch (error) {
      console.error("Error starting verification:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to start verification process",
      });
    }
  }

  /**
   * Submit identity verification data
   */
  async submitIdentityVerification(
    userId: string,
    verificationId: string,
    identityData: IdentityVerificationData
  ): Promise<VerificationResult> {
    try {
      // Encrypt sensitive data
      const encryptedIdNumber = this.encryptSensitiveData(
        identityData.governmentIdNumber
      );

      // Store only last 4 digits of ID number
      const idLast4 = identityData.governmentIdNumber.slice(-4);

      // Update verification record
      await db
        .update(creatorVerifications)
        .set({
          legalName: identityData.legalName,
          dateOfBirth: identityData.dateOfBirth,
          governmentIdType: identityData.governmentIdType,
          governmentIdNumber: encryptedIdNumber,
          governmentIdExpiryDate: identityData.governmentIdExpiryDate,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(creatorVerifications.id, verificationId),
            eq(creatorVerifications.userId, userId)
          )
        );

      return {
        success: true,
        verificationId,
        status: "pending",
        nextSteps: ["Upload government ID documents", "Take selfie with ID"],
      };
    } catch (error) {
      console.error("Error submitting identity verification:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to submit identity verification",
      });
    }
  }

  /**
   * Submit address verification data
   */
  async submitAddressVerification(
    userId: string,
    verificationId: string,
    addressData: AddressVerificationData
  ): Promise<VerificationResult> {
    try {
      await db
        .update(creatorVerifications)
        .set({
          addressLine1: addressData.addressLine1,
          addressLine2: addressData.addressLine2,
          city: addressData.city,
          state: addressData.state,
          postalCode: addressData.postalCode,
          country: addressData.country,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(creatorVerifications.id, verificationId),
            eq(creatorVerifications.userId, userId)
          )
        );

      return {
        success: true,
        verificationId,
        status: "pending",
        nextSteps: ["Upload proof of address document"],
      };
    } catch (error) {
      console.error("Error submitting address verification:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to submit address verification",
      });
    }
  }

  /**
   * Submit banking verification data
   */
  async submitBankingVerification(
    userId: string,
    verificationId: string,
    bankingData: BankingVerificationData
  ): Promise<VerificationResult> {
    try {
      // Encrypt sensitive banking data
      const encryptedRoutingNumber = this.encryptSensitiveData(
        bankingData.routingNumber
      );
      const encryptedAccountNumber = this.encryptSensitiveData(
        bankingData.accountNumber
      );

      // Store only last 4 digits of account number
      const accountLast4 = bankingData.accountNumber.slice(-4);

      await db
        .update(creatorVerifications)
        .set({
          bankName: bankingData.bankName,
          bankAccountType: bankingData.bankAccountType,
          bankAccountLast4: accountLast4,
          routingNumber: encryptedRoutingNumber,
          bankAccountVerified: false, // Will be verified by micro-deposits or Stripe
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(creatorVerifications.id, verificationId),
            eq(creatorVerifications.userId, userId)
          )
        );

      return {
        success: true,
        verificationId,
        status: "pending",
        nextSteps: ["Upload bank statement", "Complete tax information"],
      };
    } catch (error) {
      console.error("Error submitting banking verification:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to submit banking verification",
      });
    }
  }

  /**
   * Submit tax verification data
   */
  async submitTaxVerification(
    userId: string,
    verificationId: string,
    taxData: TaxVerificationData
  ): Promise<VerificationResult> {
    try {
      // Encrypt tax ID
      const encryptedTaxId = this.encryptSensitiveData(taxData.taxId);
      const taxIdLast4 = taxData.taxId.slice(-4);

      await db
        .update(creatorVerifications)
        .set({
          taxIdType: taxData.taxIdType,
          taxIdLast4: taxIdLast4,
          taxFormsSubmitted: {
            w9: taxData.w9FormSubmitted,
            w8: false,
            additionalForms: [],
          },
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(creatorVerifications.id, verificationId),
            eq(creatorVerifications.userId, userId)
          )
        );

      return {
        success: true,
        verificationId,
        status: "pending",
        nextSteps: ["Upload tax documents", "Submit for review"],
      };
    } catch (error) {
      console.error("Error submitting tax verification:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to submit tax verification",
      });
    }
  }

  /**
   * Upload and process verification document
   */
  async uploadVerificationDocument(
    userId: string,
    verificationId: string,
    document: VerificationDocument
  ): Promise<{ success: boolean; documentId: string }> {
    try {
      // Generate unique document ID and S3 key
      const documentId = crypto.randomUUID();
      const s3Key = `verification-documents/${userId}/${verificationId}/${documentId}`;
      const bucket =
        process.env.VERIFICATION_DOCUMENTS_BUCKET || "hibiji-verification-docs";

      // Upload to S3 with encryption
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: s3Key,
          Body: document.file,
          ContentType: document.mimeType,
          ServerSideEncryption: "AES256",
          Metadata: {
            "user-id": userId,
            "verification-id": verificationId,
            "document-type": document.type,
          },
        })
      );

      // Create document record
      const [documentRecord] = await db
        .insert(verificationDocuments)
        .values({
          id: documentId,
          verificationId,
          userId,
          documentType: document.type,
          documentName: document.fileName,
          s3Bucket: bucket,
          s3Key: s3Key,
          fileSize: document.file.length,
          mimeType: document.mimeType,
          status: "uploaded",
        })
        .returning();

      // Update verification record with document ID
      await this.updateVerificationDocumentIds(verificationId, documentId);

      // Process document with AI if it's an ID document
      if (
        document.type === "government_id_front" ||
        document.type === "government_id_back"
      ) {
        await this.processIdDocumentWithAI(documentId, bucket, s3Key);
      }

      return {
        success: true,
        documentId,
      };
    } catch (error) {
      console.error("Error uploading verification document:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to upload verification document",
      });
    }
  }

  /**
   * Perform facial recognition verification
   */
  async performFacialVerification(
    userId: string,
    verificationId: string,
    selfieBuffer: Buffer,
    idPhotoBuffer: Buffer
  ): Promise<{ success: boolean; confidenceScore: number }> {
    try {
      // Use AWS Rekognition to compare faces
      const command = new CompareFacesCommand({
        SourceImage: {
          Bytes: idPhotoBuffer,
        },
        TargetImage: {
          Bytes: selfieBuffer,
        },
        SimilarityThreshold: 80,
      });

      const response = await this.rekognitionClient.send(command);

      const faceMatches = response.FaceMatches || [];
      const confidenceScore =
        faceMatches.length > 0 ? faceMatches[0].Similarity || 0 : 0;

      // Update verification record
      await db
        .update(creatorVerifications)
        .set({
          faceVerificationScore: confidenceScore.toString(),
          faceVerificationProvider: "aws_rekognition",
          faceVerificationId: crypto.randomUUID(),
          faceVerificationCompletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(creatorVerifications.id, verificationId),
            eq(creatorVerifications.userId, userId)
          )
        );

      return {
        success: confidenceScore >= 80,
        confidenceScore,
      };
    } catch (error) {
      console.error("Error performing facial verification:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to perform facial verification",
      });
    }
  }

  /**
   * Submit verification for review
   */
  async submitForReview(
    userId: string,
    verificationId: string
  ): Promise<VerificationResult> {
    try {
      // Validate that all required information is present
      const verification = await this.getVerificationById(verificationId);

      if (!verification || verification.userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Verification not found",
        });
      }

      const validationErrors =
        this.validateVerificationCompleteness(verification);

      if (validationErrors.length > 0) {
        return {
          success: false,
          verificationId,
          status: "pending",
          errors: validationErrors,
          nextSteps: ["Complete missing information before submitting"],
        };
      }

      // Update status to in_review
      await db
        .update(creatorVerifications)
        .set({
          status: "in_review",
          updatedAt: new Date(),
        })
        .where(eq(creatorVerifications.id, verificationId));

      // TODO: Trigger admin notification for review
      await this.notifyAdminForReview(verificationId);

      return {
        success: true,
        verificationId,
        status: "in_review",
        nextSteps: [
          "Wait for admin review",
          "Review typically takes 1-3 business days",
        ],
      };
    } catch (error) {
      console.error("Error submitting for review:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to submit verification for review",
      });
    }
  }

  /**
   * Get verification status for a user
   */
  async getVerificationStatus(userId: string): Promise<{
    status: string;
    verificationId: string | null;
    completedSteps: string[];
    nextSteps: string[];
    rejectionReason?: string;
  }> {
    try {
      const verification = await db
        .select()
        .from(creatorVerifications)
        .where(eq(creatorVerifications.userId, userId))
        .orderBy(desc(creatorVerifications.createdAt))
        .limit(1);

      if (verification.length === 0) {
        return {
          status: "not_started",
          verificationId: null,
          completedSteps: [],
          nextSteps: ["Start verification process"],
        };
      }

      const verificationRecord = verification[0];

      return {
        status: verificationRecord.status || "pending",
        verificationId: verificationRecord.id,
        completedSteps: this.getCompletedSteps(verificationRecord),
        nextSteps: this.getNextSteps(verificationRecord.status || "pending"),
        rejectionReason: verificationRecord.rejectionReason || undefined,
      };
    } catch (error) {
      console.error("Error getting verification status:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get verification status",
      });
    }
  }

  // Private helper methods

  private async getVerificationById(verificationId: string) {
    const result = await db
      .select()
      .from(creatorVerifications)
      .where(eq(creatorVerifications.id, verificationId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  private async updateVerificationDocumentIds(
    verificationId: string,
    documentId: string
  ) {
    const verification = await this.getVerificationById(verificationId);
    if (!verification) return;

    const currentIds = verification.verificationDocumentIds || [];
    const updatedIds = [...currentIds, documentId];

    await db
      .update(creatorVerifications)
      .set({
        verificationDocumentIds: updatedIds,
        updatedAt: new Date(),
      })
      .where(eq(creatorVerifications.id, verificationId));
  }

  private async processIdDocumentWithAI(
    documentId: string,
    bucket: string,
    s3Key: string
  ) {
    try {
      // Get document from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: s3Key,
      });

      const response = await this.s3Client.send(getObjectCommand);
      const imageBytes = await response.Body?.transformToByteArray();

      if (!imageBytes) return;

      // Use AWS Rekognition to extract text
      const detectTextCommand = new DetectTextCommand({
        Image: {
          Bytes: new Uint8Array(imageBytes),
        },
      });

      const textResponse = await this.rekognitionClient.send(detectTextCommand);
      const extractedText =
        textResponse.TextDetections?.map((t) => t.DetectedText).join(" ") || "";

      // Update document with OCR results
      await db
        .update(verificationDocuments)
        .set({
          ocrText: extractedText,
          status: "processing",
          updatedAt: new Date(),
        })
        .where(eq(verificationDocuments.id, documentId));
    } catch (error) {
      console.error("Error processing ID document with AI:", error);
      // Mark document as failed processing
      await db
        .update(verificationDocuments)
        .set({
          status: "rejected",
          updatedAt: new Date(),
        })
        .where(eq(verificationDocuments.id, documentId));
    }
  }

  private encryptSensitiveData(data: string): string {
    const algorithm = "aes-256-cbc";
    const key = Buffer.from(this.encryptionKey.padEnd(32, "0").slice(0, 32));
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    return iv.toString("hex") + ":" + encrypted;
  }

  private validateVerificationCompleteness(verification: any): string[] {
    const errors: string[] = [];

    if (!verification.legalName) errors.push("Legal name is required");
    if (!verification.dateOfBirth) errors.push("Date of birth is required");
    if (!verification.governmentIdType)
      errors.push("Government ID type is required");
    if (!verification.addressLine1) errors.push("Address is required");
    if (!verification.city) errors.push("City is required");
    if (!verification.state) errors.push("State is required");
    if (!verification.postalCode) errors.push("Postal code is required");
    if (!verification.bankName) errors.push("Bank information is required");
    if (!verification.taxIdType) errors.push("Tax ID is required");
    if (!verification.faceVerificationScore)
      errors.push("Facial verification is required");

    const documentIds = verification.verificationDocumentIds || [];
    if (documentIds.length < 3)
      errors.push("Minimum 3 documents required (ID front, ID back, selfie)");

    return errors;
  }

  private getCompletedSteps(verification: any): string[] {
    const steps: string[] = [];

    if (verification.legalName) steps.push("Identity information");
    if (verification.addressLine1) steps.push("Address information");
    if (verification.bankName) steps.push("Banking information");
    if (verification.taxIdType) steps.push("Tax information");
    if (verification.faceVerificationScore) steps.push("Facial verification");

    const documentIds = verification.verificationDocumentIds || [];
    if (documentIds.length >= 3) steps.push("Document upload");

    return steps;
  }

  private getNextSteps(status: string): string[] {
    switch (status) {
      case "pending":
        return [
          "Submit identity information",
          "Upload government ID documents",
          "Complete address verification",
          "Provide banking information",
          "Submit tax information",
          "Complete facial verification",
        ];
      case "in_review":
        return [
          "Wait for admin review",
          "Review typically takes 1-3 business days",
          "You will be notified via email",
        ];
      case "approved":
        return [
          "Verification complete!",
          "You can now monetize your personas",
          "Set up your Stripe account for payouts",
        ];
      case "rejected":
        return [
          "Review rejection reason",
          "Correct any issues",
          "Resubmit for verification",
        ];
      default:
        return ["Start verification process"];
    }
  }

  private async notifyAdminForReview(verificationId: string) {
    // TODO: Implement admin notification system
    // This could be email, Slack, or in-app notification
    console.log(`Verification ${verificationId} submitted for admin review`);
  }
}
