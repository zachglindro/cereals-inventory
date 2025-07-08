"use client"
import { useState } from "react";
import { QRScanner } from "@/components/scanner";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner"; // Assuming a Spinner component exists
import QRCode from "react-qr-code";
import { v4 as uuidv4 } from 'uuid';
import { db } from "@/lib/firebase"; // Assuming firebase config is exported as db
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";

export default function Update() {
  const [showScanner, setShowScanner] = useState(false);
  const [showGenerateQrDialog, setShowGenerateQrDialog] = useState(false);
  const [boxNumberInput, setBoxNumberInput] = useState("");
  const [generatedUuid, setGeneratedUuid] = useState("");
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateQr = async () => {
    setError("");
    setGeneratedUuid("");
    setIsLoadingQr(true);

    const boxNumber = parseInt(boxNumberInput, 10);

    if (isNaN(boxNumber) || boxNumber <= 0) {
      setError("Please enter a valid positive integer for the box number.");
      setIsLoadingQr(false);
      return;
    }

    try {
      const qrcodesRef = collection(db, "qrcodes");
      const q = query(qrcodesRef, where("box_number", "==", boxNumber));
      const querySnapshot = await getDocs(q);

      let uuid;
      if (!querySnapshot.empty) {
        // Box number exists, retrieve UUID
        uuid = querySnapshot.docs[0].data().uuid;
      } else {
        // Box number does not exist, generate new UUID and add to collection
        uuid = uuidv4();
        await addDoc(qrcodesRef, {
          box_number: boxNumber,
          uuid: uuid,
        });
      }
      setGeneratedUuid(uuid);
    } catch (e) {
      console.error("Error generating QR code:", e);
      setError("An error occurred while generating the QR code.");
    } finally {
      setIsLoadingQr(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      {!showScanner ? (
        <>
          <Button variant="default" onClick={() => setShowScanner(true)} className="mr-2">
            <Camera className="mr-2 h-4 w-4" />Scan QR
          </Button>
          <Button variant="outline" onClick={() => setShowGenerateQrDialog(true)}>
            Generate QR
          </Button>
        </>
      ) : (
        <QRScanner />
      )}

      <Dialog open={showGenerateQrDialog} onOpenChange={setShowGenerateQrDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate QR Code</DialogTitle>
            <DialogDescription>
              Enter the box number to generate a QR code.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="boxNumber" className="text-right">
                Box Number
              </Label>
              <Input
                id="boxNumber"
                type="number"
                value={boxNumberInput}
                onChange={(e) => setBoxNumberInput(e.target.value)}
                className="col-span-3"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {generatedUuid && (
              <div className="flex justify-center">
                <QRCode value={generatedUuid} size={256} level="H" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleGenerateQr} disabled={isLoadingQr}>
              {isLoadingQr ? <Spinner className="mr-2" /> : null}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
