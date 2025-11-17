import { LandingCarousel } from '@/components/landing-page/carousel';
import { Head, Link, usePage } from '@inertiajs/react';
import { DownloadIcon } from 'lucide-react';

export default function Welcome() {
    const auth = usePage().props;

    return (
        <>
            <Head title="Get In With The Squad" />
            <div className="landing-background-gradient overflow-clip py-5">
                <div className="mx-auto">
                    <header className="mx-auto mb-6 flex w-full items-center justify-between px-4 text-sm md:max-w-6xl lg:max-w-4/5">
                        <h1 className="font-cardo mt-1.5 h-min text-[36px] italic">MEIRA</h1>
                        <nav className="mt-1">
                            {auth.user ? (
                                <Link
                                    href={route('home')}
                                    prefetch
                                    cacheFor="1m"
                                    className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                >
                                    Entrar no Meira
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        prefetch
                                        cacheFor="1m"
                                        href={route('login')}
                                        className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
                                    >
                                        Log in
                                    </Link>
                                </>
                            )}
                        </nav>
                    </header>
                    <main>
                        <section className="mx-auto mb-2 flex justify-between md:max-w-[95vw]">
                            <div className="font-cardo mx-auto flex h-[90vh] flex-col items-center justify-center space-y-2 bg-[url(/welcome-bg.png)] bg-cover bg-center bg-no-repeat text-center md:bg-contain">
                                <div className="px-4">
                                    <h1 className="text-[60px] text-shadow-black text-shadow-md">Get in with your team and get straight to it</h1>
                                    <h2 className="text-[40px] text-gray-200 text-shadow-gray-900 text-shadow-md">
                                        A quick and practical manager tool for your simpler projects
                                    </h2>

                                    <div className="mt-10 flex justify-center gap-4">
                                        <button className="flex cursor-pointer items-start justify-center gap-3 rounded-md bg-[#640f0f] px-9 py-3 pt-3.5 text-lg font-semibold shadow-lg shadow-gray-950">
                                            <DownloadIcon /> Instale no Linux
                                        </button>

                                        <Link
                                            href={route('home')}
                                            prefetch
                                            cacheFor="1m"
                                            className="flex w-fit cursor-pointer items-start justify-center gap-3 rounded-md bg-white px-7 py-3 pt-3.5 font-semibold text-secondary shadow-lg shadow-gray-950"
                                        >
                                            Continue pelo Navegador
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <LandingCarousel />
                        </section>
                    </main>

                    <footer className="relative">
                        <img src="/gato_safado.svg" alt="" className="absolute right-4 -bottom-15" />
                    </footer>
                </div>
            </div>
        </>
    );
}
