'use client';

import Autoplay from 'embla-carousel-autoplay';
import * as React from 'react';

import { Card } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

export function LandingCarousel() {
    const plugin = React.useRef(Autoplay({ delay: 2000, stopOnInteraction: true }));

    return (
        <div className="overflow-hidden px-4">
            <Carousel
                plugins={[plugin.current]}
                className="w-full"
                onMouseEnter={plugin.current.stop}
                onMouseLeave={plugin.current.reset}
                opts={{
                    align: 'center',
                    loop: true,
                }}
            >
                <CarouselContent className="-ml-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <CarouselItem key={index} className="basis-[78%] pl-4 transition-transform duration-300 ease-out">
                            <Card className="relative rounded-xl shadow-xl">
                                <img src="/landing-carousel/traceboard.png" alt="" />

                                <div className="absolute right-0 bottom-0 w-lg rounded-tl-2xl bg-[#221a1a] p-5 text-[#d7bebe]">
                                    <p className="mb-2 text-lg text-[#eae0e0] italic">Get in With the Squad</p>
                                    <p className="text-sm">
                                        Lorem ipsum dolor sit amet consectetur adipisicing elit. At expedita accusamus enim quod perferendis
                                        consequuntur hic.
                                    </p>
                                </div>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    );
}
