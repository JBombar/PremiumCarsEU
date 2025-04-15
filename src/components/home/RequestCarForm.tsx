"use client";

import { useState } from "react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';

export function RequestCarForm() {
  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    make: "",
    model: "",
    yearFrom: "",
    yearTo: "",
    budget: "",
    condition: "either", // new, preowned, either
    transmission: "", // automatic, manual, any
    fuelType: "", // gasoline, diesel, hybrid, electric, any
    color: "",
    maxMileage: "",
    location: "",
    notes: ""
  });

  // Add states for submission feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Generate year options from 2010 to current year
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let year = 2010; year <= currentYear; year++) {
    yearOptions.push(year);
  }

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle radio changes
  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log('Preparing to submit form data to Supabase');

      // Initialize Supabase client
      const supabase = createClient();

      // Construct the data object to match leads table schema
      const leadData = {
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        make: formData.make.trim(),
        model: formData.model.trim(),
        budget: formData.budget ? Number(formData.budget.replace(/[^0-9.]/g, '')) : null,
        color: formData.color.trim(),
        fuel_type: formData.fuelType,
        transmission: formData.transmission,
        condition: formData.condition,
        location: formData.location.trim(),
        max_mileage: formData.maxMileage ? Number(formData.maxMileage) : null,
        year_from: formData.yearFrom,
        year_to: formData.yearTo,
        notes: formData.notes.trim()
      };

      console.log('Submitting lead data to Supabase:', leadData);

      // Insert data into the leads table
      const { data: insertedData, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(`Failed to save your request: ${error.message}`);
      }

      console.log('Lead successfully submitted:', insertedData);

      // Show success state
      setSubmitSuccess(true);

      // Reset form after successful submission
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        make: "",
        model: "",
        yearFrom: "",
        yearTo: "",
        budget: "",
        condition: "either",
        transmission: "",
        fuelType: "",
        color: "",
        maxMileage: "",
        location: "",
        notes: ""
      });

    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError(error instanceof Error
        ? error.message
        : 'An error occurred while submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render success state if submission was successful
  if (submitSuccess) {
    return (
      <section id="request-car-form" className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-center text-2xl text-primary">Request Submitted!</CardTitle>
              <CardDescription className="text-center">
                Thank you for your car request. Our team will review your preferences and contact you soon.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center p-6">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600 text-center mb-6">
                We'll be in touch with you at {formData.email} shortly.
              </p>
              <Button onClick={() => setSubmitSuccess(false)}>Submit Another Request</Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="request-car-form" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Can't Find What You're Looking For?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Help us find your ideal car through our dealer network by letting us know your preferences.
          </p>
        </div>

        <Card className="max-w-4xl mx-auto shadow-md">
          <CardHeader>
            <CardTitle>Request a Car</CardTitle>
            <CardDescription>
              Fill out the form below with your vehicle preferences and our specialists will contact you shortly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name<span className="text-red-500">*</span></Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address<span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      type="email"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(123) 456-7890"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location / Region</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="City, State or Zip Code"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="space-y-2 pt-4 border-t">
                <h3 className="text-lg font-medium">Vehicle Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="make">Desired Car Make</Label>
                    <Input
                      id="make"
                      name="make"
                      value={formData.make}
                      onChange={handleChange}
                      placeholder="BMW, Toyota, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Desired Car Model</Label>
                    <Input
                      id="model"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      placeholder="X5, Camry, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="yearFrom">Year Range (From)</Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("yearFrom", value)}
                      value={formData.yearFrom}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="From Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((year) => (
                          <SelectItem key={`from-${year}`} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearTo">Year Range (To)</Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("yearTo", value)}
                      value={formData.yearTo}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="To Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((year) => (
                          <SelectItem key={`to-${year}`} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Preferred Budget</Label>
                    <Input
                      id="budget"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      placeholder="$30,000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Preferred Color(s)</Label>
                    <Input
                      id="color"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      placeholder="Black, Silver, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Vehicle Specifications</h3>

                <div className="space-y-2">
                  <Label>Car Condition</Label>
                  <div className="flex space-x-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="condition-new"
                        name="condition"
                        value="new"
                        checked={formData.condition === "new"}
                        onChange={handleRadioChange}
                        className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="condition-new" className="cursor-pointer">New</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="condition-preowned"
                        name="condition"
                        value="preowned"
                        checked={formData.condition === "preowned"}
                        onChange={handleRadioChange}
                        className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="condition-preowned" className="cursor-pointer">Pre-Owned</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="condition-either"
                        name="condition"
                        value="either"
                        checked={formData.condition === "either"}
                        onChange={handleRadioChange}
                        className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="condition-either" className="cursor-pointer">Either</Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="transmission">Transmission Type</Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("transmission", value)}
                      value={formData.transmission}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select transmission" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatic">Automatic</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="any">Doesn't Matter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fuelType">Fuel Type</Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("fuelType", value)}
                      value={formData.fuelType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gasoline">Gasoline</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                        <SelectItem value="any">Doesn't Matter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Conditional rendering for max mileage */}
                {(formData.condition === "preowned" || formData.condition === "either") && (
                  <div className="space-y-2">
                    <Label htmlFor="maxMileage">Maximum Mileage</Label>
                    <Input
                      id="maxMileage"
                      name="maxMileage"
                      type="number"
                      value={formData.maxMileage}
                      onChange={handleChange}
                      placeholder="50000"
                    />
                  </div>
                )}
              </div>

              {/* Additional Information */}
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any specific requirements or preferences?"
                  className="min-h-[100px]"
                />
              </div>

              {/* Show error message if submission failed */}
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
                  {submitError}
                </div>
              )}

              <div className="pt-4 flex justify-center">
                <Button
                  type="submit"
                  className="w-full md:w-auto"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
} 