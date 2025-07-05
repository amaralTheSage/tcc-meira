import { Pinned } from '@/types/models';
import { ExternalLink, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import AddPinsDialog from './add-pin-dialog';

export default function AddPinsMenu({ pins, setPins }: { pins: Pinned; setPins: React.Dispatch<React.SetStateAction<Pinned[]>> }) {
    return (
        <div className="mx-auto mt-2 flex w-fit space-x-3">
            <AddPinsDialog type="link" pins={pins} setPins={setPins}>
                <Button>
                    <ExternalLink className="mb-0.5" />
                    Add Link
                </Button>
            </AddPinsDialog>

            <AddPinsDialog type="text" pins={pins} setPins={setPins}>
                <Button>
                    <FileText className="mb-0.5" /> Add Text
                </Button>
            </AddPinsDialog>
        </div>
    );
}
