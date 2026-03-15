"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function QRCodeDisplay() {
  const [loginUrl, setLoginUrl] = useState("");

  useEffect(() => {
    // This code runs only on the client, so `window` is available.
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/library-login`;
      setLoginUrl(url);
    }
  }, []);

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="items-center text-center">
        <CardTitle>Library Check-in</CardTitle>
        <CardDescription>
          Scan this code to open the check-in page.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-6">
        {loginUrl ? (
          <div className="bg-white p-4 rounded-lg">
            <QRCode value={loginUrl} size={256} />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-muted-foreground h-[288px] justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Generating QR Code...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
