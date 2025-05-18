
import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface SignaturePadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
  title: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ isOpen, onClose, onSave, title }) => {
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  
  const clear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };
  
  const save = () => {
    if (sigCanvas.current && !isEmpty) {
      const dataURL = sigCanvas.current.toDataURL('image/png');
      onSave(dataURL);
      onClose();
    }
  };
  
  const handleBegin = () => {
    setIsEmpty(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="signature-pad">
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              className: "signature-canvas"
            }}
            onBegin={handleBegin}
          />
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={clear}>
            Očisti
          </Button>
          <Button onClick={save} disabled={isEmpty}>
            Spremi potpis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignaturePad;
