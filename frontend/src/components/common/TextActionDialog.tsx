import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TextActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  placeholder?: string;
  initialValue?: string;
  confirmText?: string;
  required?: boolean;
  pending?: boolean;
  destructive?: boolean;
  onConfirm: (value: string) => void | Promise<void>;
}

export default function TextActionDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  initialValue = "",
  confirmText = "确认",
  required = false,
  pending = false,
  destructive = false,
  onConfirm,
}: TextActionDialogProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-border/40 bg-white/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className="min-h-28 w-full rounded-xl border border-input bg-white/70 px-3 py-2 text-sm outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>取消</Button>
          <Button
            onClick={() => onConfirm(value)}
            disabled={pending || (required && !value.trim())}
            className={destructive ? "bg-red-500 text-white hover:bg-red-600" : "bg-gradient-to-r from-medical-400 to-medical-600 text-white"}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
