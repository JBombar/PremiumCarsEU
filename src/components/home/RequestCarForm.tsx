// src/components/home/RequestCarForm.tsx
"use client";

import { useState } from "react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';
import { useTranslations } from 'next-intl'; // Import useTranslations

export function RequestCarForm() {
  const t = useTranslations('RequestCarForm'); // Hook for form
  const tCommon = useTranslations('Common');   // Hook for common elements like required indicator

  // Form state remains the same
  const [formData, setFormData] = useState({ /* ... */
    fullName: "", email: "", phone: "", make: "", model: "", yearFrom: "", yearTo: "",
    budget: "", condition: "either", transmission: "", fuelType: "", color: "",
    maxMileage: "", location: "", notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState("");

  // Year options generation remains the same
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 2010 + 1 }, (_, i) => 2010 + i);

  // Handlers remain the same
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { /* ... */  const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value })); };
  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value })); };
  const handleSelectChange = (name: string, value: string) => { /* ... */ setFormData((prev) => ({ ...prev, [name]: value })); };

  // Handle form submission (remains the same)
  const handleSubmit = async (e: React.FormEvent) => { /* ... same logic as before ... */
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmittedEmail(formData.email);

    try {
      const supabase = createClient();
      const leadData = {
        full_name: formData.fullName.trim(), email: formData.email.trim(), phone: formData.phone.trim(),
        make: formData.make.trim(), model: formData.model.trim(),
        budget: formData.budget ? Number(formData.budget.replace(/[^0-9.]/g, '')) : null,
        color: formData.color.trim(), fuel_type: formData.fuelType, transmission: formData.transmission,
        condition: formData.condition, location: formData.location.trim(),
        max_mileage: formData.maxMileage ? Number(formData.maxMileage) : null,
        year_from: formData.yearFrom, year_to: formData.yearTo, notes: formData.notes.trim()
      };

      const { data: insertedData, error } = await supabase.from('leads').insert([leadData]).select();

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(`${t('error.prefix')}${error.message}`);
      }

      setSubmitSuccess(true);
      setFormData({
        fullName: "", email: "", phone: "", make: "", model: "", yearFrom: "", yearTo: "",
        budget: "", condition: "either", transmission: "", fuelType: "", color: "",
        maxMileage: "", location: "", notes: ""
      });

    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError(error instanceof Error ? error.message : t('error.fallback'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render success state (remains the same, uses t)
  if (submitSuccess) {
    return (<section id="request-car-form" className="py-16 bg-gray-50"> <div className="max-w-3xl mx-auto px-6 sm:px-8"> <Card className="shadow-md"> <CardHeader> <CardTitle className="text-center text-2xl text-primary">{t('success.title')}</CardTitle> <CardDescription className="text-center">{t('success.description')}</CardDescription> </CardHeader> <CardContent className="flex flex-col items-center p-6"> <div className="rounded-full bg-green-100 p-3 mb-4"> <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> </div> <p className="text-gray-600 text-center mb-6">{t('success.confirmation', { email: submittedEmail })}</p> <Button onClick={() => setSubmitSuccess(false)}>{t('buttons.submitAnother')}</Button> </CardContent> </Card> </div> </section>);
  }

  // Render form
  return (
    <section id="request-car-form" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">{t('section.title')}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('section.subtitle')}</p>
        </div>

        <Card className="max-w-4xl mx-auto shadow-md">
          <CardHeader>
            <CardTitle>{t('card.title')}</CardTitle>
            <CardDescription>{t('card.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">{t('subheadings.contactInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    {/* --- *** MODIFIED LABEL RENDERING *** --- */}
                    <Label htmlFor="fullName">
                      {t('labels.fullName')}
                      <span className="text-red-500 ml-1">{tCommon('requiredIndicator')}</span>
                    </Label>
                    <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} placeholder={t('placeholders.fullName')} required />
                  </div>
                  <div className="space-y-2">
                    {/* --- *** MODIFIED LABEL RENDERING *** --- */}
                    <Label htmlFor="email">
                      {t('labels.email')}
                      <span className="text-red-500 ml-1">{tCommon('requiredIndicator')}</span>
                    </Label>
                    <Input id="email" name="email" value={formData.email} onChange={handleChange} type="email" placeholder={t('placeholders.email')} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('labels.phone')}</Label> {/* No indicator needed */}
                    <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder={t('placeholders.phone')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">{t('labels.location')}</Label> {/* No indicator needed */}
                    <Input id="location" name="location" value={formData.location} onChange={handleChange} placeholder={t('placeholders.location')} />
                  </div>
                </div>
              </div>

              {/* Vehicle Details (No changes needed here) */}
              <div className="space-y-2 pt-4 border-t"> <h3 className="text-lg font-medium">{t('subheadings.vehicleDetails')}</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div className="space-y-2"> <Label htmlFor="make">{t('labels.make')}</Label> <Input id="make" name="make" value={formData.make} onChange={handleChange} placeholder={t('placeholders.make')} /> </div> <div className="space-y-2"> <Label htmlFor="model">{t('labels.model')}</Label> <Input id="model" name="model" value={formData.model} onChange={handleChange} placeholder={t('placeholders.model')} /> </div> </div> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div className="space-y-2"> <Label htmlFor="yearFrom">{t('labels.yearFrom')}</Label> <Select onValueChange={(value) => handleSelectChange("yearFrom", value)} value={formData.yearFrom}> <SelectTrigger><SelectValue placeholder={t('placeholders.yearFrom')} /></SelectTrigger> <SelectContent>{yearOptions.map((year) => <SelectItem key={`from-${year}`} value={year.toString()}>{year}</SelectItem>)}</SelectContent> </Select> </div> <div className="space-y-2"> <Label htmlFor="yearTo">{t('labels.yearTo')}</Label> <Select onValueChange={(value) => handleSelectChange("yearTo", value)} value={formData.yearTo}> <SelectTrigger><SelectValue placeholder={t('placeholders.yearTo')} /></SelectTrigger> <SelectContent>{yearOptions.map((year) => <SelectItem key={`to-${year}`} value={year.toString()}>{year}</SelectItem>)}</SelectContent> </Select> </div> </div> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div className="space-y-2"> <Label htmlFor="budget">{t('labels.budget')}</Label> <Input id="budget" name="budget" value={formData.budget} onChange={handleChange} placeholder={t('placeholders.budget')} /> </div> <div className="space-y-2"> <Label htmlFor="color">{t('labels.color')}</Label> <Input id="color" name="color" value={formData.color} onChange={handleChange} placeholder={t('placeholders.color')} /> </div> </div> </div>

              {/* Specifications (No changes needed here) */}
              <div className="space-y-4 pt-4 border-t"> <h3 className="text-lg font-medium">{t('subheadings.specifications')}</h3> <div className="space-y-2"> <Label>{t('labels.condition')}</Label> <div className="flex space-x-6"> <div className="flex items-center space-x-2"> <input type="radio" id="condition-new" name="condition" value="new" checked={formData.condition === "new"} onChange={handleRadioChange} className="h-4 w-4 border-gray-300 text-primary focus:ring-primary" /> <Label htmlFor="condition-new" className="cursor-pointer">{t('options.conditionNew')}</Label> </div> <div className="flex items-center space-x-2"> <input type="radio" id="condition-preowned" name="condition" value="preowned" checked={formData.condition === "preowned"} onChange={handleRadioChange} className="h-4 w-4 border-gray-300 text-primary focus:ring-primary" /> <Label htmlFor="condition-preowned" className="cursor-pointer">{t('options.conditionPreowned')}</Label> </div> <div className="flex items-center space-x-2"> <input type="radio" id="condition-either" name="condition" value="either" checked={formData.condition === "either"} onChange={handleRadioChange} className="h-4 w-4 border-gray-300 text-primary focus:ring-primary" /> <Label htmlFor="condition-either" className="cursor-pointer">{t('options.conditionEither')}</Label> </div> </div> </div> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div className="space-y-2"> <Label htmlFor="transmission">{t('labels.transmission')}</Label> <Select onValueChange={(value) => handleSelectChange("transmission", value)} value={formData.transmission}> <SelectTrigger><SelectValue placeholder={t('placeholders.transmission')} /></SelectTrigger> <SelectContent> <SelectItem value="automatic">{t('options.transmissionAutomatic')}</SelectItem> <SelectItem value="manual">{t('options.transmissionManual')}</SelectItem> <SelectItem value="any">{t('options.transmissionAny')}</SelectItem> </SelectContent> </Select> </div> <div className="space-y-2"> <Label htmlFor="fuelType">{t('labels.fuelType')}</Label> <Select onValueChange={(value) => handleSelectChange("fuelType", value)} value={formData.fuelType}> <SelectTrigger><SelectValue placeholder={t('placeholders.fuelType')} /></SelectTrigger> <SelectContent> <SelectItem value="gasoline">{t('options.fuelGasoline')}</SelectItem> <SelectItem value="diesel">{t('options.fuelDiesel')}</SelectItem> <SelectItem value="hybrid">{t('options.fuelHybrid')}</SelectItem> <SelectItem value="electric">{t('options.fuelElectric')}</SelectItem> <SelectItem value="any">{t('options.fuelAny')}</SelectItem> </SelectContent> </Select> </div> </div> {(formData.condition === "preowned" || formData.condition === "either") && (<div className="space-y-2"> <Label htmlFor="maxMileage">{t('labels.maxMileage')}</Label> <Input id="maxMileage" name="maxMileage" type="number" value={formData.maxMileage} onChange={handleChange} placeholder={t('placeholders.maxMileage')} /> </div>)} </div>

              {/* Additional Information (No changes needed here) */}
              <div className="space-y-2 pt-4 border-t"> <Label htmlFor="notes">{t('labels.notes')}</Label> <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder={t('placeholders.notes')} className="min-h-[100px]" /> </div>

              {/* Error Message (No changes needed here) */}
              {submitError && (<div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">{submitError}</div>)}

              {/* Submit Button (No changes needed here) */}
              <div className="pt-4 flex justify-center"> <Button type="submit" className="w-full md:w-auto" size="lg" disabled={isSubmitting}>{isSubmitting ? t('buttons.submitting') : t('buttons.submit')}</Button> </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}