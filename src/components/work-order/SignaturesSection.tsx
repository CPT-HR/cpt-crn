
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { SignatureMetadata } from '../SignaturePad';

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
      <CardContent className="space-y-4">
        <div>
          <Label>Potpis tehničara</Label>
          <div className="mt-2 p-2 border rounded bg-gray-50">
            {technicianSignature ? (
              <div className="flex flex-col items-center">
                <img 
                  src={technicianSignature} 
                  alt="Potpis tehničara" 
                  className="max-h-20 mx-auto"
                />
                <p className="text-sm text-gray-600 mt-2">{technicianName}</p>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-4">
                Potpis nije postavljen. Postavite potpis u vašim postavkama.
              </div>
            )}
          </div>
        </div>
        
        <Separator />
        
        <div>
          <Label>Potpis klijenta</Label>
          <div className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor="customerSignerName">Ime i prezime potpisnika</Label>
              <Input 
                id="customerSignerName"
                value={customerSignerName}
                onChange={(e) => onCustomerSignerNameChange(e.target.value)}
                placeholder="Automatski se popunjava na osnovu unesenih podataka"
                required
              />
              <p className="text-xs text-gray-500">
                Ime se automatski popunjava na osnovu podataka {orderForCustomer ? 'korisnika (ili naručitelja ako nema podataka korisnika)' : 'naručitelja'}
              </p>
            </div>
            <div 
              className="mt-2 p-2 border rounded bg-gray-50 cursor-pointer min-h-[80px] flex items-center justify-center"
              onClick={onCustomerSignatureClick}
            >
              {customerSignature ? (
                <div className="flex flex-col items-center w-full">
                  <img 
                    src={customerSignature} 
                    alt="Potpis klijenta" 
                    className="max-h-20 mx-auto" 
                  />
                  {signatureMetadata && (
                    <div className="text-[10px] text-gray-500 mt-2 text-center w-full space-y-1">
                      <p className="font-medium">
                        Datum i vrijeme: {signatureMetadata.timestamp}
                      </p>
                      {signatureMetadata.coordinates && (
                        <p className="break-all">
                          Koordinate: {signatureMetadata.coordinates.latitude.toFixed(6)}, {signatureMetadata.coordinates.longitude.toFixed(6)}
                        </p>
                      )}
                      {signatureMetadata.address && (
                        <p className="break-words text-center max-w-full">
                          Lokacija: {signatureMetadata.address}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  Kliknite za dodavanje potpisa klijenta
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignaturesSection;
