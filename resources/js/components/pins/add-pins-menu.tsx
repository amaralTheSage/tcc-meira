import { ExternalLink, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import AddPinsDialog from './add-pin-dialog';

export default function AddPinsMenu() {
    return (
        <div className="mx-auto mt-2 flex w-fit space-x-3">
            <AddPinsDialog type="link">
                <Button>
                    <ExternalLink className="mb-0.5" />
                    Add Link
                </Button>
            </AddPinsDialog>

            <AddPinsDialog type="text">
                <Button>
                    <FileText className="mb-0.5" /> Add Text
                </Button>
            </AddPinsDialog>
        </div>
    );
}
