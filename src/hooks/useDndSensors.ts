import { useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { isIOS } from '../utils/iosSupport';

export const useDndSensors = () => {
  const activationConstraint = isIOS()
    ? { delay: 300, tolerance: 5 } // iOS: long-press для начала перетаскивания
    : { distance: 5 }; // Desktop/Android: начать после небольшого движения

  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint,
    })
  );
}; 