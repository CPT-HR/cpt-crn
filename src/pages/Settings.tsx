
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import SignaturePad from '@/components/SignaturePad';
import { Loader2 } from "lucide-react";

const Settings: React.FC = () => {
  const { user, saveSignature } = useAuth();
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSignatureSave = async (signature: string) => {
    setIsSaving(true);
    try {
      await saveSignature(signature);
      setIsSignatureModalOpen(false);
    } catch (error) {
      // Error is already handled in saveSignature function
      console.error('Failed to save signature:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <h1 className="text-3xl font-bold">Postavke</h1>
      
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
