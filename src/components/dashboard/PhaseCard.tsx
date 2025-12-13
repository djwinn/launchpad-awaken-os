import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhaseCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  timeEstimate: string;
  status: 'not-started' | 'in-progress' | 'complete';
  progress?: { current: number; total: number };
  buttonLabel: string;
  onClick: () => void;
  secondaryButtonLabel?: string;
  onSecondaryClick?: () => void;
}

export function PhaseCard({
  icon: Icon,
  title,
  subtitle,
  description,
  timeEstimate,
  status,
  progress,
  buttonLabel,
  onClick,
  secondaryButtonLabel,
  onSecondaryClick,
}: PhaseCardProps) {
  const isComplete = status === 'complete';

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:shadow-lg bg-white h-full flex flex-col',
        isComplete && 'border border-[#56bc77]/40'
      )}
    >
      {isComplete && (
        <div className="absolute top-4 right-4">
          <div className="w-8 h-8 rounded-full bg-[#56bc77] flex items-center justify-center">
            <Check className="w-5 h-5 text-white" />
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
              isComplete ? 'bg-[#56bc77]/10' : 'bg-[#827666]/10'
            )}
          >
            <Icon
              className={cn(
                'w-6 h-6',
                isComplete ? 'text-[#56bc77]' : 'text-[#827666]'
              )}
            />
          </div>
          <div className="flex-1 min-w-0 pr-8">
            <CardTitle className="text-xl mb-1">{title}</CardTitle>
            <CardDescription className="text-base font-medium text-foreground/70">
              {subtitle}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1">
        <p className="text-muted-foreground leading-relaxed flex-1">{description}</p>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{timeEstimate}</span>
            {progress && (
              <span className="text-muted-foreground">
                {progress.current}/{progress.total} complete
              </span>
            )}
          </div>

          {progress && (
            <Progress
              value={(progress.current / progress.total) * 100}
              className="h-2"
            />
          )}

          <div className={cn('flex flex-col gap-2', !secondaryButtonLabel && 'flex-row')}>
            <Button
              onClick={onClick}
              className={cn(
                'flex-1 font-semibold',
                isComplete
                  ? 'bg-[#56bc77]/10 text-[#56bc77] hover:bg-[#56bc77]/20 border border-[#56bc77]/30'
                  : 'bg-[#827666] text-white hover:bg-[#6b5a4a]'
              )}
              variant={isComplete ? 'outline' : 'default'}
            >
              {buttonLabel}
            </Button>
            {secondaryButtonLabel && onSecondaryClick && (
              <Button
                onClick={onSecondaryClick}
                variant="outline"
                className="flex-1 font-semibold"
              >
                {secondaryButtonLabel}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}