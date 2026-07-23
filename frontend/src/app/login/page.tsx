"use client";

import Image from "next/image";
import { useState } from "react";
import { login, signup } from "@/actions/auth";

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
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);

    try {
      const action = mode === "login" ? login : signup;
      const result = await action(formData);

      // If we get here, the redirect didn't happen → there was an error
      if (result?.error) {
        setError(result.error);
      }
    } catch (err: unknown) {
      // redirect() throws a NEXT_REDIRECT error — this is expected
      // if the error is a redirect, just let it happen
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
        return;
      }
      setError("Something went wrong. Please try again.");
    } finally {
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
              <CardTitle className="text-2xl font-bold">
                {mode === "login" ? "Login" : "Create Account"}
              </CardTitle>
              <CardDescription>
                {mode === "login"
                  ? "Enter your email below to login to your account."
                  : "Set up your password to get started."}
              </CardDescription>
            </CardHeader>
            <form action={handleSubmit} className="flex flex-col gap-6">
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}
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
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-semibold shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all"
                  disabled={loading}
                >
                  {loading 
                    ? (mode === "login" ? "Signing in..." : "Creating account...") 
                    : (mode === "login" ? "Sign in" : "Create Account")}
                </Button>
                
                <div className="relative w-full">
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
                  }}
                  disabled={loading}
                >
                  {mode === "login" ? "Set up your password" : "Back to Login"}
                </Button>
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
