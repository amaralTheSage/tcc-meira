'use client';

import Autoplay from 'embla-carousel-autoplay';
import * as React from 'react';

import { Card, CardContent } from '@/components/ui/card';
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
                                <CardContent className="flex aspect-[18/9] items-center justify-center p-6">
                                    <span className="text-4xl font-semibold text-white">{index + 1}</span>
                                </CardContent>

                                <div className="absolute right-0 bottom-0 w-lg rounded-tl-2xl bg-[rgba(52,39,39,0.5)] p-5 text-[#d7bebe]">
                                    <p className="mb-2 text-lg text-[#eae0e0] italic">Junte-se aos puto q são aqueles teus amigo</p>
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
