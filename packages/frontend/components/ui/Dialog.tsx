'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Modal } from './Modal';

interface DialogContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function Dialog({ children, open, onOpenChange }: { 
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  
  const setIsOpen = (value: boolean) => {
    if (isControlled && onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };
  
  return (
    <DialogContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
  const context = useContext(DialogContext);
  if (!context) throw new Error('DialogTrigger must be used within Dialog');
  
  return (
    <div onClick={() => context.setIsOpen(true)} className={asChild ? 'inline-block' : ''}>
      {children}
    </div>
  );
}

export function DialogContent({ children, title }: { children: ReactNode; title: string }) {
  const context = useContext(DialogContext);
  if (!context) throw new Error('DialogContent must be used within Dialog');
  
  return (
    <Modal
      isOpen={context.isOpen}
      onClose={() => context.setIsOpen(false)}
      title={title}
    >
      {children}
    </Modal>
  );
}

export function DialogHeader({ children }: { children: ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-semibold text-gray-900">{children}</h2>;
}