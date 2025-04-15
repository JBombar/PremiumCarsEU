"use client";

import { CarSellForm } from "@/components/forms/CarSellForm";
import { FaThumbsUp, FaCarSide, FaMoneyBillWave, FaShieldAlt } from "react-icons/fa";

export default function SellPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-6 sm:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">Sell Your Car with Confidence</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Get a fair price and hassle-free experience when you sell your car through CarBiz.
            No middlemen, no hidden fees - just straightforward service.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mt-12">
          {/* Left column with benefits - now more subtle */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 px-4 py-6">
              <h2 className="text-xl font-medium mb-8 text-muted-foreground">Why Sell With Us?</h2>
              
              <div className="space-y-10">
                <div className="flex gap-4">
                  <div className="bg-primary/5 rounded-full p-2 h-fit">
                    <FaMoneyBillWave className="h-4 w-4 text-primary/70" />
                  </div>
                  <div>
                    <h3 className="font-medium text-base text-muted-foreground">Competitive Pricing</h3>
                    <p className="text-sm text-muted-foreground/80 mt-1">
                      We offer fair market value for your vehicle based on its condition, 
                      history, and current market trends.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="bg-primary/5 rounded-full p-2 h-fit">
                    <FaCarSide className="h-4 w-4 text-primary/70" />
                  </div>
                  <div>
                    <h3 className="font-medium text-base text-muted-foreground">Hassle-Free Process</h3>
                    <p className="text-sm text-muted-foreground/80 mt-1">
                      Our streamlined selling process means less paperwork and quicker transactions.
                      Most deals close within 48 hours.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="bg-primary/5 rounded-full p-2 h-fit">
                    <FaShieldAlt className="h-4 w-4 text-primary/70" />
                  </div>
                  <div>
                    <h3 className="font-medium text-base text-muted-foreground">Trusted Service</h3>
                    <p className="text-sm text-muted-foreground/80 mt-1">
                      With over 10 years in the business, our reputation for transparency
                      and customer satisfaction speaks for itself.
                    </p>
                  </div>
                </div>
                
                <div className="bg-muted/30 p-4 rounded-lg mt-10">
                  <div className="flex gap-3 items-center">
                    <div className="bg-primary/5 rounded-full p-2">
                      <FaThumbsUp className="h-4 w-4 text-primary/70" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Trusted by 2,300+ drivers</h3>
                      <p className="text-xs text-muted-foreground/80 mt-1">
                        Join thousands of satisfied customers who have successfully sold their 
                        vehicles through our platform.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column with form */}
          <div className="lg:col-span-3">
            <CarSellForm />
          </div>
        </div>
      </div>
    </div>
  );
} 