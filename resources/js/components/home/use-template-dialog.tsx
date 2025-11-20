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
import { useForm } from '@inertiajs/react';
import { ReactNode } from 'react';
import TemplateList from './template-list';

import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Search } from 'lucide-react';

export function UseTemplateDialog({ children }: { children: ReactNode }) {
    const { post, setData, data } = useForm();

    const templates = [
        {
            id: 1,
            name: '5 fundamental UX steps',
            user: {
                name: 'Scooby diu',
                avatar: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwallpapers.com%2Fimages%2Fhd%2Fscooby-doo-cartoon-art-be9micnzuntzykbv.jpg&f=1&nofb=1&ipt=b7c0388a68001ca5ac9383c5de94dd33864981fa96bb7438aa01b0ca16d01790',
            },
        },
    ];

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
