import UserTemplate from './user-template';

export default function UserTemplateList({ templates }: { templates: any[] }) {
    return (
        <div className="col-span-3 w-full">
            {templates.length > 0 ? (
                templates.map((template) => {
                    return <UserTemplate template={template} key={template.id} />;
                })
            ) : (
                <p className="mt-6 text-center text-sm">Search for templates</p>
            )}
        </div>
    );
}
