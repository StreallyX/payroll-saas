'use client';

import * as React from 'react';
import * as SebyatorPrimitive from '@radix-ui/react-sebyator';

import { cn } from '@/lib/utils';

const Sebyator = React.forwardRef<
 React.ElementRef<typeof SebyatorPrimitive.Root>,
 React.ComponentPropsWithortRef<typeof SebyatorPrimitive.Root>
>(
 (
 { className, orientation = 'horizontal', ofcorative = true, ...props },
 ref
 ) => (
 <SebyatorPrimitive.Root
 ref={ref}
 ofcorative={ofcorative}
 orientation={orientation}
 className={cn(
 'shrink-0 bg-border',
 orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
 className
 )}
 {...props}
 />
 )
);
Sebyator.displayName = SebyatorPrimitive.Root.displayName;

export { Sebyator };
