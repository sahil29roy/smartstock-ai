"use client";

import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TableContainer, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/table";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Shield, User, Landmark, Mail, AlertTriangle, Key } from "lucide-react";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const userRole = user?.role || "USER";
  const isAdmin = userRole === "ADMIN";

  // System user list for administrators (derived from DB seed configs)
  const systemUsers = [
    { name: "Admin User", email: "admin@smartstock.local", role: "ADMIN", status: "ACTIVE" },
    { name: "Sales User", email: "sales@smartstock.local", role: "SALES", status: "ACTIVE" },
    { name: "Warehouse User", email: "warehouse@smartstock.local", role: "WAREHOUSE", status: "ACTIVE" },
    { name: "Accounts User", email: "accounts@smartstock.local", role: "ACCOUNTS", status: "ACTIVE" },
  ];

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          <PageHeader
            title="System Settings"
            description="Configure visual theme preferences, view credentials, and inspect system users."
          />

          <div className="mt-6 space-y-6 max-w-4xl">
            {/* Part 1: Appearance Theme Switcher */}
            <AppearanceSettings />

            {/* Part 2: Session and Role Credentials */}
            <Card className="bg-surface border-border select-none">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <User className="h-4.5 w-4.5 text-primary" />
                  My Account Credentials
                </CardTitle>
                <CardDescription>Details of the currently active authentication session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 bg-background p-4 rounded-lg border border-border">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block">
                      Name
                    </span>
                    <p className="text-sm font-semibold text-foreground">{user?.name || "SmartStock User"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block">
                      Email
                    </span>
                    <p className="text-sm font-semibold text-foreground">{user?.email || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block">
                      Role Privilege
                    </span>
                    <div className="mt-1">
                      <StatusBadge status={userRole} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block">
                      Authentication Method
                    </span>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                      <Key className="h-3.5 w-3.5 text-success" />
                      JWT HttpOnly Cookie
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={logout} className="text-danger border-danger/30 hover:bg-danger/5">
                    Sign Out Session
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Part 3: Company Setup Information (Read-only Metadata) */}
            <Card className="bg-surface border-border select-none">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Landmark className="h-4.5 w-4.5 text-success" />
                  Enterprise Configuration
                </CardTitle>
                <CardDescription>Company-wide global operational preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                  <div className="p-3 bg-background border border-border rounded-lg text-center">
                    <span className="text-[9px] font-bold text-secondary-text uppercase tracking-wider block">
                      Reporting Currency
                    </span>
                    <span className="text-lg font-bold text-foreground mt-1 block font-mono">INR (₹)</span>
                  </div>
                  <div className="p-3 bg-background border border-border rounded-lg text-center">
                    <span className="text-[9px] font-bold text-secondary-text uppercase tracking-wider block">
                      Default VAT / GST
                    </span>
                    <span className="text-lg font-bold text-foreground mt-1 block font-mono">18.00 %</span>
                  </div>
                  <div className="p-3 bg-background border border-border rounded-lg text-center">
                    <span className="text-[9px] font-bold text-secondary-text uppercase tracking-wider block">
                      Timezone Registry
                    </span>
                    <span className="text-lg font-bold text-foreground mt-1 block font-mono">IST (UTC+05:30)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Part 4: System Users List (Only shown if ADMIN) */}
            {isAdmin && (
              <Card className="bg-surface border-border select-none">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Shield className="h-4.5 w-4.5 text-warning" />
                    System Role Access Directory
                  </CardTitle>
                  <CardDescription>Listed default user logins for this workspace environment</CardDescription>
                </CardHeader>
                <CardContent>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow hoverable={false}>
                          <TableHeaderCell>User Name</TableHeaderCell>
                          <TableHeaderCell>Email Login</TableHeaderCell>
                          <TableHeaderCell>Assigned Role</TableHeaderCell>
                          <TableHeaderCell>Status</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {systemUsers.map((su) => (
                          <TableRow key={su.email}>
                            <TableCell className="font-semibold text-foreground">{su.name}</TableCell>
                            <TableCell className="font-mono text-xs text-secondary-text">{su.email}</TableCell>
                            <TableCell>
                              <StatusBadge status={su.role} />
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-success-very-light text-success dark:bg-success/10 border border-success/20">
                                {su.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
