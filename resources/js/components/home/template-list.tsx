import { ScrollArea } from '../ui/scroll-area';
import TemplateListCard from './template-list-card';

export default function TemplateList({ templates }: { templates: any[] }) {
    return (
        <ScrollArea className="h-80 rounded-md border p-1.5 pr-3" type="always">
            {templates.length > 0 ? (
                templates.map((template) => {
                    return <TemplateListCard template={template} key={template.id} />;
                })
            ) : (
                <p className="mt-6 text-center text-sm">Search for templates</p>
            )}
        </ScrollArea>
    );
}
