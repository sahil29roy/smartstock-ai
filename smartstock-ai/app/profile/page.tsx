"use client";

import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { StatusBadge } from "@/components/common/status-badge";
import { Mail, Shield, Calendar, User } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
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
              <CardHeader className="border-b border-border pb-6 select-none">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary-very-light dark:bg-primary-light/10 text-primary border border-primary-light/20 flex items-center justify-center font-bold text-2xl">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                  </div>
                  <div className="text-center sm:text-left">
                    <CardTitle className="text-xl font-bold text-foreground">{user?.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      System account active since {formattedDate}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-secondary-text select-none">
                      <Mail className="h-3.5 w-3.5" />
                      <span>Email Address</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{user?.email}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-secondary-text select-none">
                      <Shield className="h-3.5 w-3.5" />
                      <span>Assigned RBAC Role</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge status={user?.role || "USER"} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-secondary-text select-none">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Member Since</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{formattedDate}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-secondary-text select-none">
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
