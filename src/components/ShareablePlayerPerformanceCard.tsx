import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import ViewShot from 'react-native-view-shot';
import {
  PlayerPerformanceCard,
  type PlayerPerformanceCardProps,
} from '@/src/components/PlayerPerformanceCard';

export type ShareablePlayerPerformanceCardHandle = {
  capture: () => Promise<string | undefined>;
};

export const ShareablePlayerPerformanceCard = forwardRef<
  ShareablePlayerPerformanceCardHandle,
  PlayerPerformanceCardProps
>(function ShareablePlayerPerformanceCard(props, ref) {
  const shotRef = useRef<ViewShot>(null);

  useImperativeHandle(ref, () => ({
    capture: async () => {
      const uri = await shotRef.current?.capture?.();
      return uri ?? undefined;
    },
  }));

  return (
    <ViewShot ref={shotRef} options={{ format: 'png', quality: 1.0 }}>
      <PlayerPerformanceCard {...props} />
    </ViewShot>
  );
});
