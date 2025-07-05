import { ExternalLink, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import AddPinsDialog from './add-pin-dialog';

export default function AddPinsMenu({ pins_length }: { pins_length: number }) {
    return (
        <div className="mx-auto mt-2 flex w-fit space-x-3">
            <AddPinsDialog type="link" pins_length={pins_length}>
                <Button>
                    <ExternalLink className="mb-0.5" />
                    Add Link
                </Button>
            </AddPinsDialog>

            <AddPinsDialog type="text" pins_length={pins_length}>
                <Button>
                    <FileText className="mb-0.5" /> Add Text
                </Button>
            </AddPinsDialog>
        </div>
    );
}
