import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  description?: string;
}

interface FormStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function FormStepper({ steps, currentStep, onStepClick }: FormStepperProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={cn(
              "relative flex-1",
              index !== steps.length - 1 && "pr-8 sm:pr-20"
            )}
          >
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => onStepClick?.(step.id)}
                disabled={step.id > currentStep + 1}
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  step.id < currentStep
                    ? "bg-primary text-primary-foreground cursor-pointer"
                    : step.id === currentStep
                    ? "border-2 border-primary bg-background text-primary"
                    : "border-2 border-muted bg-background text-muted-foreground"
                )}
              >
                {step.id < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </button>
              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-4 left-8 -ml-px h-0.5 w-full sm:left-20",
                    step.id < currentStep ? "bg-primary" : "bg-muted"
                  )}
                  style={{ width: 'calc(100% - 2rem)' }}
                />
              )}
            </div>
            <div className="mt-2">
              <span
                className={cn(
                  "text-xs font-medium",
                  step.id <= currentStep ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
