import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useToast } from '@/components/ui/use-toast';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import DatePicker from './DatePicker';
import SignaturePad from './SignaturePad';

const formSchema = z.object({
  orderNumber: z.string().min(1, 'Broj naloga je obavezan'),
  date: z.date({ required_error: 'Datum je obavezan' }),
  clientCompanyName: z.string().min(1, 'Naziv tvrtke je obavezan'),
  clientCompanyAddress: z.string().min(1, 'Adresa tvrtke je obavezna'),
  clientOib: z.string().min(1, 'OIB je obavezan'),
  clientFirstName: z.string().min(1, 'Ime je obavezno'),
  clientLastName: z.string().min(1, 'Prezime je obavezno'),
  clientMobile: z.string().min(1, 'Mobitel je obavezan'),
  clientEmail: z.string().email('Neispravan email'),
  description: z.string().optional(),
  foundCondition: z.string().optional(),
  performedWork: z.string().optional(),
  technicianComment: z.string().optional(),
  hours: z.number().optional(),
  distance: z.number().optional(),
  orderForCustomer: z.boolean().default(false),
  customerCompanyName: z.string().optional(),
  customerCompanyAddress: z.string().optional(),
  customerOib: z.string().optional(),
  customerFirstName: z.string().optional(),
  customerLastName: z.string().optional(),
  customerMobile: z.string().optional(),
  customerEmail: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, {
    message: 'Neispravan email'
  }),
});

type FormData = z.infer<typeof formSchema>;

const WorkOrderForm: React.FC = () => {
  const { user } = useAuth();
  const { data: employeeProfile, isLoading: profileLoading, error: profileError } = useEmployeeProfile();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [technicianSignature, setTechnicianSignature] = useState<string>('');
  const [customerSignature, setCustomerSignature] = useState<string>('');
  const signaturePadRef = useRef<any>(null);
  const customerSignaturePadRef = useRef<any>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      orderForCustomer: false,
    },
  });

  const watchOrderForCustomer = form.watch('orderForCustomer');

  const generateOrderNumber = () => {
    const today = new Date();
    const dateStr = format(today, 'yyyyMMdd');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RN-${dateStr}-${randomNum}`;
  };

  const generateOrderNumberHandler = () => {
    const orderNumber = generateOrderNumber();
    form.setValue('orderNumber', orderNumber);
  };

  const saveToSupabase = async (data: FormData) => {
    if (!employeeProfile?.id) {
      throw new Error('Employee profile not found');
    }

    console.log('Saving work order with employee_profile_id:', employeeProfile.id);

    const workOrderData = {
      order_number: data.orderNumber,
      date: format(data.date, 'yyyy-MM-dd'),
      employee_profile_id: employeeProfile.id, // Using employee_profile_id instead of user_id
      client_company_name: data.clientCompanyName,
      client_company_address: data.clientCompanyAddress,
      client_oib: data.clientOib,
      client_first_name: data.clientFirstName,
      client_last_name: data.clientLastName,
      client_mobile: data.clientMobile,
      client_email: data.clientEmail,
      description: data.description || null,
      found_condition: data.foundCondition || null,
      performed_work: data.performedWork || null,
      technician_comment: data.technicianComment || null,
      technician_signature: technicianSignature || null,
      customer_signature: customerSignature || null,
      hours: data.hours || null,
      distance: data.distance || null,
      order_for_customer: data.orderForCustomer,
      customer_company_name: data.customerCompanyName || null,
      customer_company_address: data.customerCompanyAddress || null,
      customer_oib: data.customerOib || null,
      customer_first_name: data.customerFirstName || null,
      customer_last_name: data.customerLastName || null,
      customer_mobile: data.customerMobile || null,
      customer_email: data.customerEmail || null,
    };

    const { data: savedData, error } = await supabase
      .from('work_orders')
      .insert([workOrderData])
      .select()
      .single();

    if (error) {
      console.error('Error saving work order:', error);
      throw error;
    }

    console.log('Work order saved successfully:', savedData);
    return savedData;
  };

  const onSubmit = async (data: FormData) => {
    if (!employeeProfile?.id) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Profil zaposlenika nije pronađen",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await saveToSupabase(data);
      
      toast({
        title: "Uspjeh",
        description: "Radni nalog je uspješno kreiran",
      });

      // Reset form
      form.reset({
        date: new Date(),
        orderForCustomer: false,
      });
      setTechnicianSignature('');
      setCustomerSignature('');
      signaturePadRef.current?.clear();
      customerSignaturePadRef.current?.clear();
      
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Došlo je do greške pri kreiranju radnog naloga",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center">
          <div>Učitavanje profila...</div>
        </div>
      </div>
    );
  }

  if (profileError || !employeeProfile) {
    return (
      <div className="container py-6">
        <div className="text-red-500">
          Greška: Nema pristupa profilu zaposlenika. Molimo kontaktirajte administratora.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Osnovni podaci radnog naloga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Broj naloga</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={generateOrderNumberHandler}
                        >
                          Generiraj
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Datum</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onDateChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Podaci o klijentu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientCompanyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Naziv tvrtke</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientCompanyAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresa tvrtke</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientOib"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OIB</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ime</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prezime</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientMobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobitel</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="clientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Opis kvara i radova</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opis kvara</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Unesite opis kvara" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="foundCondition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zatečeno stanje</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Unesite zatečeno stanje" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="performedWork"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Izvedeni radovi</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Unesite izvedene radove" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="technicianComment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Komentar tehničara</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Unesite komentar tehničara" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vrijeme i udaljenost</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Broj sati</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="distance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Udaljenost (km)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Narudžba za kupca</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="orderForCustomer"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Narudžba za kupca
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Označite ako se radi o narudžbi za kupca
                      </p>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {watchOrderForCustomer && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerCompanyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Naziv tvrtke (kupac)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerCompanyAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresa tvrtke (kupac)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerOib"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OIB (kupac)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerFirstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ime (kupac)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerLastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prezime (kupac)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerMobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobitel (kupac)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (kupac)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Potpis tehničara</CardTitle>
            </CardHeader>
            <CardContent>
              <SignaturePad 
                ref={signaturePadRef}
                onSave={setTechnicianSignature}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-[150px]"
            >
              {isSubmitting ? 'Kreiranje...' : 'Kreiraj radni nalog'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default WorkOrderForm;
