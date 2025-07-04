"use client"
import { useState } from "react";
import { QRScanner } from "@/components/scanner";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

export default function Update() {
  const [showScanner, setShowScanner] = useState(false);
  return (
    <div className="flex items-center justify-center h-full">
      {!showScanner ? (
        <Button variant="default" onClick={() => setShowScanner(true)}>
          <Camera />Scan QR
        </Button>
      ) : (
        <QRScanner />
      )}
    </div>
  );
}
