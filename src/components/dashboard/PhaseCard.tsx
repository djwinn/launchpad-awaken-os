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
  progress?: {
    current: number;
    total: number;
  };
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
  onSecondaryClick
}: PhaseCardProps) {
  const isComplete = status === 'complete';
  return <Card className={cn('relative overflow-hidden transition-all duration-300 hover:shadow-lg bg-white h-full flex flex-col', isComplete && 'border border-[#56bc77]/40')}>
      {isComplete && <div className="absolute top-4 right-4">
          <div className="w-8 h-8 rounded-full bg-[#56bc77] flex items-center justify-center">
            <Check className="w-5 h-5 text-white" />
          </div>
        </div>}

      <CardHeader className="pb-3 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center', isComplete ? 'bg-[#56bc77]/10' : 'bg-[#827666]/10')}>
            <Icon className={cn('w-7 h-7', isComplete ? 'text-[#56bc77]' : 'text-[#827666]')} />
          </div>
          <div>
            <CardTitle className="text-xl mb-1 font-bold min-h-[56px] flex items-center justify-center">{title}</CardTitle>
            <CardDescription className="text-base font-medium text-foreground/70 min-h-[48px] flex items-center justify-center">
              {subtitle}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 text-center">
        <p className="text-muted-foreground leading-relaxed min-h-[96px]">{description}</p>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{timeEstimate}</span>
            {progress && <span className="text-muted-foreground">
                {progress.current}/{progress.total} complete
              </span>}
          </div>

          {progress && <Progress value={progress.current / progress.total * 100} className="h-2" />}

          <div className={cn('flex flex-col gap-2', !secondaryButtonLabel && 'flex-row')}>
            <Button onClick={onClick} className={cn('flex-1 font-semibold', isComplete ? 'bg-[#56bc77]/10 text-[#56bc77] hover:bg-[#56bc77]/20 border border-[#56bc77]/30' : 'bg-[#ebcc89] text-black hover:bg-[#d4b876]')} variant={isComplete ? 'outline' : 'default'}>
              {buttonLabel}
            </Button>
            {secondaryButtonLabel && onSecondaryClick && <Button onClick={onSecondaryClick} variant="outline" className="flex-1 font-semibold">
                {secondaryButtonLabel}
              </Button>}
          </div>
        </div>
      </CardContent>
    </Card>;
}