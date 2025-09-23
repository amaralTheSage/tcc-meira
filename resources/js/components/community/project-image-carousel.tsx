import Autoplay from 'embla-carousel-autoplay';
import * as React from 'react';

import { Card } from '@/components/ui/card';
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

export function ProjectImageCarousel() {
    const plugin = React.useRef(Autoplay({ delay: 2000, stopOnInteraction: true }));
    const [api, setApi] = React.useState<CarouselApi>();
    const [current, setCurrent] = React.useState(0);
    const [count, setCount] = React.useState(0);

    React.useEffect(() => {
        if (!api) {
            return;
        }

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);

        api.on('select', () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });
    }, [api]);

    return (
        <div className="overflow-hidden">
            <Carousel
                plugins={[plugin.current]}
                className="w-full"
                setApi={setApi}
                onMouseEnter={plugin.current.stop}
                onMouseLeave={plugin.current.reset}
                opts={{
                    align: 'center',
                    loop: false,
                }}
            >
                <CarouselContent className="-ml-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <CarouselItem key={index} className="basis-[78%] pl-4 transition-transform duration-300 ease-out">
                            <Card className="relative rounded-xl shadow-xl">
                                <img src="/landing-carousel/traceboard.png" alt="" />
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                {/* Navigation Buttons */}
                <CarouselPrevious className="left-1 bg-white text-gray-800" />
                <CarouselNext className="right-1 bg-white text-gray-800" />
            </Carousel>

            <div className="mt-6 flex justify-center space-x-2">
                {Array.from({ length: count }).map((_, index) => (
                    <button
                        key={index}
                        className={cn(
                            'h-2 w-2 rounded-full transition-all duration-300',
                            current === index + 1 ? 'w-8 bg-primary' : 'bg-primary/30 hover:bg-primary/50',
                        )}
                        onClick={() => api?.scrollTo(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
