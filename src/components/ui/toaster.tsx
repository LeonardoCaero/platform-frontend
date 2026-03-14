import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { useNavigate } from "react-router-dom";

export function Toaster() {
  const { toasts } = useToast();
  const navigate = useNavigate();

  return (
    <ToastProvider duration={5000}>
      {toasts.map(function ({ id, title, description, action, href, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div
              className={href ? 'grid gap-1 flex-1 cursor-pointer' : 'grid gap-1'}
              onClick={href ? () => navigate(href) : undefined}
            >
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
