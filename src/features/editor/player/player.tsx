import { useEffect, useRef } from "react";
import Composition from "./composition";
import { Player as RemotionPlayer, PlayerRef } from "@remotion/player";
import useStore from "../store/use-store";

const Player = () => {
  const playerRef = useRef<PlayerRef>(null);
  const { setPlayerRef, duration, fps, size, background } = useStore();

  useEffect(() => {
    setPlayerRef(playerRef as React.RefObject<PlayerRef>);
  }, []);

  return (
    <RemotionPlayer
      ref={playerRef}
      component={Composition}
      acknowledgeRemotionLicense
      durationInFrames={Math.round((duration / 1000) * fps) || 1}
      compositionWidth={size.width}
      compositionHeight={size.height}
      className={"h-full w-full"}
      style={{ background: background.value }}
      onAutoPlayError={() => {
        // Autoplay may fail due to browser policies. We default-mute and let Remotion retry silently.
      }}
      fps={30}
      overflowVisible
    />
  );
};
export default Player;
