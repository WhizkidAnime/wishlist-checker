import React, { useEffect, useRef } from "react";
import { useTheme } from "../../hooks/useTheme";

interface FuzzyTextProps {
  children: React.ReactNode;
  fontSize?: number | string;
  fontWeight?: string | number;
  fontFamily?: string;
  color?: string;
  enableHover?: boolean;
  baseIntensity?: number;
  hoverIntensity?: number;
  compact?: boolean; // Компактный режим для эмодзи
}

const FuzzyText: React.FC<FuzzyTextProps> = ({
  children,
  fontSize = "clamp(2rem, 8vw, 8rem)",
  fontWeight = 900,
  fontFamily = "inherit",
  color,
  enableHover = true,
  baseIntensity = 0.18,
  hoverIntensity = 0.5,
  compact = true, // По умолчанию компактный режим
}) => {
  const canvasRef = useRef<HTMLCanvasElement & { cleanupFuzzyText?: () => void}>(null);
  const { actualTheme } = useTheme();
  
  // Автоматически определяем цвет на основе темы, если не передан
  const effectiveColor = color || (actualTheme === 'dark' ? '#ffffff' : '#000000');

  useEffect(() => {
    let animationFrameId: number;
    let isCancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const init = async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      if (isCancelled) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Улучшенное качество рендеринга
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const computedFontFamily =
        fontFamily === "inherit"
          ? window.getComputedStyle(canvas).fontFamily || "sans-serif"
          : fontFamily;

      const fontSizeStr =
        typeof fontSize === "number" ? `${fontSize}px` : fontSize;
      let numericFontSize: number;
      if (typeof fontSize === "number") {
        numericFontSize = fontSize;
      } else {
        const temp = document.createElement("span");
        temp.style.fontSize = fontSize;
        document.body.appendChild(temp);
        const computedSize = window.getComputedStyle(temp).fontSize;
        numericFontSize = parseFloat(computedSize);
        document.body.removeChild(temp);
      }

      const text = React.Children.toArray(children).join("");

      // Проверяем, содержит ли текст эмодзи или специальные символы
      const hasEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(text);
      const hasSpecialChars = /[🔐📶📡🔧⚠️🏠🎯🌓🖥️]/u.test(text);
      const isIconOnly = hasEmoji || hasSpecialChars;

      const offscreen = document.createElement("canvas");
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      // Улучшенный рендеринг для эмодзи и символов
      offCtx.imageSmoothingEnabled = true;
      offCtx.imageSmoothingQuality = 'high';
      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
      offCtx.textBaseline = "alphabetic";
      const metrics = offCtx.measureText(text);

      const actualLeft = metrics.actualBoundingBoxLeft ?? 0;
      const actualRight = metrics.actualBoundingBoxRight ?? metrics.width;
      
      // Для эмодзи и специальных символов увеличиваем fallback значения
      const ascentFallback = isIconOnly ? numericFontSize * 1.2 : numericFontSize;
      const descentFallback = isIconOnly ? numericFontSize * 0.4 : numericFontSize * 0.2;
      
      const actualAscent = metrics.actualBoundingBoxAscent ?? ascentFallback;
      const actualDescent = metrics.actualBoundingBoxDescent ?? descentFallback;

      const textBoundingWidth = Math.ceil(actualLeft + actualRight);
      const tightHeight = Math.ceil(actualAscent + actualDescent);

      // Оптимизируем буферы - учитываем compact режим
      const compactMultiplier = compact && isIconOnly ? 0.7 : 1;
      const baseWidthBuffer = isIconOnly 
        ? Math.max(60 * compactMultiplier, textBoundingWidth * 0.3 * compactMultiplier) 
        : Math.max(50, textBoundingWidth * 0.2);
      const baseHeightBuffer = isIconOnly 
        ? Math.max(40 * compactMultiplier, numericFontSize * 0.4 * compactMultiplier) 
        : Math.max(20, tightHeight * 0.3);
      
      const extraWidthBuffer = baseWidthBuffer;
      const extraHeightBuffer = baseHeightBuffer;
      const offscreenWidth = textBoundingWidth + extraWidthBuffer;

      offscreen.width = offscreenWidth;
      offscreen.height = tightHeight + extraHeightBuffer;

      const xOffset = extraWidthBuffer / 2;
      const yOffset = extraHeightBuffer / 2;
      
      // Переустанавливаем настройки после изменения размера canvas
      offCtx.imageSmoothingEnabled = true;
      offCtx.imageSmoothingQuality = 'high';
      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
      
      // Используем middle baseline для лучшего центрирования эмодзи
      if (isIconOnly) {
        offCtx.textBaseline = "middle";
        offCtx.textAlign = "center";
        // Используем более точное центрирование
        const centerX = offscreen.width / 2;
        const centerY = (actualAscent + yOffset + actualDescent) / 2 + yOffset;
        offCtx.fillStyle = effectiveColor;
        offCtx.fillText(text, centerX, centerY);
      } else {
        offCtx.textBaseline = "alphabetic";
        offCtx.fillStyle = effectiveColor;
        offCtx.fillText(text, xOffset - actualLeft, actualAscent + yOffset);
      }

      // Компактные отступы для эмодзи
      const horizontalMargin = isIconOnly ? (compact ? 25 : 30) : 50;
      const verticalMargin = isIconOnly 
        ? Math.max(compact ? 10 : 15, extraHeightBuffer / (compact ? 4 : 3)) 
        : Math.max(20, extraHeightBuffer);
      canvas.width = offscreenWidth + horizontalMargin * 2;
      canvas.height = tightHeight + extraHeightBuffer + verticalMargin * 2;
      ctx.translate(horizontalMargin, verticalMargin);

      const interactiveLeft = horizontalMargin + xOffset;
      const interactiveTop = verticalMargin;
      const interactiveRight = interactiveLeft + textBoundingWidth;
      const interactiveBottom = interactiveTop + tightHeight + extraHeightBuffer;

      let isHovering = false;
      // Адаптивный размер глитча в зависимости от размера элемента
      const fuzzRange = isIconOnly ? Math.min(25, Math.max(15, textBoundingWidth * 0.1)) : 30;

              const run = () => {
          if (isCancelled) return;
          const totalHeight = tightHeight + extraHeightBuffer;
          ctx.clearRect(
            -fuzzRange,
            -fuzzRange,
            offscreenWidth + 2 * fuzzRange,
            totalHeight + 2 * fuzzRange
          );
          const intensity = isHovering ? hoverIntensity : baseIntensity;
          for (let j = 0; j < totalHeight; j++) {
            const dx = Math.floor(intensity * (Math.random() - 0.5) * fuzzRange);
            ctx.drawImage(
              offscreen,
              0,
              j,
              offscreenWidth,
              1,
              dx,
              j,
              offscreenWidth,
              1
            );
          }
          animationFrameId = window.requestAnimationFrame(run);
        };

      run();

      const isInsideTextArea = (x: number, y: number) =>
        x >= interactiveLeft &&
        x <= interactiveRight &&
        y >= interactiveTop &&
        y <= interactiveBottom;

      const handleMouseMove = (e: MouseEvent) => {
        if (!enableHover) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        isHovering = isInsideTextArea(x, y);
      };

      const handleMouseLeave = () => {
        isHovering = false;
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!enableHover) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        isHovering = isInsideTextArea(x, y);
      };

      const handleTouchEnd = () => {
        isHovering = false;
      };

      if (enableHover) {
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseleave", handleMouseLeave);
        canvas.addEventListener("touchmove", handleTouchMove, {
          passive: false,
        });
        canvas.addEventListener("touchend", handleTouchEnd);
      }

      const cleanup = () => {
        window.cancelAnimationFrame(animationFrameId);
        if (enableHover) {
          canvas.removeEventListener("mousemove", handleMouseMove);
          canvas.removeEventListener("mouseleave", handleMouseLeave);
          canvas.removeEventListener("touchmove", handleTouchMove);
          canvas.removeEventListener("touchend", handleTouchEnd);
        }
      };

      canvas.cleanupFuzzyText = cleanup;
    };

    init();

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(animationFrameId);
      if (canvas && canvas.cleanupFuzzyText) {
        canvas.cleanupFuzzyText();
      }
    };
  }, [
    children,
    fontSize,
    fontWeight,
    fontFamily,
    effectiveColor,
    enableHover,
    baseIntensity,
    hoverIntensity,
    compact,
  ]);

  return <canvas ref={canvasRef} className="transition-opacity duration-200" />;
};

export default FuzzyText; 