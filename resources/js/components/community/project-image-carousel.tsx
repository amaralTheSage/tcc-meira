import Autoplay from 'embla-carousel-autoplay';
import * as React from 'react';

import { Card } from '@/components/ui/card';
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { CommunityPostImage } from '@/types/models';

export function ProjectImageCarousel({ images, title }: { images: CommunityPostImage[]; title: string }) {
    const plugin = React.useRef(Autoplay({ delay: 3000, stopOnInteraction: true }));
    const [api, setApi] = React.useState<CarouselApi>();
    const [current, setCurrent] = React.useState(0);
    const slides = images.length > 0 ? images : [{ url: '/landing-carousel/traceboard.png' }];

    React.useEffect(() => {
        if (!api) return;

        setCurrent(api.selectedScrollSnap() + 1);
        api.on('select', () => setCurrent(api.selectedScrollSnap() + 1));
    }, [api]);

    return (
        <div className="overflow-hidden">
            <Carousel plugins={[plugin.current]} className="w-full" setApi={setApi} onMouseEnter={plugin.current.stop} onMouseLeave={plugin.current.reset}>
                <CarouselContent className="-ml-4">
                    {slides.map((image, index) => (
                        <CarouselItem key={`${image.url}-${index}`} className="basis-[78%] pl-4 transition-transform duration-300 ease-out">
                            <Card className="relative overflow-hidden rounded-md border-neutral-800 p-0 shadow-xl">
                                <img src={image.url} alt={`${title} gallery ${index + 1}`} className="h-80 w-full object-cover" />
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                {slides.length > 1 && <CarouselPrevious className="left-1 bg-white text-gray-800" />}
                {slides.length > 1 && <CarouselNext className="right-1 bg-white text-gray-800" />}
            </Carousel>

            {slides.length > 1 && (
                <div className="mt-6 flex justify-center space-x-2">
                    {slides.map((image, index) => (
                        <button
                            key={`${image.url}-dot-${index}`}
                            className={cn('h-2 w-2 rounded-full transition-all duration-300', current === index + 1 ? 'w-8 bg-primary' : 'bg-primary/30')}
                            onClick={() => api?.scrollTo(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
