import communityWavyBackgroundUrl from '@/assets/community_wavy_thing.svg';
import { AddProjectDialog } from '@/components/home/add-project-dialog';
import HomeNotificationMenu from '@/components/home/home-notification-menu';
import HomeProjectCard from '@/components/home/home-project-card';
import { UseTemplateDialog } from '@/components/home/use-template-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User } from '@/types';
import { Project, Template } from '@/types/models';
import { Head, Link } from '@inertiajs/react';
import { Globe } from 'lucide-react';

export default function Home({
    projects = [],
    users = [],
    templates = [],
}: {
    projects?: Project[];
    users?: User[];
    templates?: Template[];
}) {
    return (
        <>
            <Head title="Home" />

            <div className="flex h-screen items-center px-4">
                <main
                    data-testid="home-page"
                    className="g-[#FDFDFC] m-6 mx-auto h-[600px] w-full max-w-lg flex-col gap-3 rounded-lg bg-sidebar p-4 text-[13px] text-[#1b1b18] max-md:flex max-md:space-y-3 md:grid md:max-w-4xl md:grid-cols-2 md:p-8 dark:text-primary"
                >
                    {/* community */}
                    <div className="hidden flex-col md:flex">
                        <div className="mx-auto mb-2 flex w-fit grow-0 items-center gap-4 text-4xl">
                            <img src="/gato_safado.svg" className="mb-2 w-12" />
                            <span className="font-cardo h-min italic">MEIRA</span>
                        </div>
                        <Link href="/community" className="h-full">
                            <div className="flex h-full flex-col justify-between rounded-md bg-background shadow-sm shadow-black dark:text-primary">
                                <div className="ml-auto p-6">
                                    <Globe size={32} />
                                </div>

                                <div
                                    className="h-40 rounded-b-md bg-cover bg-top p-5 py-18 text-3xl"
                                    style={{ backgroundImage: `url(${communityWavyBackgroundUrl})` }}
                                >
                                    <h2>Community</h2>
                                    <p className="text-base text-muted-foreground">See what your friends are working on</p>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Mobile */}
                    <Link href="/community" className="h-fit md:hidden">
                        <div className="mx-auto mb-2 flex w-fit grow-0 items-center gap-4 text-4xl">
                            <img src="/gato_safado.svg" className="mb-2 w-12" />
                            <span className="font-cardo h-min italic">MEIRA</span>
                        </div>
                        <div className="flex gap-3 rounded-md bg-background p-3 text-2xl shadow-sm shadow-black dark:text-primary">
                            <Globe size={28} />
                            <div>
                                <h2>Community</h2>
                                <p className="text-base text-muted-foreground">See what your friends are working on</p>
                            </div>
                        </div>
                    </Link>

                    {/* projects */}
                    <div className="flex flex-1 flex-col justify-between rounded-md bg-muted px-3 py-4 shadow-sm shadow-black">
                        <ScrollArea type="auto" className="h-full">
                            <div>
                                <div className="flex justify-between px-3">
                                    <h1 className="mb-2 text-xl font-medium">Your Projects</h1>
                                    <HomeNotificationMenu />
                                </div>

                                <ul data-testid="home-project-list" className="">
                                    {projects.map((project) => (
                                        <HomeProjectCard project={project} key={project.id} />
                                    ))}
                                </ul>
                            </div>
                            {projects.length < 10 && (
                                <AddProjectDialog users={users}>
                                    <div data-testid="home-new-project-trigger" className="mx-auto w-fit">
                                        <Button variant={'link'} className="cursor-pointer">
                                            New Project
                                        </Button>
                                    </div>
                                </AddProjectDialog>
                            )}
                        </ScrollArea>

                        <UseTemplateDialog templates={templates}>
                            <Button variant={'link'}>Use A Template</Button>
                        </UseTemplateDialog>
                    </div>
                </main>
            </div>
        </>
    );
}
