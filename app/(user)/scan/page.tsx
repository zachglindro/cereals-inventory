import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

export default function Update() {
  return (
    <div className="flex items-center justify-center h-full">
      <Button variant="default">
        <Camera />Scan QR
      </Button>
    </div>
  );
}
