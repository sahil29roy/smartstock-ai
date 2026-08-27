"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, Warehouse } from "lucide-react";
import { z } from "zod";

const loginFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const LoginForm = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setApiError(null);

    // Validate using Zod schema
    const result = loginFormSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setFormErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
    } catch (err: unknown) {
      console.error("Login submission error:", err);
      // Friendly, non-sensitive error messages
      const status = typeof err === "object" && err !== null && "status" in err ? (err as { status: number }).status : undefined;
      const message = typeof err === "object" && err !== null && "message" in err ? (err as { message: string }).message : "";

      if (status === 401) {
        setApiError("Invalid email or password.");
      } else if (status === 400) {
        setApiError("Please provide both email and password.");
      } else if (message && message.includes("fetch")) {
        setApiError("Unable to connect to the server. Please check your network.");
      } else {
        setApiError("An unexpected server error occurred. Please try again later.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-0">
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="p-3 rounded-xl bg-primary-very-light dark:bg-primary-light/10 text-primary mb-3">
          <Warehouse className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground select-none">
          SmartStock <span className="text-primary font-semibold">AI</span>
        </h1>
        <p className="text-xs text-secondary-text font-medium mt-1 select-none">
          Enterprise Resource Planning & Inventory Console
        </p>
      </div>

      <Card className="border-border/80 shadow-md bg-surface">
        <CardHeader className="pb-4 select-none">
          <CardTitle className="text-lg font-bold">Welcome back</CardTitle>
          <CardDescription className="text-xs">
            Sign in to your account to manage warehouse inventory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {apiError && (
              <div className="p-3 rounded-lg border border-danger/25 bg-danger/10 text-danger text-xs font-semibold leading-relaxed animate-fade-in">
                {apiError}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-foreground mb-1.5 select-none">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!formErrors.email}
                icon={<Mail className="h-4 w-4" />}
                disabled={isSubmitting}
                aria-invalid={!!formErrors.email}
                aria-describedby={formErrors.email ? "email-error" : undefined}
              />
              {formErrors.email && (
                <p id="email-error" className="text-[10px] text-danger mt-1 font-medium animate-fade-in">
                  {formErrors.email}
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-foreground select-none">
                  Password
                </label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!formErrors.password}
                  icon={<Lock className="h-4 w-4" />}
                  disabled={isSubmitting}
                  aria-invalid={!!formErrors.password}
                  aria-describedby={formErrors.password ? "password-error" : undefined}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-foreground cursor-pointer focus:outline-none transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formErrors.password && (
                <p id="password-error" className="text-[10px] text-danger mt-1 font-medium animate-fade-in">
                  {formErrors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2 font-semibold h-10 cursor-pointer justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/35 border-t-white" />
                  <span>Signing In...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
