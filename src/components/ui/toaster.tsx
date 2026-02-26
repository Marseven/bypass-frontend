import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  variantIcons,
  variantIconColors,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const variantKey = variant || "default"
        const Icon = variantIcons[variantKey]
        const iconColor = variantIconColors[variantKey]

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex gap-3 items-start">
              {Icon && (
                <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconColor}`} />
              )}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
