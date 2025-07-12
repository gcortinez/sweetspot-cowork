"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function TestLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [loginResult, setLoginResult] = useState<any>(null);
  const { login, isLoading, error } = useAuth();

  const handleLogin = async () => {
    setLoginResult(null);
    try {
      const result = await login({
        email,
        password,
        tenantSlug: tenantSlug || undefined,
      });
      setLoginResult(result);
    } catch (err) {
      setLoginResult({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Test Login Error Messages</h1>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@example.com"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password123"
          />
        </div>

        <div>
          <Label htmlFor="tenantSlug">Tenant Slug (Optional)</Label>
          <Input
            id="tenantSlug"
            type="text"
            value={tenantSlug}
            onChange={(e) => setTenantSlug(e.target.value)}
            placeholder="my-workspace"
          />
        </div>

        <Button onClick={handleLogin} disabled={isLoading}>
          {isLoading ? "Loading..." : "Test Login"}
        </Button>
      </div>

      {/* Display auth context error */}
      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Auth Context Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Display login result */}
      {loginResult && (
        <div className="mt-6 p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Login Result:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(loginResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Test scenarios */}
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">Test Scenarios:</h2>
        
        <div className="space-y-2 text-sm">
          <button
            onClick={() => {
              setEmail("notanemail");
              setPassword("password123");
              setTenantSlug("");
            }}
            className="text-blue-600 hover:underline block"
          >
            1. Invalid email format
          </button>
          
          <button
            onClick={() => {
              setEmail("test@example.com");
              setPassword("wrongpassword");
              setTenantSlug("");
            }}
            className="text-blue-600 hover:underline block"
          >
            2. Wrong password
          </button>
          
          <button
            onClick={() => {
              setEmail("nonexistent@example.com");
              setPassword("password123");
              setTenantSlug("");
            }}
            className="text-blue-600 hover:underline block"
          >
            3. Non-existent user
          </button>
          
          <button
            onClick={() => {
              setEmail("test@example.com");
              setPassword("password123");
              setTenantSlug("invalid-tenant");
            }}
            className="text-blue-600 hover:underline block"
          >
            4. Invalid tenant
          </button>
        </div>
      </div>
    </div>
  );
}