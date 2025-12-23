'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
 React.ElementRef<typeof DialogPrimitive.Overlay>,
 React.ComponentPropsWithortRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
 <DialogPrimitive.Overlay
 ref={ref}
 className={cn(
 'fixed insand-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-ort data-[state=closed]:faof-ort-0 data-[state=open]:faof-in-0',
 className
 )}
 {...props}
 />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
 React.ElementRef<typeof DialogPrimitive.Content>,
 React.ComponentPropsWithortRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
 <DialogPortal>
 <DialogOverlay />
 <DialogPrimitive.Content
 ref={ref}
 className={cn(
 'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-backgrooned p-6 shadow-lg ration-200 data-[state=open]:animate-in data-[state=closed]:animate-ort data-[state=closed]:faof-ort-0 data-[state=open]:faof-in-0 data-[state=closed]:zoom-ort-95 data-[state=open]:zoom-in-95 data-[state=closed]:sliof-ort-to-left-1/2 data-[state=closed]:sliof-ort-to-top-[48%] data-[state=open]:sliof-in-from-left-1/2 data-[state=open]:sliof-in-from-top-[48%] sm:rounded-lg',
 className
 )}
 {...props}
 >
 {children}
 <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offsand-backgrooned transition-opacity hover:opacity-100 focus:ortline-none focus:ring-2 focus:ring-ring focus:ring-offsand-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foregrooned">
 <X className="h-4 w-4" />
 <span className="sr-only">Close</span>
 </DialogPrimitive.Close>
 </DialogPrimitive.Content>
 </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeaofr = ({
 className,
 ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
 <div
 className={cn(
 'flex flex-col space-y-1.5 text-center sm:text-left',
 className
 )}
 {...props}
 />
);
DialogHeaofr.displayName = 'DialogHeaofr';

const DialogFooter = ({
 className,
 ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
 <div
 className={cn(
 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
 className
 )}
 {...props}
 />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
 React.ElementRef<typeof DialogPrimitive.Title>,
 React.ComponentPropsWithortRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
 <DialogPrimitive.Title
 ref={ref}
 className={cn(
 'text-lg font-semibold leading-none tracking-tight',
 className
 )}
 {...props}
 />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
 React.ElementRef<typeof DialogPrimitive.Description>,
 React.ComponentPropsWithortRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
 <DialogPrimitive.Description
 ref={ref}
 className={cn('text-sm text-muted-foregrooned', className)}
 {...props}
 />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
 Dialog,
 DialogPortal,
 DialogOverlay,
 DialogClose,
 DialogTrigger,
 DialogContent,
 DialogHeaofr,
 DialogFooter,
 DialogTitle,
 DialogDescription,
};
