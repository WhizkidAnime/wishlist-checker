import React, { useEffect, useState, useRef } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";

export interface CarouselItem {
  title: string;
  description: string;
  id: number;
  icon: React.ReactNode;
}

export interface CarouselProps {
  items?: CarouselItem[];
  baseWidth?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  round?: boolean;
  themeConfig?: {
    background: string; // tailwind bg classes for card
    text: string;       // tailwind text classes
    border: string;     // tailwind border classes
  };
}

const DRAG_BUFFER = 0;
const VELOCITY_THRESHOLD = 500;
const GAP = 16;
const SPRING_OPTIONS = { type: "spring", stiffness: 300, damping: 30 };

export default function Carousel({
  items = [],
  baseWidth = 300,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  loop = false,
  round = false,
  themeConfig,
}: CarouselProps): React.ReactElement {
  const containerPadding = 16;
  const itemWidth = baseWidth - containerPadding * 2;
  const trackItemOffset = itemWidth + GAP;

  // Для бесшовной прокрутки дублируем первый и последний элементы
  const carouselItems = loop && items.length > 0
    ? [items[items.length - 1], ...items, items[0]]
    : items;
  // Стартуем с 1-го индекса, чтобы показывать фактически первый элемент
  const [currentIndex, setCurrentIndex] = useState<number>(loop && items.length > 0 ? 1 : 0);
  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (pauseOnHover && containerRef.current) {
      const container = containerRef.current;
      const handleMouseEnter = () => setIsHovered(true);
      const handleMouseLeave = () => setIsHovered(false);
      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);
      return () => {
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, [pauseOnHover]);

  useEffect(() => {
    if (autoplay && (!pauseOnHover || !isHovered) && items.length > 0) {
      const timer = setInterval(() => {
        if (isAnimatingRef.current) return;
        setIsAnimating(true);
        setCurrentIndex((prev) => (!loop ? Math.min(prev + 1, carouselItems.length - 1) : prev + 1));
      }, autoplayDelay);
      return () => clearInterval(timer);
    }
  }, [autoplay, autoplayDelay, isHovered, loop, items.length, carouselItems.length, pauseOnHover]);

  // Блокируем новые анимации, пока текущая не завершится (анти-спам свайпов)
  const effectiveTransition = isResetting || isAnimating ? { ...SPRING_OPTIONS } : SPRING_OPTIONS;

  const handleAnimationComplete = () => {
    if (!loop || items.length === 0) return;
    // если ушли на правый клон (после последнего реального)
    if (currentIndex === carouselItems.length - 1) {
      setIsResetting(true);
      x.set(-trackItemOffset * 1);
      setCurrentIndex(1);
      setTimeout(() => { setIsResetting(false); setIsAnimating(false); }, 20);
      return;
    }
    // если ушли на левый клон (перед первым реальным)
    if (currentIndex === 0) {
      setIsResetting(true);
      x.set(-trackItemOffset * items.length);
      setCurrentIndex(items.length);
      setTimeout(() => { setIsResetting(false); setIsAnimating(false); }, 20);
      return;
    }
    setIsAnimating(false);
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ): void => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    setIsAnimating(true);
    if (offset < -DRAG_BUFFER || velocity < -VELOCITY_THRESHOLD) {
      setCurrentIndex((prev) => Math.min(prev + 1, carouselItems.length - 1));
    } else if (offset > DRAG_BUFFER || velocity > VELOCITY_THRESHOLD) {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    } else {
      // вернуться к текущему (снэп)
      setCurrentIndex((prev) => prev);
    }
  };

  const dragProps = loop
    ? {}
    : {
        dragConstraints: {
          left: -trackItemOffset * (carouselItems.length - 1),
          right: 0,
        },
      };

  const tc = {
    background: themeConfig?.background ?? "bg-white dark:bg-gray-800",
    text: themeConfig?.text ?? "text-gray-900 dark:text-gray-100",
    border: themeConfig?.border ?? "border-gray-200 dark:border-gray-700",
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden p-4 ${
        round
          ? `rounded-full border ${tc.border}`
          : `rounded-[24px] border ${tc.border}`
      }`}
      style={{
        width: `${baseWidth}px`,
        ...(round && { height: `${baseWidth}px` }),
      }}
    >
      <motion.div
        className="flex"
        drag="x"
        {...dragProps}
        style={{
          gap: `${GAP}px`,
          perspective: 1000,
          perspectiveOrigin: `${currentIndex * trackItemOffset + itemWidth / 2}px 50%`,
          x,
        }}
        onDragEnd={handleDragEnd}
        animate={{ x: -(currentIndex * trackItemOffset) }}
        transition={effectiveTransition}
        onAnimationComplete={handleAnimationComplete}
      >
        {carouselItems.map((item, index) => {
          const range = [
            -(index + 1) * trackItemOffset,
            -index * trackItemOffset,
            -(index - 1) * trackItemOffset,
          ];
          const outputRange = [90, 0, -90];
          const rotateY = useTransform(x, range, outputRange, { clamp: false });
          // Нормируем размер вложенной SVG-иконки для единообразия
          const iconNode = React.isValidElement(item.icon)
            ? React.cloneElement(item.icon as React.ReactElement<any>, {
                className: `${(item.icon as any).props?.className ?? ""} w-6 h-6`.trim(),
              })
            : item.icon;

          return (
            <motion.div
              key={index}
              className={`relative shrink-0 flex flex-col ${
                round
                  ? `items-center justify-center text-center border-0 ${tc.background}`
                  : `items-start justify-between rounded-[12px] ${tc.background} ${tc.border}`
              } overflow-hidden cursor-grab active:cursor-grabbing`}
              style={{
                width: itemWidth,
                height: round ? itemWidth : "auto",
                minHeight: round ? itemWidth : 200,
                rotateY: rotateY,
                ...(round && { borderRadius: "50%" }),
              }}
              transition={effectiveTransition}
            >
              <div className={`${round ? "p-0 m-0" : "pt-6 px-6"}`}>
                <span className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-900/90 dark:bg-gray-700/80 text-white shadow-sm`}>
                  {iconNode}
                </span>
              </div>
              <div className="px-6 pb-6 pt-4">
                <div className={`mb-1 text-xl font-semibold tracking-tight ${tc.text}`}>
                  {item.title}
                </div>
                <p className={`text-sm ${tc.text} opacity-70 leading-snug`}>{item.description}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
      <div
        className={`flex w-full justify-center ${
          round ? "absolute z-20 bottom-12 left-1/2 -translate-x-1/2" : ""
        }`}
      >
        <div className="mt-4 flex w-[150px] justify-between px-8">
          {items.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 w-2 rounded-full cursor-pointer transition-colors duration-150 ${
                (items.length > 0 && ((loop ? (currentIndex - 1 + items.length) % items.length : currentIndex) === index))
                  ? round
                    ? "bg-gray-900 dark:bg-gray-100"
                    : "bg-gray-800 dark:bg-gray-100"
                  : round
                    ? "bg-gray-400 dark:bg-gray-500"
                    : "bg-gray-300 dark:bg-gray-600"
              }`}
              animate={{
                scale: items.length > 0 && ((loop ? (currentIndex - 1 + items.length) % items.length : currentIndex) === index) ? 1.2 : 1,
              }}
              onClick={() => setCurrentIndex(loop ? index + 1 : index)}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}