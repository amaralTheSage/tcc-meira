import { LandingCarousel } from '@/components/landing-page/carousel';
import { Link, usePage } from '@inertiajs/react';
import { DownloadIcon } from 'lucide-react';

export default function Welcome() {
    const auth = usePage().props;

    return (
        <div className="landing-background-gradient overflow-clip py-5">
            <div className="mx-auto">
                <header className="mx-auto mb-6 flex w-full items-center justify-between px-4 text-sm md:max-w-6xl">
                    <h1 className="font-cardo mt-1.5 h-min text-[36px] italic">MEIRA</h1>
                    <nav className="mt-1">
                        {auth.user ? (
                            <Link
                                href={route('home')}
                                className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                            >
                                Entrar no Woro
                            </Link>
                        ) : (
                            <>
                                <Link
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
                    <section className="mx-auto flex justify-between px-4 py-9 md:max-w-6xl">
                        <div className="font-cardo w-[40%] space-y-2">
                            <h1 className="text-[40px]">Get in with your team and get straight to it</h1>
                            <h2 className="w-4/5 text-[26px] text-gray-400">A quick and practical manager tool for your simpler projects</h2>

                            <div className="mt-6 w-fit space-y-4">
                                <button className="flex cursor-pointer items-start justify-center gap-3 rounded-md bg-[#640f0f] px-9 py-3 pt-3.5 text-lg font-semibold shadow-sm">
                                    <DownloadIcon /> Instale no Windows
                                </button>

                                <Link
                                    href={route('home')}
                                    className="flex w-fit cursor-pointer items-start justify-center gap-3 rounded-md bg-white px-7 py-3 pt-3.5 font-semibold text-secondary shadow-sm"
                                >
                                    Continue pelo Navegador
                                </Link>
                            </div>
                        </div>

                        <div className="relative w-full">
                            <img src="/landing-laptop.svg" alt="" className="relative bottom-7 w-full" />
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
    );
}
