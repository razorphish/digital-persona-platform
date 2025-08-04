"use client";

import React from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import UserSafetyDashboard from '@/components/user/safety/UserSafetyDashboard';

function SafetyPageContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <UserSafetyDashboard />
    </div>
  );
}

export default function SafetyPage() {
  return (
    <AuthGuard>
      <SafetyPageContent />
    </AuthGuard>
  );
}