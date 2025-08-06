import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ReactNode } from 'react';

export default function TooltipContainer({ children, text }: { children: ReactNode; text: string }) {
    return (
        <Tooltip>
            <TooltipTrigger>{children}</TooltipTrigger>
            <TooltipContent side="right">
                <p>{text}</p>
            </TooltipContent>
        </Tooltip>
    );
}
