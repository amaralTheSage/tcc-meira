import { Pinned } from '@/types/models';
import { ExternalLink, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import AddPinsDialog from './add-pin-dialog';

export default function AddPinsMenu({ pins, setPins }: { pins: Pinned[]; setPins: React.Dispatch<React.SetStateAction<Pinned[]>> }) {
    return (
        <div className="absolute bottom-1 left-1/2 mx-auto flex w-fit -translate-x-1/2 items-center space-x-3 rounded-md bg-sidebar/95 p-2 md:max-w-5xl">
            <AddPinsDialog type="link" pins={pins} setPins={setPins}>
                <Button data-testid="pin-add-link-trigger">
                    <ExternalLink className="mb-0.5" />
                    Add Link
                </Button>
            </AddPinsDialog>

            <AddPinsDialog type="text" pins={pins} setPins={setPins}>
                <Button data-testid="pin-add-text-trigger">
                    <FileText className="mb-0.5" /> Add Text
                </Button>
            </AddPinsDialog>
        </div>
    );
}
