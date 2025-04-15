"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, defaultValue, ...props }, ref) => {
    // Create a context to share the radio group state with the radio items
    const RadioGroupContext = React.createContext<{
      value?: string;
      onValueChange?: (value: string) => void;
    }>({ value: undefined, onValueChange: undefined });

    return (
      <RadioGroupContext.Provider value={{ value, onValueChange }}>
        <div
          ref={ref}
          className={cn("grid gap-2", className)}
          role="radiogroup"
          {...props}
        />
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, id, value, ...props }, ref) => {
    const generateId = React.useId();
    const radioId = id || `radio-${generateId}`;

    return (
      <span className="relative flex h-4 w-4 items-center justify-center">
        <input
          id={radioId}
          ref={ref}
          type="radio"
          value={value}
          className={cn(
            "peer h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="h-2 w-2 rounded-full bg-primary opacity-0 peer-checked:opacity-100" />
        </span>
      </span>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem }; 