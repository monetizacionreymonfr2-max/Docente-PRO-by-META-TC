import React from 'react';

interface AccessProtectionProps {
  accessLevel?: string;
  codeId?: string;
  children: React.ReactNode;
}

export default function AccessProtection({ children }: AccessProtectionProps) {
  return <>{children}</>;
}

