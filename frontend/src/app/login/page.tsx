"use client";

import Image from "next/image";
import { useState } from "react";
import { login, signup, adminUpdatePassword } from "@/actions/auth";
import { KeyRound, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup" | "admin_reset">("login");

  // Read URL query parameters for deactivation or auth error messages
  useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "account_deactivated") {
        setError("Your account has been deactivated. Please contact your administrator.");
      }
    }
  });

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === "admin_reset") {
        const result = await adminUpdatePassword(formData);
        if (result?.error) {
          setError(result.error);
          setLoading(false);
        } else if (result?.success) {
          setSuccessMsg(result.message || "Password updated successfully!");
          setLoading(false);
        }
        return;
      }

      const action = mode === "login" ? login : signup;
      const result = await action(formData);

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else if (result?.success) {
        window.location.href = "/dashboard";
      }
    } catch (err: unknown) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center justify-center mb-2">
            <Image src="/logo.png" alt="Foremark Logo" width={48} height={48} className="object-contain" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Foremark ILMS
          </h1>
          <p className="text-muted-foreground">
            Sign in to manage your internal leads and pipeline
          </p>
        </div>

        <div className="relative group">
          {/* Subtle Orange Glow behind the card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-primary/10 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          
          <Card className="relative border-border bg-card/95 backdrop-blur-sm shadow-2xl">
            <CardHeader className="space-y-1 pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  {mode === "admin_reset" && <ShieldCheck className="w-6 h-6 text-primary" />}
                  {mode === "login" 
                    ? "Login" 
                    : mode === "signup" 
                    ? "Create Account" 
                    : "Admin Password Update"}
                </CardTitle>
                {mode === "admin_reset" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setMode("login");
                      setError(null);
                      setSuccessMsg(null);
                    }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    Login
                  </Button>
                )}
              </div>
              <CardDescription>
                {mode === "login"
                  ? "Enter your email below to login to your account."
                  : mode === "signup"
                  ? "Set up your password to get started."
                  : "Authorize with Admin credentials to update password for any user or admin."}
              </CardDescription>
            </CardHeader>
            <form action={handleSubmit} className="flex flex-col gap-6">
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}

                {successMsg && (
                  <div className="p-3.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                    <div>
                      <p className="font-medium">{successMsg}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You can now return to the login screen and sign in with the new password.
                      </p>
                    </div>
                  </div>
                )}

                {mode === "admin_reset" ? (
                  <>
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Admin Authorization
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminEmail" className="text-xs">Admin Email</Label>
                        <Input 
                          id="adminEmail" 
                          name="adminEmail" 
                          type="email" 
                          placeholder="admin@foremark.in" 
                          required 
                          className="bg-background h-9 text-sm" 
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminPassword" className="text-xs">Admin Password</Label>
                        <Input 
                          id="adminPassword" 
                          name="adminPassword" 
                          type="password" 
                          placeholder="••••••••"
                          required 
                          className="bg-background h-9 text-sm" 
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider">
                        <KeyRound className="w-3.5 h-3.5 text-primary" />
                        Target User & New Password
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="targetEmail" className="text-xs">Target User Email</Label>
                        <Input 
                          id="targetEmail" 
                          name="targetEmail" 
                          type="email" 
                          placeholder="user@foremark.in" 
                          required 
                          className="bg-background h-9 text-sm" 
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-xs">New Password</Label>
                        <Input 
                          id="newPassword" 
                          name="newPassword" 
                          type="password" 
                          placeholder="••••••••"
                          required 
                          minLength={8}
                          className="bg-background h-9 text-sm" 
                          disabled={loading}
                        />
                        <p className="text-[11px] text-muted-foreground">Minimum 8 characters</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-xs">Confirm New Password</Label>
                        <Input 
                          id="confirmPassword" 
                          name="confirmPassword" 
                          type="password" 
                          placeholder="••••••••"
                          required 
                          minLength={8}
                          className="bg-background h-9 text-sm" 
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        placeholder="m@foremark.in" 
                        required 
                        className="bg-background" 
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        name="password" 
                        type="password" 
                        placeholder="••••••••"
                        required 
                        className="bg-background" 
                        disabled={loading}
                        minLength={mode === "signup" ? 8 : undefined}
                      />
                      {mode === "signup" && (
                        <p className="text-xs text-muted-foreground">
                          Minimum 8 characters
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-semibold shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all"
                  disabled={loading}
                >
                  {loading 
                    ? (mode === "login" 
                        ? "Signing in..." 
                        : mode === "signup" 
                        ? "Creating account..." 
                        : "Updating password...") 
                    : (mode === "login" 
                        ? "Sign in" 
                        : mode === "signup" 
                        ? "Create Account" 
                        : "Update Password")}
                </Button>
                
                {mode !== "admin_reset" ? (
                  <>
                    <div className="relative w-full my-1">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          {mode === "login" ? "New here?" : "Already have an account?"}
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full bg-background hover:bg-secondary"
                      onClick={() => {
                        setMode(mode === "login" ? "signup" : "login");
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      disabled={loading}
                    >
                      {mode === "login" ? "Set up your password" : "Back to Login"}
                    </Button>

                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5 pt-1"
                      onClick={() => {
                        setMode("admin_reset");
                        setError(null);
                        setSuccessMsg(null);
                      }}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                      <span>Admin: Update User / Admin Password</span>
                    </button>
                  </>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full bg-background hover:bg-secondary"
                    onClick={() => {
                      setMode("login");
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    disabled={loading}
                  >
                    Back to Login
                  </Button>
                )}
              </CardFooter>
            </form>
          </Card>
        </div>
        
        <div className="text-center">
          <span className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Invite-Only Access
          </span>
          <p className="text-xs text-muted-foreground mt-2">
            Only pre-approved team members can sign in.
          </p>
        </div>
      </div>
    </div>
  );
}
