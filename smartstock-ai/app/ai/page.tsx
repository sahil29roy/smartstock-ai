"use client";

import React from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/common/page-header";
import { AiChat } from "@/components/ai/ai-chat";

export default function AiPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          <PageHeader
            title="Ask SmartStock AI"
            description="Query sales trends, inventory status, supplier payments, and active statistics using natural language."
          />
          <div className="mt-6">
            <AiChat />
          </div>
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
