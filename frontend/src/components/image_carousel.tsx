import { type FC, useEffect, useState } from "react";

type Photo = {
    src: string;
};

type Props = {
    photos: Photo[];
    interval?: number;
};

export const ImageCarousel: FC<Props> = ({ photos, interval = 2000 }) => {
    const [index, setIndex] = useState(0);
    const [direction, setDirection] = useState<1 | -1>(1);

    useEffect(() => {
        const id = setInterval(() => {
            setDirection(1);
            setIndex((prev) => (prev + 1) % photos.length);
        }, interval);

        return () => clearInterval(id);
    }, [photos.length, interval]);

    const goNext = () => {
        setDirection(1);
        setIndex((prev) => (prev + 1) % photos.length);
    };

    const goPrev = () => {
        setDirection(-1);
        setIndex((prev) => (prev - 1 + photos.length) % photos.length);
    };

    return (
        <div className="relative w-full h-[500px] overflow-hidden rounded-xl">
            {photos.map((photo, i) => (
                <img
                    key={photo.src}
                    src={photo.src}
                    className={`
            absolute inset-0 w-full h-full object-cover
            transition-all duration-700 ease-in-out
            ${
                i === index
                    ? "opacity-100 translate-x-0"
                    : direction === 1
                      ? "opacity-0 translate-x-8"
                      : "opacity-0 -translate-x-8"
            }
          `}
                    alt=""
                />
            ))}

            <button
                onClick={goPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2
                   bg-black/40 hover:bg-black/60
                   text-white rounded-full w-10 h-10"
            >
                ‹
            </button>

            <button
                onClick={goNext}
                className="absolute right-4 top-1/2 -translate-y-1/2
                   bg-black/40 hover:bg-black/60
                   text-white rounded-full w-10 h-10"
            >
                ›
            </button>
        </div>
    );
};
