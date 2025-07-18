import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    const inputClasses = twMerge(
      'flex h-11 w-full rounded-lg border bg-background px-3 py-2 text-body-input file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
      error
        ? 'border-error border-2' // Estado de error
        : 'border-neutral-300', // Estado por defecto
      'disabled:cursor-not-allowed disabled:bg-neutral-50'
    );

    return (
      <div className="grid w-full max-w-sm items-center gap-2">
        <label htmlFor={props.id} className="text-body-label text-neutral-500">
          {label}
        </label>
        <input type={type} className={inputClasses} ref={ref} {...props} />
        {/* Reservar espacio para el error para evitar CLS */}
        <p className="h-5 text-caption-error text-error">{error || ''}</p>
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };