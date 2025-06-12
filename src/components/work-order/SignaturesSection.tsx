
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SignatureMetadata } from '../SignaturePad';

interface SignaturesSectionProps {
  technicianSignature: string;
  technicianName: string;
  customerSignature: string;
  customerSignerName: string;
  signatureMetadata?: SignatureMetadata;
  orderForCustomer: boolean;
  onCustomerSignerNameChange: (value: string) => void;
  onCustomerSignatureClick: () => void;
}

const SignaturesSection: React.FC<SignaturesSectionProps> = ({
  technicianSignature,
  technicianName,
  customerSignature,
  customerSignerName,
  signatureMetadata,
  orderForCustomer,
  onCustomerSignerNameChange,
  onCustomerSignatureClick
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Potpisi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">Potpis tehničara</Label>
            {technicianSignature ? (
              <div className="border rounded-lg p-4 bg-gray-50">
                <img src={technicianSignature} alt="Tehnician signature" className="max-h-24 mx-auto" />
                <p className="text-center text-sm text-gray-600 mt-2">{technicianName}</p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                Potpis tehničara nije dostupan
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Potpis klijenta</Label>
            <div className="space-y-2">
              <Label htmlFor="customerSignerName">Ime i prezime potpisnika <span className="text-red-500">*</span></Label>
              <Input
                id="customerSignerName"
                value={customerSignerName}
                onChange={(e) => onCustomerSignerNameChange(e.target.value)}
                placeholder={
                  orderForCustomer 
                    ? "Ime i prezime predstavnika korisnika" 
                    : "Ime i prezime predstavnika naručitelja"
                }
                required
              />
            </div>
            {customerSignature ? (
              <div className="border rounded-lg p-4 bg-gray-50 cursor-pointer" onClick={onCustomerSignatureClick}>
                <img src={customerSignature} alt="Customer signature" className="max-h-24 mx-auto" />
                <p className="text-center text-sm text-gray-600 mt-2">Kliknite za promjenu potpisa</p>
                {signatureMetadata && (
                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                    {signatureMetadata.timestamp && (
                      <p>Vrijeme: {signatureMetadata.timestamp}</p>
                    )}
                    {signatureMetadata.coordinates && (
                      <p>Koordinate: {signatureMetadata.coordinates.latitude.toFixed(6)}, {signatureMetadata.coordinates.longitude.toFixed(6)}</p>
                    )}
                    {signatureMetadata.address && (
                      <p>Adresa: {signatureMetadata.address}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-24 border-2 border-dashed" 
                onClick={onCustomerSignatureClick}
              >
                Kliknite za dodavanje potpisa klijenta
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignaturesSection;
