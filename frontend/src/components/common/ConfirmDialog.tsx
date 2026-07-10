import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  pending?: boolean;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

export default function ConfirmDialog({ open, onOpenChange, title, description, confirmText = "确认", pending, destructive, onConfirm }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-border/40 bg-white/95 backdrop-blur-xl">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>取消</Button>
          <Button onClick={onConfirm} disabled={pending} className={destructive ? "bg-red-500 text-white hover:bg-red-600" : "bg-gradient-to-r from-medical-400 to-medical-600 text-white"}>{confirmText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
