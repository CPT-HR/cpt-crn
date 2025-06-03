
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CustomerData {
  customerCompanyName: string;
  customerCompanyAddress: string;
  customerOib: string;
  customerFirstName: string;
  customerLastName: string;
  customerMobile: string;
  customerEmail: string;
}

interface CustomerInfoSectionProps {
  data: CustomerData;
  onChange: (field: keyof CustomerData, value: string) => void;
  countries: string[];
}

const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({ data, onChange, countries }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Podaci o korisniku</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerCompanyName">Ime tvrtke</Label>
            <Input 
              id="customerCompanyName"
              value={data.customerCompanyName} 
              onChange={(e) => onChange('customerCompanyName', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerOib">OIB</Label>
            <Input 
              id="customerOib"
              value={data.customerOib} 
              onChange={(e) => onChange('customerOib', e.target.value)} 
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <Label className="text-base font-medium">Adresa tvrtke</Label>
          <div className="space-y-2">
            <Label htmlFor="customerCompanyAddress">Puna adresa</Label>
            <Input 
              id="customerCompanyAddress"
              value={data.customerCompanyAddress} 
              onChange={(e) => onChange('customerCompanyAddress', e.target.value)} 
              placeholder="Ulica broj, Grad, Država"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerFirstName">Ime</Label>
            <Input 
              id="customerFirstName"
              value={data.customerFirstName} 
              onChange={(e) => onChange('customerFirstName', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerLastName">Prezime</Label>
            <Input 
              id="customerLastName"
              value={data.customerLastName} 
              onChange={(e) => onChange('customerLastName', e.target.value)} 
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerMobile">Broj mobitela</Label>
            <Input 
              id="customerMobile"
              value={data.customerMobile} 
              onChange={(e) => onChange('customerMobile', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email</Label>
            <Input 
              id="customerEmail"
              type="email" 
              value={data.customerEmail} 
              onChange={(e) => onChange('customerEmail', e.target.value)} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerInfoSection;
