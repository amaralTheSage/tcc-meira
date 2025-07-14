import { AddProjectDialog } from '@/components/home/add-project-dialog';
import HomeNotificationMenu from '@/components/home/home-notification-menu';
import HomeProjectCard from '@/components/home/home-project-card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, type SharedData } from '@/types';
import { Project } from '@/types/models';
import { Head, Link, usePage } from '@inertiajs/react';
import { Globe, Plus } from 'lucide-react';

export default function Home({ projects, users }: { projects: Project[]; users: User[] }) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Home" />

            <div className="flex h-screen items-center px-4">
                <main className="g-[#FDFDFC] m-6 mx-auto h-[600px] w-full max-w-lg flex-col gap-3 rounded-lg bg-sidebar p-4 text-[13px] text-[#1b1b18] max-md:flex max-md:space-y-3 md:grid md:max-w-4xl md:grid-cols-2 md:p-8 dark:text-primary">
                    {/* community */}
                    <Link href="/community" className="hidden flex-col md:flex">
                        <div className="mx-auto mb-2 flex w-fit grow-0 items-center gap-4 text-4xl">
                            <img src="/gato_safado.svg" className="mb-2 w-12" />
                            <span className="font-cardo h-min">MEIRA</span>
                        </div>

                        <div className="flex h-full flex-col justify-between rounded-md bg-background shadow-sm shadow-black dark:text-primary">
                            <div className="ml-auto p-6">
                                <Globe size={32} />
                            </div>

                            <div className="h-40 rounded-b-md bg-[url('/community_wavy_thing.svg')] bg-cover bg-top p-5 py-18 text-3xl">
                                <h2>Community</h2>
                                <p className="text-base text-muted-foreground">See what your friends are working on</p>
                            </div>
                        </div>
                    </Link>

                    {/* Mobile */}
                    <Link href="/community" className="h-fit md:hidden">
                        <div className="flex gap-3 rounded-md bg-background p-3 text-2xl shadow-sm shadow-black dark:text-primary">
                            <Globe size={28} />
                            <div>
                                <h2>Community</h2>
                                <p className="text-base text-muted-foreground">See what your friends are working on</p>
                            </div>
                        </div>
                    </Link>

                    {/* projects */}
                    <ScrollArea type="auto" className="flex flex-1 flex-col justify-between rounded-md bg-muted px-3 py-4 shadow-sm shadow-black">
                        <div>
                            <div className="flex justify-between px-3">
                                <h1 className="mb-2 text-xl font-medium">Seus Projetos</h1>
                                <HomeNotificationMenu />
                            </div>

                            <ul className="">
                                {projects.map((project) => (
                                    <HomeProjectCard project={project} key={project.id} />
                                ))}
                            </ul>
                        </div>
                        {projects.length < 10 && (
                            <AddProjectDialog users={users.data}>
                                <div className="mx-auto w-fit">
                                    <Button variant={'ghost'} className="cursor-pointer">
                                        <Plus />
                                        New Project
                                    </Button>
                                </div>
                            </AddProjectDialog>
                        )}
                    </ScrollArea>
                </main>
            </div>
        </>
    );
}
