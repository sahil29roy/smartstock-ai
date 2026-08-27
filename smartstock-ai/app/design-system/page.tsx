"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, KpiCard } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { TableContainer, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, TablePagination } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { SearchInput } from "@/components/common/search-input";
import { LoadingTable, LoadingCards, LoadingSpinner } from "@/components/feedback/loading-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Package, Plus, Edit2, Trash2, HelpCircle } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState("forms");
  const { theme, setTheme } = useTheme();

  // Tab configurations
  const tabItems = [
    { id: "forms", label: "Forms & Buttons" },
    { id: "data", label: "Data Grid & Cards" },
    { id: "overlays", label: "Overlays & Theme" },
    { id: "feedback", label: "States & Feedback" },
  ];

  // Dialog and Confirm states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Switch and checkbox values
  const [autoReorder, setAutoReorder] = useState(true);
  const [sendAlerts, setSendAlerts] = useState(false);

  // Mock Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Mock Business Inventory Data
  const mockInventory = [
    { name: "Laptop", sku: "LAP-001", stock: 42, status: "IN_STOCK" },
    { name: "Keyboard", sku: "KEY-023", stock: 7, status: "LOW_STOCK" },
    { name: "Mouse", sku: "MOU-018", stock: 0, status: "OUT_OF_STOCK" },
  ];

  const headerActions = (
    <Button variant="primary" size="sm">
      <Plus className="h-4 w-4" />
      Add Product
    </Button>
  );

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Component Testing Console"
          description="Internal console to verify reusable UI components and theme variables in simulated application scenarios."
          actions={headerActions}
        />

        {/* Tab selection */}
        <Tabs items={tabItems} activeId={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* ================= FORMS & BUTTONS TAB ================= */}
        {activeTab === "forms" && (
          <div className="space-y-6">
            {/* Buttons Matrix Card */}
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
                <CardDescription>
                  Standard action triggers for adding, modifying, and canceling transactions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="primary" size="sm">
                    <Plus className="h-4 w-4" />
                    + Add Product
                  </Button>
                  <Button variant="secondary" size="md">
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="md">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm">
                    Save Changes
                  </Button>
                </div>
                <Separator />
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="primary" disabled>Disabled Action</Button>
                </div>
              </CardContent>
            </Card>

            {/* Inputs & Form Controls Card */}
            <Card>
              <CardHeader>
                <CardTitle>Form Controls</CardTitle>
                <CardDescription>
                  User data fields with validation and input states.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Input Text</label>
                    <Input placeholder="Enter product name..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Search Input</label>
                    <SearchInput placeholder="Filter sku, brands..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Number Input</label>
                    <Input type="number" defaultValue="42" placeholder="Quantity" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Select Dropdown</label>
                    <Select>
                      <option value="">Choose category...</option>
                      <option value="electronics">Electronics</option>
                      <option value="perishables">Perishables</option>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Textarea Input</label>
                    <Textarea placeholder="Add internal description notes for warehouse handlers..." />
                  </div>
                  <div className="flex flex-col gap-4 pt-2">
                    <Checkbox
                      label="Enforce reorder notification threshold alerts"
                      checked={autoReorder}
                      onChange={(e) => setAutoReorder(e.target.checked)}
                    />
                    <Switch
                      label="SMS/Email notifications on receipt"
                      checked={sendAlerts}
                      onChange={(e) => setSendAlerts(e.target.checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ================= DATA GRID & CARDS TAB ================= */}
        {activeTab === "data" && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard
                title="Total Products"
                value="1,248"
                change="+8.2%"
                changeType="increase"
                icon={<Package className="h-4 w-4" />}
                description="this month"
              />
              <KpiCard
                title="Total Stock Value"
                value="$45,820.00"
                change="+12.4%"
                changeType="increase"
                description="since last quarter"
              />
              <KpiCard
                title="Low Stock Alerts"
                value="3 Items"
                change="Critical"
                changeType="decrease"
                description="immediate review required"
              />
            </div>

            {/* Business Data Table Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Inventory Table</CardTitle>
                    <CardDescription>
                      Verifying tabular alignments, spacing density, and state representations.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge status="IN_STOCK" />
                    <StatusBadge status="LOW_STOCK" />
                    <StatusBadge status="OUT_OF_STOCK" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow hoverable={false}>
                        <TableHeaderCell>Product</TableHeaderCell>
                        <TableHeaderCell>SKU</TableHeaderCell>
                        <TableHeaderCell>Stock</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockInventory.map((item) => (
                        <TableRow key={item.sku}>
                          <TableCell className="font-semibold text-foreground">{item.name}</TableCell>
                          <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                          <TableCell className="text-secondary-text font-semibold">{item.stock} units</TableCell>
                          <TableCell>
                            <StatusBadge status={item.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button variant="outline" size="sm" className="h-7 py-0 px-2.5">
                                Edit
                              </Button>
                              <Button variant="destructive" size="sm" className="h-7 py-0 px-2.5">
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={5}
                    totalItems={15}
                    itemsPerPage={3}
                    onPageChange={setCurrentPage}
                  />
                </TableContainer>
              </CardContent>
            </Card>

            {/* Badges Overview Grid */}
            <Card>
              <CardHeader>
                <CardTitle>Status Badges</CardTitle>
                <CardDescription>
                  Semantic context alerts and inventory health indications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-secondary-text mb-2">Inventory Status Badges</h4>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status="IN_STOCK" />
                    <StatusBadge status="LOW_STOCK" />
                    <StatusBadge status="OUT_OF_STOCK" />
                    <StatusBadge status="PENDING" />
                    <StatusBadge status="COMPLETED" />
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="text-xs font-semibold text-secondary-text mb-2">Standard Color Badges</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="success">Success Badge</Badge>
                    <Badge variant="warning">Warning Badge</Badge>
                    <Badge variant="danger">Danger Badge</Badge>
                    <Badge variant="neutral">Neutral Badge</Badge>
                    <Badge variant="primary">Primary Badge</Badge>
                    <Badge variant="secondary">Secondary Badge</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ================= OVERLAYS & THEME SWITCHER TAB ================= */}
        {activeTab === "overlays" && (
          <div className="space-y-6">
            {/* Overlays Card */}
            <Card>
              <CardHeader>
                <CardTitle>Overlay Dialogs & Dropdowns</CardTitle>
                <CardDescription>
                  Triggering action overlays and information popovers.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Button variant="primary" onClick={() => setIsDialogOpen(true)}>
                  Open Dialog Form
                </Button>
                <Button variant="destructive" onClick={() => setIsConfirmOpen(true)}>
                  Open Delete Confirmation
                </Button>
                <Tooltip content="Tooltip showing helpful documentation notes">
                  <Button variant="outline">
                    <HelpCircle className="h-4 w-4" />
                    Hover for Tooltip
                  </Button>
                </Tooltip>
              </CardContent>
            </Card>

            {/* Theme Switcher Verification */}
            <Card>
              <CardHeader>
                <CardTitle>Theme Switcher</CardTitle>
                <CardDescription>
                  Verify application colors adapt cleanly under light, dark, or system presets.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant={theme === "light" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setTheme("light")}
                  >
                    Light Theme
                  </Button>
                  <Button
                    variant={theme === "dark" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setTheme("dark")}
                  >
                    Dark Theme
                  </Button>
                  <Button
                    variant={theme === "system" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setTheme("system")}
                  >
                    System Theme
                  </Button>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface flex items-center justify-between">
                  <span className="text-xs text-secondary-text font-semibold">Active Theme State:</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">{theme}</span>
                </div>
              </CardContent>
            </Card>

            {/* Overlay Modals Render */}
            <Dialog
              isOpen={isDialogOpen}
              onClose={() => setIsDialogOpen(false)}
              title="Category Form"
              footer={
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setIsDialogOpen(false)}>
                    Save Changes
                  </Button>
                </>
              }
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Category Name</label>
                  <Input placeholder="e.g. Storage Goods" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Category Description</label>
                  <Textarea placeholder="Detailed description..." />
                </div>
              </div>
            </Dialog>

            <ConfirmDialog
              isOpen={isConfirmOpen}
              onClose={() => setIsConfirmOpen(false)}
              onConfirm={() => console.log("Confirming delete action")}
              title="Delete Confirmation"
              message="Are you sure you want to delete this record? This action is irreversible."
              variant="destructive"
              confirmLabel="Delete Item"
            />
          </div>
        )}

        {/* ================= STATES & FEEDBACK TAB ================= */}
        {activeTab === "feedback" && (
          <div className="space-y-6">
            {/* Visual States */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Empty State</CardTitle>
                  <CardDescription>Placeholder shown when searches find no match.</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    title="No Products Found"
                    description="No inventory matches your active filter. Try resetting search fields."
                    actionLabel="Reset Filters"
                    onAction={() => console.log("Resetting filters")}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Error State</CardTitle>
                  <CardDescription>Alert shown when service actions fail.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ErrorState
                    title="Data Synced Failure"
                    message="The application failed to synchronize with inventory server. Please verify connection."
                    onRetry={() => console.log("Retrying data sync...")}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Skeletons and Spinners */}
            <Card>
              <CardHeader>
                <CardTitle>Loading States</CardTitle>
                <CardDescription>
                  Placeholders displayed during data retrieval transactions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-secondary-text mb-3">Table Skeleton Mask</h4>
                  <LoadingTable rows={3} cols={4} />
                </div>
                <Separator />
                <div>
                  <h4 className="text-xs font-semibold text-secondary-text mb-3">Card Skeletons</h4>
                  <LoadingCards count={2} />
                </div>
                <Separator />
                <div>
                  <h4 className="text-xs font-semibold text-secondary-text mb-3">Progress Spinner</h4>
                  <LoadingSpinner />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
