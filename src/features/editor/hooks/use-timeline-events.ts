import useStore from "../store/use-store";
import { useEffect } from "react";
import { filter, subject } from "@designcombo/events";
import {
  PLAYER_PAUSE,
  PLAYER_PLAY,
  PLAYER_PREFIX,
  PLAYER_SEEK,
  PLAYER_SEEK_BY,
  PLAYER_TOGGLE_PLAY
} from "../constants/events";
import { LAYER_PREFIX, LAYER_SELECTION, LAYER_DELETE } from "@designcombo/state";
import { TIMELINE_SEEK, TIMELINE_PREFIX } from "@designcombo/timeline";
import { getSafeCurrentFrame } from "../utils/time";
import StateManager from "@designcombo/state";

const useTimelineEvents = (stateManager?: StateManager) => {
  const { playerRef, fps, timeline, setState } = useStore();

  //handle player events
  useEffect(() => {
    const playerEvents = subject.pipe(
      filter(({ key }) => key.startsWith(PLAYER_PREFIX))
    );
    const timelineEvents = subject.pipe(
      filter(({ key }) => key.startsWith(TIMELINE_PREFIX))
    );

    const timelineEventsSubscription = timelineEvents.subscribe((obj) => {
      if (obj.key === TIMELINE_SEEK) {
        const time = obj.value?.payload?.time;
        if (playerRef?.current && typeof time === "number") {
          playerRef.current.seekTo((time / 1000) * fps);
        }
      }
    });
    const playerEventsSubscription = playerEvents.subscribe((obj) => {
      if (obj.key === PLAYER_SEEK) {
        const time = obj.value?.payload?.time;
        if (playerRef?.current && typeof time === "number") {
          playerRef.current.seekTo((time / 1000) * fps);
        }
      } else if (obj.key === PLAYER_PLAY) {
        playerRef?.current?.play();
      } else if (obj.key === PLAYER_PAUSE) {
        playerRef?.current?.pause();
      } else if (obj.key === PLAYER_TOGGLE_PLAY) {
        if (playerRef?.current?.isPlaying()) {
          playerRef.current.pause();
        } else {
          playerRef?.current?.play();
        }
      } else if (obj.key === PLAYER_SEEK_BY) {
        const frames = obj.value?.payload?.frames;
        if (playerRef?.current && typeof frames === "number") {
          const safeCurrentFrame = getSafeCurrentFrame(playerRef);
          playerRef.current.seekTo(Math.round(safeCurrentFrame) + frames);
        }
      }
    });

    return () => {
      playerEventsSubscription.unsubscribe();
      timelineEventsSubscription.unsubscribe();
    };
  }, [playerRef, fps]);

  // handle selection and delete events
  useEffect(() => {
    const layerEvents = subject.pipe(
      filter(({ key }) => key.startsWith(LAYER_PREFIX))
    );

    const layerSubscription = layerEvents.subscribe((obj) => {
      if (obj.key === LAYER_SELECTION) {
        setState({
          activeIds: obj.value?.payload.activeIds
        });
      } else if (obj.key === LAYER_DELETE && stateManager) {
        // Get current state
        const currentState = stateManager.getState();
        const activeIds = currentState.activeIds;

        if (activeIds.length === 0) return;

        // Create new state without the deleted items
        const newTrackItemIds = currentState.trackItemIds.filter(
          (id) => !activeIds.includes(id)
        );

        const newTrackItemsMap = { ...currentState.trackItemsMap };
        activeIds.forEach((id) => {
          delete newTrackItemsMap[id];
        });

        const newTracks = currentState.tracks.map((track) => ({
          ...track,
          items: track.items.filter((id) => !activeIds.includes(id))
        }));

        // Update the state
        stateManager.updateState(
          {
            trackItemIds: newTrackItemIds,
            trackItemsMap: newTrackItemsMap,
            tracks: newTracks,
            activeIds: []
          },
          {
            updateHistory: true,
            kind: "layer:delete"
          }
        );
      }
    });
    return () => layerSubscription.unsubscribe();
  }, [timeline, stateManager, setState]);
};

export default useTimelineEvents;
