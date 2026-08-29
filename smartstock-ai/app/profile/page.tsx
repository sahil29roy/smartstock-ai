"use client";

import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { ProfileHeader } from "@/components/profile/profile-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Mail, Shield, Calendar, User } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          <PageHeader
            title="My Profile"
            description="View and verify your SmartStock security credentials and system roles."
          />

          <div className="max-w-2xl mt-6">
            <Card className="bg-surface border-border">
              <CardHeader className="border-b border-border pb-6">
                <ProfileHeader
                  name={user?.name}
                  email={user?.email}
                  role={user?.role}
                  createdAt={user?.created_at}
                />
              </CardHeader>
              <CardContent className="pt-6 space-y-6 select-none">
                <h4 className="text-sm font-bold text-foreground">Security & Role Metadata</h4>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-secondary-text">
                      <Mail className="h-3.5 w-3.5" />
                      <span>Email Address</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{user?.email}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-secondary-text">
                      <Shield className="h-3.5 w-3.5" />
                      <span>Assigned RBAC Role</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge status={user?.role || "USER"} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-secondary-text">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Member Since</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{formattedDate}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-secondary-text">
                      <User className="h-3.5 w-3.5" />
                      <span>Account Status</span>
                    </div>
                    <p className="text-sm font-semibold text-primary">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
