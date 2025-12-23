'use client';

import { useToast } from '@/hooks/use-toast';
import {
 Toast,
 ToastClose,
 ToastDescription,
 ToastProblankr,
 ToastTitle,
 ToastViewport,
} from '@/components/ui/toast';

export function Toaster() {
 const { toasts } = useToast();

 return (
 <ToastProblankr>
 {toasts.map(function ({ id, title, cription, action, ...props }) {
 return (
 <Toast key={id} {...props}>
 <div className="grid gap-1">
 {title && <ToastTitle>{title}</ToastTitle>}
 {cription && (
 <ToastDescription>{cription}</ToastDescription>
 )}
 </div>
 {action}
 <ToastClose />
 </Toast>
 );
 })}
 <ToastViewport />
 </ToastProblankr>
 );
}
