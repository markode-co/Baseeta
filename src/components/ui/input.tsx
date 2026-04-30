import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, startIcon, endIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {startIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {startIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
              "transition-colors duration-150",
              startIcon && "pl-10",
              endIcon && "pr-10",
              error && "border-red-400 focus:ring-red-400",
              className
            )}
            ref={ref}
            {...props}
          />
          {endIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              {endIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
