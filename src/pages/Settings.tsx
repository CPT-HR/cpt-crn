
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import SignaturePad from '@/components/SignaturePad';

const Settings: React.FC = () => {
  const { user, saveSignature } = useAuth();
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  const handleSignatureSave = (signature: string) => {
    saveSignature(signature);
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
          
          <Button onClick={() => setIsSignatureModalOpen(true)}>
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
