import Link from "next/link";
import { Briefcase } from "lucide-react";

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
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center justify-center p-3 rounded-full bg-primary/10 mb-2">
            <Briefcase className="w-8 h-8 text-primary" />
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
              <CardTitle className="text-2xl font-bold">Login</CardTitle>
              <CardDescription>
                Enter your email below to login to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@foremark.com" required className="bg-background" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="#"
                    className="text-sm font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input id="password" type="password" required className="bg-background" />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full h-11 text-base font-semibold shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all">Sign in</Button>
              
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 w-full">
                <Button variant="outline" className="w-full bg-background hover:bg-secondary">
                  Google
                </Button>
                <Button variant="outline" className="w-full bg-background hover:bg-secondary">
                  Microsoft
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        <div className="text-center">
          <span className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Mock Authentication UI
          </span>
          <p className="text-xs text-muted-foreground mt-2">
            Next Phase will integrate with Supabase Auth
          </p>
        </div>
      </div>
    </div>
  );
}
