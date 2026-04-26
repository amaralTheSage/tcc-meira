import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ReactNode } from 'react';
import TemplateList from './template-list';

import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Template } from '@/types/models';
import { Search } from 'lucide-react';

export function UseTemplateDialog({ children, templates }: { children: ReactNode; templates: Template[] }) {
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>Find a Template</DialogTitle>
                    <DialogDescription>Find project models from around the world</DialogDescription>
                </DialogHeader>
                <div className="grid w-full gap-4">
                    <InputGroup>
                        <InputGroupInput placeholder="5 Fundamental UX steps..." />
                        <InputGroupAddon>
                            <Search />
                        </InputGroupAddon>
                        <InputGroupAddon align="inline-end">12 results</InputGroupAddon>
                    </InputGroup>

                    <div className="grid gap-3">
                        <TemplateList templates={templates} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Create Project</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
