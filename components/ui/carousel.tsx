'use client'

import {
  Children,
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CarouselContextValue = {
  canGoNext: boolean;
  canGoPrev: boolean;
  currentIndex: number;
  goToNext: () => void;
  goToPrev: () => void;
  setItemCount: (count: number) => void;
};

const CarouselContext = createContext<CarouselContextValue | null>(null);

const useCarousel = () => {
  const context = useContext(CarouselContext);

  if (!context) {
    throw new Error("Carousel components must be used within a Carousel.");
  }

  return context;
};

type CarouselProps = {
  children: ReactNode;
  className?: string;
};

const Carousel = ({ children, className }: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemCount, setItemCount] = useState(0);

  const clampedIndex = itemCount === 0 ? 0 : Math.min(currentIndex, itemCount - 1);

  const value = useMemo(
    () => ({
      canGoNext: clampedIndex < itemCount - 1,
      canGoPrev: clampedIndex > 0,
      currentIndex: clampedIndex,
      goToNext: () => setCurrentIndex((current) => Math.min(current + 1, itemCount - 1)),
      goToPrev: () => setCurrentIndex((current) => Math.max(current - 1, 0)),
      setItemCount: (count: number) => {
        setItemCount(count);
        setCurrentIndex((current) => (count === 0 ? 0 : Math.min(current, count - 1)));
      },
    }),
    [clampedIndex, itemCount]
  );

  return (
    <CarouselContext.Provider value={value}>
      <div className={cn("space-y-4", className)}>{children}</div>
    </CarouselContext.Provider>
  );
};

const CarouselContent = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const { currentIndex, setItemCount } = useCarousel();
  const items = useMemo(() => Children.toArray(children), [children]);

  useEffect(() => {
    setItemCount(items.length);
  }, [items.length, setItemCount]);

  return (
    <div className={cn("w-full", className)} {...props}>
      {items[currentIndex] ?? null}
    </div>
  );
};

const CarouselItem = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("w-full", className)} {...props} />;
};

type CarouselButtonProps = {
  direction: "prev" | "next";
  className?: string;
};

const CarouselButton = ({ direction, className }: CarouselButtonProps) => {
  const { canGoNext, canGoPrev, goToNext, goToPrev } = useCarousel();
  const isPrev = direction === "prev";

  return (
    <Button
      type="button"
      size="icon"
      onClick={isPrev ? goToPrev : goToNext}
      className={className}
      disabled={isPrev ? !canGoPrev : !canGoNext}
      aria-label={isPrev ? "Previous schedules" : "Next schedules"}
    >
      {isPrev ? <ChevronLeft className="size-6" /> : <ChevronRight className="size-6" />}
    </Button>
  );
};

const CarouselControls = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("flex items-center justify-end p-2 gap-2", className)} {...props} />;
};

export {
  Carousel,
  CarouselButton,
  CarouselContent,
  CarouselControls,
  CarouselItem,
};
