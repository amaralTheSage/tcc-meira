import AddPinsMenu from '@/components/pins/add-pins-menu';
import PinnedLink from '@/components/pins/pinned-link';
import PinnedText from '@/components/pins/pinned-text';
import { PinsContextMenu } from '@/components/pins/pins-context-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { PinnedLinkType, PinnedTextType, Project } from '@/types/models';
import { Head } from '@inertiajs/react';
import { Pin } from 'lucide-react';

const testData: (PinnedLinkType | PinnedTextType)[] = [
    {
        type: 'link',
        title: 'GitHub',
        url: 'https://github.com/amaralTheSage/tcc-woro',
    },
    {
        type: 'link',
        title: undefined,
        url: 'https://vercel.com/',
    },
    {
        type: 'text',
        text: 'Apps para os quais teremos ícones: GitHub, Notion, Discord, Slack, Vercel, GitLab, Netlify, Figma, Neon, Google services (docs, sheets, etc, td com o ícone do google)',
    },
    {
        type: 'text',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed hendrerit scelerisque tincidunt. Fusce at ante quam. Sed faucibus suscipit metus quis blandit. Suspendisse potenti. Suspendisse finibus et erat nec posuere. Aliquam purus nunc, interdum quis varius quis, semper non enim. Curabitur et placerat purus. Sed hendrerit odio fermentum, auctor mauris id, semper libero. Sed rutrum nulla eget quam vestibulum, nec pellentesque turpis blandit. Phasellus tempus ac elit nec viverra. Nullam feugiat dolor ac neque feugiat, in ornare magna sollicitudin. Integer hendrerit nisl in leo dignissim, eu pretium lectus volutpat <br> Phasellus pretium, purus congue pulvinar cursus, nunc nisi luctus mi, sit amet maximus est erat a lectus. Nullam condimentum rhoncus dignissim. Pellentesque sagittis feugiat nisi. Vivamus vel faucibus nibh. Proin vitae tellus eros. Nullam nec auctor ligula, a ultrices neque. In id lobortis sem, in rhoncus nulla. Nunc sed cursus odio. Quisque placerat ipsum nec nisl elementum placerat nec in mauris. Cras pulvinar ac diam id gravida. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut nec ante ipsum. Aliquam pellentesque est magna, vel pulvinar velit laoreet sed. Suspendisse dolor ipsum, pharetra a semper eu, mollis id augue. Nunc tristique lacus nec leo ornare vehicula. Proin sit amet purus ut sapien mattis fermentum vel quis dui.',
    },
    {
        type: 'text',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed hendrerit scelerisque tincidunt. Fusce at ante quam. Sed faucibus suscipit metus quis blandit. Suspendisse potenti. Suspendisse finibus et erat nec posuere. Aliquam purus nunc, interdum quis varius quis, semper non enim. Curabitur et placerat purus. Sed hendrerit odio fermentum, auctor mauris id, semper libero. Sed rutrum nulla eget quam vestibulum, nec pellentesque turpis blandit. Phasellus tempus ac elit nec viverra. Nullam feugiat dolor ac neque feugiat, in ornare magna sollicitudin. Integer hendrerit nisl in leo dignissim, eu pretium lectus volutpat <br> Phasellus pretium, purus congue pulvinar cursus, nunc nisi luctus mi, sit amet maximus est erat a lectus. Nullam condimentum rhoncus dignissim. Pellentesque sagittis feugiat nisi. Vivamus vel faucibus nibh. Proin vitae tellus eros. Nullam nec auctor ligula, a ultrices neque. In id lobortis sem, in rhoncus nulla. Nunc sed cursus odio. Quisque placerat ipsum nec nisl elementum placerat nec in mauris. Cras pulvinar ac diam id gravida. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut nec ante ipsum. Aliquam pellentesque est magna, vel pulvinar velit laoreet sed. Suspendisse dolor ipsum, pharetra a semper eu, mollis id augue. Nunc tristique lacus nec leo ornare vehicula. Proin sit amet purus ut sapien mattis fermentum vel quis dui.',
    },
];

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pins',
        href: '/pins',
    },
];

export default function Pins({ project }: { project: Project }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Pins" />

            <div className="mx-auto p-4 md:max-w-5xl">
                <div className="mb-6 flex items-end justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl">
                            <Pin className="h-6 w-6" />
                            Pins
                        </h1>
                        <p className="hidden text-muted-foreground sm:block">Keep track of important links and notes</p>
                    </div>

                    <Button variant={'outline'}>Open All Links</Button>
                </div>

                <PinsContextMenu>
                    <ScrollArea className="mx-auto h-[69vh] rounded-xl   border p-2 pr-4">
                        <ul className="grid grid-cols-2 gap-2">
                            {testData.map((pin) => {
                                return <>{pin.type === 'link' ? <PinnedLink pin={pin} /> : <PinnedText pin={pin} />}</>;
                            })}
                        </ul>
                    </ScrollArea>

                    <AddPinsMenu />
                </PinsContextMenu>
            </div>
        </AppLayout>
    );
}
