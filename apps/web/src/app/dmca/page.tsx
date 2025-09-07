"use client";

import React from "react";

export default function DMCAPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              DMCA Policy
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Digital Persona Platform's policy regarding copyright infringement claims 
              under the Digital Millennium Copyright Act (DMCA).
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Introduction */}
        <div className="mb-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Commitment</h2>
            <p className="text-gray-700 leading-relaxed">
              Digital Persona Platform respects the intellectual property rights of others and expects 
              our users to do the same. We comply with the Digital Millennium Copyright Act (DMCA) and 
              other applicable copyright laws.
            </p>
          </div>
        </div>

        {/* DMCA Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What is the DMCA?</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            The Digital Millennium Copyright Act (DMCA) is a United States copyright law that provides 
            a safe harbor for online service providers when their users post infringing content. It 
            establishes a process for copyright owners to request removal of infringing content.
          </p>
          <p className="text-gray-700 leading-relaxed">
            As a platform that hosts user-generated content, we have implemented procedures to respond 
            to valid DMCA takedown notices and protect the rights of copyright owners.
          </p>
        </div>

        {/* Reporting Copyright Infringement */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Reporting Copyright Infringement</h2>
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">How to File a DMCA Takedown Notice</h3>
            <p className="text-gray-700 mb-4">
              If you believe that content on our platform infringes your copyright, you may submit a 
              DMCA takedown notice. Your notice must include the following information:
            </p>
            <ol className="list-decimal list-inside space-y-3 text-gray-700 ml-4">
              <li>
                <strong>Identification of the copyrighted work:</strong> A description of the copyrighted 
                work that you claim has been infringed, including the title, author, and any registration 
                number if applicable.
              </li>
              <li>
                <strong>Identification of the infringing material:</strong> A description of where the 
                allegedly infringing material is located on our platform, including specific URLs or 
                other identifying information.
              </li>
              <li>
                <strong>Contact information:</strong> Your name, address, telephone number, and email address.
              </li>
              <li>
                <strong>Good faith statement:</strong> A statement that you have a good faith belief that 
                the use of the material is not authorized by the copyright owner, its agent, or the law.
              </li>
              <li>
                <strong>Accuracy statement:</strong> A statement that the information in the notice is 
                accurate and that you are authorized to act on behalf of the copyright owner.
              </li>
              <li>
                <strong>Signature:</strong> Your physical or electronic signature.
              </li>
            </ol>
          </div>
        </div>

        {/* DMCA Notice Template */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">DMCA Notice Template</h2>
          <div className="bg-gray-900 rounded-lg p-6 text-green-400 text-sm font-mono overflow-x-auto">
            <pre>{`Subject: DMCA Takedown Notice

To: copyright@digitalpersona.com

I, [Your Name], hereby give notice that I am the owner of the copyrighted work described below, or am authorized to act on behalf of the owner of the copyrighted work.

Copyrighted Work:
[Description of the copyrighted work, including title, author, and registration number if applicable]

Infringing Material:
[Description of the allegedly infringing material and its location on the platform, including specific URLs]

Contact Information:
Name: [Your Name]
Address: [Your Address]
Phone: [Your Phone Number]
Email: [Your Email Address]

I have a good faith belief that the use of the material described above is not authorized by the copyright owner, its agent, or the law.

The information in this notice is accurate, and I am authorized to act on behalf of the copyright owner.

[Your Signature]
[Date]`}</pre>
          </div>
        </div>

        {/* Our Response Process */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Our Response Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Upon Receipt of Notice</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• We will review the notice for completeness</li>
                <li>• We will verify the copyright ownership</li>
                <li>• We will identify the allegedly infringing content</li>
                <li>• We will contact the user who posted the content</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Takedown Process</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• We will remove or disable access to the content</li>
                <li>• We will notify the user who posted the content</li>
                <li>• We will provide information about the DMCA process</li>
                <li>• We will maintain records of the takedown</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Counter-Notification */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Counter-Notification Process</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            If you believe that your content was removed in error, you may file a counter-notification. 
            Your counter-notification must include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li>Identification of the material that was removed and its location before removal</li>
            <li>A statement under penalty of perjury that you have a good faith belief the material was removed by mistake</li>
            <li>Your name, address, and telephone number</li>
            <li>A statement that you consent to the jurisdiction of the federal court in your district</li>
            <li>Your physical or electronic signature</li>
          </ul>
        </div>

        {/* Repeat Infringer Policy */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Repeat Infringer Policy</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We maintain a policy of terminating accounts of users who are repeat infringers. A user 
            will be considered a repeat infringer if they have received multiple valid DMCA takedown 
            notices for their content.
          </p>
          <p className="text-gray-700 leading-relaxed">
            We reserve the right to terminate accounts immediately upon receipt of multiple valid 
            DMCA notices, without prior warning.
          </p>
        </div>

        {/* False Claims */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">False Claims</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Important Warning</h3>
            <p className="text-gray-700 mb-4">
              Filing a false DMCA notice is a serious matter and may result in legal consequences. 
              Under the DMCA, anyone who knowingly misrepresents that material is infringing may be 
              liable for damages, including costs and attorney's fees.
            </p>
            <p className="text-gray-700">
              Please ensure that you have a good faith belief that the material you are reporting 
              actually infringes your copyright before submitting a DMCA notice.
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            All DMCA notices and counter-notifications should be sent to our designated agent:
          </p>
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-700">
              <strong>DMCA Agent:</strong> Legal Department<br/>
              <strong>Company:</strong> Digital Persona Platform<br/>
              <strong>Email:</strong> copyright@digitalpersona.com<br/>
              <strong>Address:</strong> 123 Innovation Drive, Tech City, TC 12345<br/>
              <strong>Phone:</strong> 1-800-DIGITAL-1
            </p>
          </div>
        </div>

        {/* Response Time */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Response Time</h2>
          <p className="text-gray-700 leading-relaxed">
            We will respond to valid DMCA notices within 24-48 hours of receipt. However, please note 
            that the DMCA allows up to 10 business days for response. We strive to process notices 
            as quickly as possible while ensuring accuracy and compliance with the law.
          </p>
        </div>

        {/* Updates to Policy */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Updates to This Policy</h2>
          <p className="text-gray-700 leading-relaxed">
            We may update this DMCA Policy from time to time to reflect changes in our practices or 
            for other operational, legal, or regulatory reasons. We will notify users of any material 
            changes by posting the updated policy on our website.
          </p>
        </div>

        {/* Legal Disclaimer */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Legal Disclaimer</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-gray-700">
              This DMCA Policy is provided for informational purposes only and does not constitute 
              legal advice. If you have questions about copyright law or the DMCA process, please 
              consult with an attorney. We are not responsible for any legal consequences that may 
              arise from the use of this information.
            </p>
          </div>
        </div>

        {/* Effective Date */}
        <div className="text-center text-gray-500 text-sm">
          <p>This DMCA Policy is effective as of January 1, 2024.</p>
        </div>
      </div>
    </div>
  );
}
