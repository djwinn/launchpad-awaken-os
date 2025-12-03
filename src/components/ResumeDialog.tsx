import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ResumeDialogProps {
  open: boolean;
  onContinue: () => void;
  onStartFresh: () => void;
}

export function ResumeDialog({ open, onContinue, onStartFresh }: ResumeDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Welcome back!</AlertDialogTitle>
          <AlertDialogDescription>
            You have an unfinished funnel. Would you like to continue where you left off or start fresh?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onStartFresh}>Start Fresh</AlertDialogCancel>
          <AlertDialogAction onClick={onContinue}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
