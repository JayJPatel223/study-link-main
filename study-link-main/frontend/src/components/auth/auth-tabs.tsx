"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { SignInForm } from "./sign-in";
import { useAuth } from "../../hooks/auth";
import { useState } from "react";
import { authClient } from "@lib/api-client";
import { Card } from "../ui/card";
import { SignupForm } from "./sign-up";

export function AuthTabs() {
  const { setUser, setIsAuthenticated, refreshSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (credentials: {
    email: string;
    password: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await authClient.signIn.email({
        ...credentials,
      });

      if (error) {
        setError(error.message || "Sign in failed");
        return;
      }

      setUser(data.user);
      setIsAuthenticated(true);
      refreshSession();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred during sign in";
      setError(errorMessage);
      console.error("Sign in error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (credentials: {
    email: string;
    password: string;
    name: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await authClient.signUp.email({
        ...credentials,
      });

      if (error) {
        setError(error.message || "Sign up failed");
        return;
      }

      setUser(data.user);
      setIsAuthenticated(true);
      refreshSession();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred during sign up";
      setError(errorMessage);
      console.error("Sign up error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tabs defaultValue="signin" className="w-full max-w-md">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      <Card className="my-2">
        {error && (
          <div className="m-2 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
            {error}
          </div>
        )}
        <TabsContent value="signin">
          <SignInForm onSubmit={handleSignIn} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="signup">
          <SignupForm onSubmit={handleSignUp} isLoading={isLoading} />
        </TabsContent>
      </Card>
    </Tabs>
  );
}
