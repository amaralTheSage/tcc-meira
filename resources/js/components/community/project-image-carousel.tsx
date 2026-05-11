import Autoplay from 'embla-carousel-autoplay';
import * as React from 'react';

import { Card } from '@/components/ui/card';
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { User } from '@/types';
import { CommunityPostImage, CommunityPostPreview } from '@/types/models';
import CommunityProjectPreview from './community-project-preview';

export function ProjectImageCarousel({
    images,
    members = [],
    preview,
    title,
}: {
    images: CommunityPostImage[];
    members?: User[];
    preview?: CommunityPostPreview;
    title: string;
}) {
    const plugin = React.useRef(Autoplay({ delay: 3000, stopOnInteraction: true }));
    const [api, setApi] = React.useState<CarouselApi>();
    const [current, setCurrent] = React.useState(0);

    React.useEffect(() => {
        if (!api) return;

        setCurrent(api.selectedScrollSnap() + 1);
        api.on('select', () => setCurrent(api.selectedScrollSnap() + 1));
    }, [api]);

    return (
        <div className="overflow-hidden">
            {images.length === 0 ? (
                <CommunityProjectPreview members={members} preview={preview} className="h-80 rounded-md border border-neutral-800 shadow-xl" />
            ) : (
                <Carousel
                    plugins={[plugin.current]}
                    className="w-full"
                    setApi={setApi}
                    onMouseEnter={plugin.current.stop}
                    onMouseLeave={plugin.current.reset}
                >
                    <CarouselContent className="-ml-4">
                        {images.map((image, index) => (
                            <CarouselItem key={`${image.url}-${index}`} className="basis-[78%] pl-4 transition-transform duration-300 ease-out">
                                <Card className="relative overflow-hidden rounded-md border-neutral-800 p-0 shadow-xl">
                                    <img src={image.url} alt={`${title} gallery ${index + 1}`} className="h-80 w-full object-cover" />
                                </Card>
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    {images.length > 1 && <CarouselPrevious className="left-1 bg-white text-gray-800" />}
                    {images.length > 1 && <CarouselNext className="right-1 bg-white text-gray-800" />}
                </Carousel>
            )}

            {images.length > 1 && (
                <div className="mt-6 flex justify-center space-x-2">
                    {images.map((image, index) => (
                        <button
                            key={`${image.url}-dot-${index}`}
                            className={cn(
                                'h-2 w-2 rounded-full transition-all duration-300',
                                current === index + 1 ? 'w-8 bg-primary' : 'bg-primary/30',
                            )}
                            onClick={() => api?.scrollTo(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
