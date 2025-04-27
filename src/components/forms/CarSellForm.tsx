// src/components/forms/CarSellForm.tsx
'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useTranslations } from 'next-intl'; // Import useTranslations

// --- Mock Form Components (Keep these as they were) ---
type FormValues = { /* ... */
  fullName: string; email: string; phone: string; make: string; model: string; year: string;
  mileage: string; fuelType: string; transmission: string; condition: "new" | "used";
  city: string; askingPrice: string; description: string;
};
function useFormMock() { /* ... implementation ... */
  const [values, setValues] = useState<FormValues>({ fullName: "", email: "", phone: "", make: "", model: "", year: "", mileage: "", fuelType: "", transmission: "", condition: "used", city: "", askingPrice: "", description: "", });
  const handleSubmit = (onSubmit: (data: FormValues) => void) => (e: React.FormEvent) => { e.preventDefault(); onSubmit(values); };
  const reset = () => setValues({ fullName: "", email: "", phone: "", make: "", model: "", year: "", mileage: "", fuelType: "", transmission: "", condition: "used", city: "", askingPrice: "", description: "", });
  const getValues = () => values;
  const control = { field: (name: keyof FormValues) => ({ value: values[name], onChange: (eventOrValue: any) => { const value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue; setValues((prev) => ({ ...prev, [name]: value })); }, name: name, }), };
  return { handleSubmit, control, reset, getValues };
}
const Form = ({ children, ...props }: React.HTMLAttributes<HTMLFormElement>) => (<form {...props}>{children}</form>);
interface FormFieldProps { name: keyof FormValues; control: any; render: (props: { field: { value: any; onChange: (eventOrValue: any) => void; name: keyof FormValues; }; }) => React.ReactNode; }
const FormField = ({ name, control, render }: FormFieldProps) => { const field = control.field(name); return render({ field }); };
const FormItem = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (<div className={cn("space-y-2", className)} {...props}>{children}</div>);
const FormLabel = ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (<Label {...props}>{children}</Label>);
const FormControl = ({ children }: { children: React.ReactNode }) => (<>{children}</>);
const FormMessage = ({ children }: { children?: React.ReactNode }) => children ? <p className="text-sm font-medium text-destructive">{children}</p> : null;
const FormDescription = ({ children }: { children: React.ReactNode }) => (<p className="text-[0.8rem] text-muted-foreground">{children}</p>);
interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> { onValueChange?: (value: string) => void; value?: string; defaultValue?: string; }
const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(({ className, value, defaultValue, onValueChange, ...props }, ref) => (<div ref={ref} className={cn("grid gap-2", className)} role="radiogroup" {...props} />)); RadioGroup.displayName = "RadioGroup";
interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> { value: string; }
const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(({ className, value, ...props }, ref) => (<input ref={ref} type="radio" value={value} className={cn("h-4 w-4 shrink-0 cursor-pointer border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />)); RadioGroupItem.displayName = "RadioGroupItem";
// --- End Mock Form Components ---

function useHasMounted() { const [hasMounted, setHasMounted] = useState(false); useEffect(() => { setHasMounted(true); }, []); return hasMounted; }

export function CarSellForm() {
  const t = useTranslations('CarSellForm'); // Initialize translation hook
  const tCommon = useTranslations('Common'); // Hook for common elements

  const hasMounted = useHasMounted();
  const supabaseRef = React.useRef<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useFormMock();

  useEffect(() => { /* Supabase initialization remains the same */
    if (typeof window !== 'undefined') { try { const { createClient } = require('@/utils/supabase/client'); supabaseRef.current = createClient(); console.log("Supabase client initialized successfully"); } catch (error) { console.error("Failed to initialize Supabase client:", error); } }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ if (e.target.files) { setSelectedFiles(Array.from(e.target.files)); } };

  const onSubmit = async (data: FormValues) => {
    if (!hasMounted) return;
    setIsSubmitting(true); setErrors({}); setSubmitError(null);

    try {
      // Use translated validation messages
      const newErrors: Partial<Record<keyof FormValues, string>> = {};
      if (!data.fullName.trim()) newErrors.fullName = t('validation.nameRequired');
      if (!data.email.trim()) newErrors.email = t('validation.emailRequired');
      else if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = t('validation.emailInvalid');
      if (!data.phone.trim()) newErrors.phone = t('validation.phoneRequired'); // Added phone validation msg key
      if (!data.make.trim()) newErrors.make = t('validation.makeRequired');
      if (!data.model.trim()) newErrors.model = t('validation.modelRequired');
      if (!data.year.trim()) newErrors.year = t('validation.yearRequired');
      else if (!/^\d{4}$/.test(data.year)) newErrors.year = t('validation.yearInvalid');
      if (!data.mileage.trim()) newErrors.mileage = t('validation.mileageRequired');
      else if (isNaN(Number(data.mileage))) newErrors.mileage = t('validation.mileageInvalid');
      if (!data.fuelType) newErrors.fuelType = t('validation.fuelTypeRequired');
      if (!data.transmission) newErrors.transmission = t('validation.transmissionRequired');
      if (!data.condition) newErrors.condition = t('validation.conditionRequired');
      if (!data.city.trim()) newErrors.city = t('validation.cityRequired');
      if (data.askingPrice && isNaN(Number(data.askingPrice))) newErrors.askingPrice = t('validation.priceInvalid');

      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) { setIsSubmitting(false); return; }

      // Supabase logic remains mostly the same...
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const carOfferData = { /* ... construct data ... */
        full_name: String(data.fullName).trim(), email: String(data.email).trim(), phone: String(data.phone).trim(),
        make: String(data.make).trim(), model: String(data.model).trim(), year: String(data.year).trim(),
        mileage: Number(data.mileage.trim()), fuel_type: String(data.fuelType), transmission: String(data.transmission),
        condition: String(data.condition), city: String(data.city).trim(),
        asking_price: data.askingPrice && data.askingPrice.trim() !== '' ? Number(data.askingPrice) : null,
        notes: data.description ? String(data.description).trim() : null, contacted: false,
      };

      const { data: insertedData, error: insertError } = await supabase.from('car_offers').insert([carOfferData]).select();
      if (insertError) throw new Error(`Insert failed: ${insertError.message}`);
      if (!insertedData || insertedData.length === 0) console.warn("Warning: Insert succeeded but no data returned");
      else {
        const offerId = insertedData[0].id;
        if (selectedFiles.length > 0) {
          const uploadedPhotoUrls: string[] = [];
          for (let i = 0; i < selectedFiles.length; i++) { /* ... upload loop ... */
            const file = selectedFiles[i]; const fileExt = file.name.split('.').pop() || 'jpg'; const fileName = `${offerId}/${Date.now()}-${i}.${fileExt}`; const filePath = fileName;
            try { const { error: uploadError } = await supabase.storage.from('vehicle-images').upload(filePath, file, { cacheControl: '3600', upsert: true }); if (uploadError) { console.error(`Error uploading file ${i}:`, uploadError); continue; } const { data: publicUrlData } = supabase.storage.from('vehicle-images').getPublicUrl(filePath); if (publicUrlData?.publicUrl) { uploadedPhotoUrls.push(publicUrlData.publicUrl); } else { console.error(`Failed to get public URL for file ${i}`); } } catch (uploadException) { console.error(`Exception during file ${i} upload:`, uploadException); }
          }
          if (uploadedPhotoUrls.length > 0) {
            try { const { error: updateError } = await supabase.from('car_offers').update({ photo_urls: uploadedPhotoUrls }).eq('id', offerId); if (updateError) { setSubmitError(t('error.updatePhotoUrlError', { message: updateError.message })); } } catch (updateException) { setSubmitError(t('error.updatePhotoUrlException')); }
          } else { console.warn(t('error.noPhotosUploaded')); }
        }
      }
      setIsSuccess(true); form.reset(); setSelectedFiles([]);
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmitError(error instanceof Error ? `Error: ${error.message}` : t('error.submitFallback'));
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasMounted) return null;

  // Success State UI
  if (isSuccess) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-primary">{t('success.title')}</CardTitle>
          <CardDescription className="text-center pt-2">{t('success.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          <div className="rounded-full bg-primary/10 p-4"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
          <h3 className="text-xl font-semibold">{t('success.heading')}</h3>
          <p className="text-center text-muted-foreground max-w-xs">{t('success.confirmation', { email: form.getValues().email || 'the email provided' })}</p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => setIsSuccess(false)} variant="outline">{t('buttons.submitAnother')}</Button>
        </CardFooter>
      </Card>
    );
  }

  // Main Form UI
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('card.title')}</CardTitle>
        <CardDescription>{t('card.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Owner Information Section */}
          <div>
            <h3 className="text-lg font-medium mb-4 border-b pb-2">{t('sections.ownerInfo')}</h3>
            <div className="space-y-4 pt-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('labels.fullName')}<span className="text-red-500 ml-1">{tCommon('requiredIndicator')}</span></FormLabel>
                  <FormControl><Input placeholder={t('placeholders.fullName')} {...field} /></FormControl>
                  <FormMessage>{errors.fullName}</FormMessage>
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('labels.email')}<span className="text-red-500 ml-1">{tCommon('requiredIndicator')}</span></FormLabel>
                  <FormControl><Input type="email" placeholder={t('placeholders.email')} {...field} /></FormControl>
                  <FormMessage>{errors.email}</FormMessage>
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('labels.phone')}<span className="text-red-500 ml-1">{tCommon('requiredIndicator')}</span></FormLabel> {/* Added required indicator based on validation */}
                  <FormControl><Input type="tel" placeholder={t('placeholders.phone')} {...field} /></FormControl>
                  <FormMessage>{errors.phone}</FormMessage>
                </FormItem>
              )} />
            </div>
          </div>

          {/* Car Information Section */}
          <div>
            <h3 className="text-lg font-medium mb-4 border-b pb-2">{t('sections.carInfo')}</h3>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="make" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('labels.make')}<span className="text-red-500 ml-1">{tCommon('requiredIndicator')}</span></FormLabel>
                    <FormControl><Input placeholder={t('placeholders.make')} {...field} /></FormControl>
                    <FormMessage>{errors.make}</FormMessage>
                  </FormItem>
                )} />
                <FormField control={form.control} name="model" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('labels.model')}<span className="text-red-500 ml-1">{tCommon('requiredIndicator')}</span></FormLabel>
                    <FormControl><Input placeholder={t('placeholders.model')} {...field} /></FormControl>
                    <FormMessage>{errors.model}</FormMessage>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="year" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('labels.year')}<span className="text-red-500 ml-1">{tCommon('requiredIndicator')}</span></FormLabel>
                    <FormControl><Input placeholder={t('placeholders.year')} {...field} /></FormControl>
                    <FormMessage>{errors.year}</FormMessage>
                  </FormItem>
                )} />
                <FormField control={form.control} name="mileage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('labels.mileage')}<span className="text-red-500 ml-1">{tCommon('requiredIndicator')}</span></FormLabel>
                    <FormControl><Input type="number" placeholder={t('placeholders.mileage')} {...field} /></FormControl>
                    <FormMessage>{errors.mileage}</FormMessage>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="fuelType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('labels.fuelType')}<span className="text-red-500 ml-1">{tCommon('requiredIndicator')}</span></FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder={t('placeholders.fuelType')} /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="gasoline">{t('options.fuelGasoline')}</SelectItem>
                        <SelectItem value="diesel">{t('options.fuelDiesel')}</SelectItem>
                        <SelectItem value="electric">{t('options.fuelElectric')}</SelectItem>
                        <SelectItem value="hybrid">{t('options.fuelHybrid')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage>{errors.fuelType}</FormMessage>
                  </FormItem>
                )} />
                <FormField control={form.control} name="transmission" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('labels.transmission')}<span className="text-red-500 ml-1">{tCommon('requiredIndicator')}</span></FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder={t('placeholders.transmission')} /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="manual">{t('options.transmissionManual')}</SelectItem>
                        <SelectItem value="automatic">{t('options.transmissionAutomatic')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage>{errors.transmission}</FormMessage>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="condition" render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t('labels.condition')}<span className="text-red-500 ml-1">{tCommon('requiredIndicator')}</span></FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-row space-x-4 pt-1">
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="new" id="condition-new" /></FormControl>
                        <FormLabel htmlFor="condition-new" className="font-normal">{t('options.conditionNew')}</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="used" id="condition-used" /></FormControl>
                        <FormLabel htmlFor="condition-used" className="font-normal">{t('options.conditionUsed')}</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage>{errors.condition}</FormMessage>
                </FormItem>
              )} />
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('labels.city')}<span className="text-red-500 ml-1">{tCommon('requiredIndicator')}</span></FormLabel>
                  <FormControl><Input placeholder={t('placeholders.city')} {...field} /></FormControl>
                  <FormMessage>{errors.city}</FormMessage>
                </FormItem>
              )} />
            </div>
          </div>

          {/* Pricing & Media Section */}
          <div>
            <h3 className="text-lg font-medium mb-4 border-b pb-2">{t('sections.pricingMedia')}</h3>
            <div className="space-y-4 pt-4">
              <FormField control={form.control} name="askingPrice" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('labels.askingPrice')}</FormLabel>
                  <FormControl><Input type="number" placeholder={t('placeholders.askingPrice')} {...field} onChange={(e) => field.onChange(e.target.value)} value={field.value || ''} /></FormControl>
                  <FormDescription>{t('descriptions.askingPrice')}</FormDescription>
                  <FormMessage>{errors.askingPrice}</FormMessage>
                </FormItem>
              )} />
              <div className="space-y-2">
                <Label htmlFor="file-upload">{t('labels.photos')}</Label>
                <div className="mt-1 relative">
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    multiple
                    onChange={handleFileChange}
                    accept="image/*,.heic,.heif"
                  />
                  <Label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-border px-6 pb-6 pt-5 cursor-pointer w-full"
                  >
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-muted-foreground" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex flex-col text-sm text-muted-foreground">
                        <span className="font-medium text-primary hover:text-primary/90">{t('fileUpload.upload')}</span>
                        <p className="mt-1">{t('fileUpload.dragDrop')}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{t('descriptions.fileTypes')}</p>
                    </div>
                  </Label>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-2">
                    <FormDescription>{t('descriptions.filesSelected', { count: selectedFiles.length })}</FormDescription>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground">
                          {file.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Info Section */}
          <div>
            <h3 className="text-lg font-medium mb-4 border-b pb-2">{t('sections.additionalInfo')}</h3>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('labels.description')}</FormLabel>
                <FormControl><Textarea placeholder={t('placeholders.description')} className="min-h-[120px]" {...field} /></FormControl>
                <FormMessage>{errors.description}</FormMessage>
              </FormItem>
            )} />
          </div>

          {/* Submit Error */}
          {submitError && (<div className="p-3 text-sm bg-destructive/15 border border-destructive rounded text-destructive">{submitError}</div>)}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
            {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('buttons.submitting')}</>) : (t('buttons.submit'))}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}