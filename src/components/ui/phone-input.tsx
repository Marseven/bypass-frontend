import React from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  value: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export const PhoneInputField: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = "Numéro de téléphone",
  className,
  id,
  disabled = false,
}) => {
  return (
    <div className={cn("relative", className)}>
      <style>{`
        .PhoneInput {
          display: flex;
          align-items: center;
        }
        .PhoneInputInput {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          padding: 0;
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
        .PhoneInputInput:focus {
          outline: none;
          box-shadow: none;
        }
        .PhoneInputInput::placeholder {
          color: hsl(var(--muted-foreground));
        }
        .PhoneInputCountryIcon {
          width: 1.5rem;
          height: 1.5rem;
          margin-right: 0.5rem;
        }
        .PhoneInputCountrySelect {
          border: none;
          background: transparent;
          padding: 0;
          margin-right: 0.5rem;
          cursor: pointer;
        }
        .PhoneInputCountrySelect:focus {
          outline: none;
        }
      `}</style>
      <PhoneInput
        international
        defaultCountry="FR"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        id={id}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "placeholder:text-muted-foreground",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
    </div>
  );
};

