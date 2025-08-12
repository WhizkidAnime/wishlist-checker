import { useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { isIOS } from '../utils/iosSupport';

export const useDndSensors = () => {
  const activationConstraint = isIOS()
    ? { delay: 250, tolerance: 5 } // iOS: long-press перед началом DnD
    : { distance: 5 };

  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint,
    })
  );
}; 