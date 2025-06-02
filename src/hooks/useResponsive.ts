import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 640;
const DESKTOP_WIDE_BREAKPOINT = 1600;
const SCROLL_THRESHOLD = 100;

export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const [isDesktopWide, setIsDesktopWide] = useState(window.innerWidth >= DESKTOP_WIDE_BREAKPOINT);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      setIsDesktopWide(window.innerWidth >= DESKTOP_WIDE_BREAKPOINT);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > SCROLL_THRESHOLD);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return {
    isMobile,
    isDesktopWide,
    showScrollButton,
    scrollToTop
  };
}; 