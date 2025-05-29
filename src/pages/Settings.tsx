import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import SignaturePad from '@/components/SignaturePad';
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Settings: React.FC = () => {
  const { user, saveSignature, saveCompanyAddress, saveDistanceMatrixApiKey } = useAuth();
  const { toast } = useToast();
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [companyAddress, setCompanyAddress] = useState(user?.companyAddress || '');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [apiKey, setApiKey] = useState(user?.distanceMatrixApiKey || '');
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);

  const handleSignatureSave = async (signature: string) => {
    setIsSaving(true);
    try {
      await saveSignature(signature);
      setIsSignatureModalOpen(false);
    } catch (error) {
      console.error('Failed to save signature:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddressSave = async () => {
    setIsSavingAddress(true);
    try {
      await saveCompanyAddress(companyAddress);
    } catch (error) {
      console.error('Failed to save company address:', error);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleApiKeySave = async () => {
    setIsSavingApiKey(true);
    try {
      await saveDistanceMatrixApiKey(apiKey);
      toast({
        title: "API ključ spremljen",
        description: "DistanceMatrix.ai API ključ je uspješno spremljen",
      });
    } catch (error) {
      console.error('Failed to save API key:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do pogreške prilikom spremanja API ključa",
      });
    } finally {
      setIsSavingApiKey(false);
    }
  };

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <h1 className="text-3xl font-bold">Postavke</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Adresa sjedišta tvrtke</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Adresa se koristi za automatsko računanje udaljenosti do lokacije izvođenja radova.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="companyAddress">Adresa sjedišta</Label>
            <Input
              id="companyAddress"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="Unesite adresu sjedišta tvrtke"
            />
          </div>
          
          <Button 
            onClick={handleAddressSave}
            disabled={isSavingAddress || !companyAddress.trim()}
          >
            {isSavingAddress && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Spremi adresu
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Vaš potpis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Vaš potpis se automatski dodaje na sve radne naloge koje kreirate. 
            Potpis je sinkroniziran napříč svim vašim uređajima.
          </p>
          
          <div className="border rounded bg-gray-50 p-4 flex flex-col items-center justify-center min-h-[150px]">
            {user?.signature ? (
              <img 
                src={user.signature} 
                alt="Vaš potpis" 
                className="max-h-32" 
              />
            ) : (
              <p className="text-muted-foreground">Nemate spremljen potpis</p>
            )}
          </div>
          
          <Button 
            onClick={() => setIsSignatureModalOpen(true)}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {user?.signature ? 'Promijeni potpis' : 'Dodaj potpis'}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>DistanceMatrix.ai API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            API ključ se koristi za automatsko računanje udaljenosti između adresa. 
            Možete ga dobiti na{' '}
            <a 
              href="https://distancematrix.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              distancematrix.ai
            </a>
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">API ključ</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Unesite vaš DistanceMatrix.ai API ključ"
            />
          </div>
          
          <Button 
            onClick={handleApiKeySave}
            disabled={isSavingApiKey || !apiKey.trim()}
          >
            {isSavingApiKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Spremi API ključ
          </Button>
        </CardContent>
      </Card>
      
      <SignaturePad
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSignatureSave}
        title="Vaš potpis"
      />
    </div>
  );
};

export default Settings;
