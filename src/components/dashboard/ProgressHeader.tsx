import { Progress } from '@/components/ui/progress';

interface ProgressHeaderProps {
  firstName: string;
  percentage: number;
  message: string;
}

export function ProgressHeader({ firstName, percentage, message }: ProgressHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Welcome back, {firstName}!
        </h1>
        <p className="text-muted-foreground text-lg">
          Here's your progress toward being fully ready for business.
        </p>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border/50 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-semibold text-foreground">
            {percentage}% Complete
          </span>
          <span className="text-muted-foreground">{message}</span>
        </div>
        <Progress value={percentage} className="h-3" />
      </div>
    </div>
  );
}
