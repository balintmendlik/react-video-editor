import { IVideo } from "@designcombo/types";
import { BaseSequence, SequenceItemOptions } from "../base-sequence";
import { BoxAnim, ContentAnim, MaskAnim } from "@designcombo/animations";
import { calculateContainerStyles, calculateMediaStyles } from "../styles";
import { getAnimations } from "../../utils/get-animations";
import { calculateFrames } from "../../utils/frames";
import { Video as RemotionVideo } from "remotion";

export const Video = ({
  item,
  options
}: {
  item: IVideo;
  options: SequenceItemOptions;
}) => {
  const { fps, frame } = options;
  const { details, animations } = item;
  const playbackRate = item.playbackRate || 1;
  const { animationIn, animationOut, animationTimed } = getAnimations(
    animations!,
    item,
    frame,
    fps
  );
  const crop = details?.crop || {
    x: 0,
    y: 0,
    width: details.width,
    height: details.height
  };
  const { durationInFrames } = calculateFrames(item.display, fps);
  const currentFrame = (frame || 0) - (item.display.from * fps) / 1000;

  const effectiveSrc = (() => {
    const src = details.src as string
    if (typeof window === "undefined" || !src) return src
    try {
      const url = new URL(src, window.location.origin)
      const isExternal = url.origin !== window.location.origin
      if (isExternal) {
        return `/api/uploads/url?u=${encodeURIComponent(src)}`
      }
    } catch {}
    return src
  })()

  const children = (
    <BoxAnim
      style={calculateContainerStyles(details, crop, {
        overflow: "hidden"
      })}
      animationIn={animationIn}
      animationOut={animationOut}
      frame={currentFrame}
      durationInFrames={durationInFrames}
    >
      <ContentAnim
        animationTimed={animationTimed}
        durationInFrames={durationInFrames}
        frame={currentFrame}
      >
        <MaskAnim
          item={item}
          keyframeAnimations={animationTimed}
          frame={frame || 0}
        >
          <div style={calculateMediaStyles(details, crop)}>
            {(() => {
              const props: any = {
                playbackRate: playbackRate,
                src: details.src,
                volume:
                  typeof details.volume === "number"
                    ? details.volume / 100
                    : 1,
                muted: false,
                onError: (err: unknown) => {
                  console.warn("Video playback warning", {
                    src: details.src,
                    error: err,
                  });
                },
              };
              if (item.trim && typeof item.trim.from === "number") {
                props.startFrom = (item.trim.from / 1000) * fps;
              }
              if (item.trim && typeof item.trim.to === "number") {
                props.endAt = (item.trim.to / 1000) * fps;
              }
              return <RemotionVideo {...props} src={effectiveSrc} />;
            })()}
          </div>
        </MaskAnim>
      </ContentAnim>
    </BoxAnim>
  );

  return BaseSequence({ item, options, children });
};

export default Video;
