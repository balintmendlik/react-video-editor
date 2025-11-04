import { ADD_AUDIO, ADD_IMAGE, ADD_VIDEO } from "@designcombo/state";
import { dispatch } from "@designcombo/events";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import {
  Music,
  Image as ImageIcon,
  Video as VideoIcon,
  Loader2,
  UploadIcon
} from "lucide-react";
import { generateId } from "@designcombo/timeline";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import useUploadStore from "../store/use-upload-store";
import ModalUpload from "@/components/modal-upload";

export const Uploads = () => {
  const { setShowUploadModal, uploads, pendingUploads, activeUploads } =
    useUploadStore();

  const getVideoDisplayName = (video: any) => {
    let name = video?.fileName || video?.file?.name || video?.url || video?.filePath || "Video";
    if (!video?.file?.name && video?.url) {
      try {
        const url = new URL(video.url);
        const last = url.pathname.split("/").pop() || "";
        name = decodeURIComponent(last) || name;
      } catch {
        const last = String(video.url).split("/").pop() || "";
        try {
          name = decodeURIComponent(last) || name;
        } catch {
          name = last || name;
        }
      }
    }
    return name.length > 10 ? name.slice(0, 10) + "…" : name;
  };

  const getVideoFullName = (video: any) => {
    let name = video?.fileName || video?.file?.name || video?.url || video?.filePath || "Video";
    if (!video?.file?.name && (video?.url || video?.filePath)) {
      const candidate = video?.url || video?.filePath || "";
      try {
        const url = new URL(candidate);
        const last = url.pathname.split("/").pop() || "";
        name = decodeURIComponent(last) || name;
      } catch {
        const last = String(candidate).split("/").pop() || "";
        try {
          name = decodeURIComponent(last) || name;
        } catch {
          name = last || name;
        }
      }
    }
    return name;
  };

  // Group completed uploads by type
  const videos = uploads.filter(
    (upload) => upload.type?.startsWith("video/") || upload.type === "video"
  );
  const images = uploads.filter(
    (upload) => upload.type?.startsWith("image/") || upload.type === "image"
  );
  const audios = uploads.filter(
    (upload) => upload.type?.startsWith("audio/") || upload.type === "audio"
  );

  const handleAddVideo = (video: any) => {
    const srcVideo = video.metadata?.uploadedUrl || video.url;

    dispatch(ADD_VIDEO, {
      payload: {
        id: generateId(),
        details: {
          src: srcVideo,
          volume: 100
        },
        metadata: {
          previewUrl:
            "https://cdn.designcombo.dev/caption_previews/static_preset1.webp"
        }
      },
      options: {
        resourceId: "main",
        scaleMode: "fit"
      }
    });
  };

  const FrozenVideoThumb = ({ src }: { src: string }) => {
    const videoRef = React.useRef<HTMLVideoElement | null>(null)
    const [loaded, setLoaded] = React.useState(false)

    React.useEffect(() => {
      const video = videoRef.current
      if (!video) return
      let cancelled = false

      const onError = () => {
        if (!cancelled) setLoaded(true)
      }

      const onLoadedMeta = () => {
        const fps = 30
        const targetSeconds = 120 / fps
        const duration = Number.isFinite(video.duration) ? video.duration : 0
        const safeTime = Math.max(0, Math.min(Math.max(duration - 0.05, 0), targetSeconds))
        try {
          video.currentTime = safeTime
        } catch {
          // ignore seek errors
        }
      }

      const onSeeked = () => {
        try {
          video.pause()
        } catch {}
        if (!cancelled) setLoaded(true)
      }

      video.addEventListener('error', onError)
      video.addEventListener('loadedmetadata', onLoadedMeta)
      video.addEventListener('seeked', onSeeked)

      // In case metadata is already available
      if (video.readyState >= 1) onLoadedMeta()

      return () => {
        cancelled = true
        video.removeEventListener('error', onError)
        video.removeEventListener('loadedmetadata', onLoadedMeta)
        video.removeEventListener('seeked', onSeeked)
      }
    }, [src])

    return (
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
    )
  }

  const handleAddImage = (image: any) => {
    const srcImage = image.metadata?.uploadedUrl || image.url;

    dispatch(ADD_IMAGE, {
      payload: {
        id: generateId(),
        type: "image",
        display: {
          from: 0,
          to: 5000
        },
        details: {
          src: srcImage
        },
        metadata: {}
      },
      options: {}
    });
  };

  const handleAddAudio = (audio: any) => {
    const srcAudio = audio.metadata?.uploadedUrl || audio.url;
    dispatch(ADD_AUDIO, {
      payload: {
        id: generateId(),
        type: "audio",
        details: {
          src: srcAudio
        },
        metadata: {}
      },
      options: {}
    });
  };

  const UploadPrompt = () => (
    <div className="flex items-center justify-center px-4">
      <Button
        className="w-full cursor-pointer"
        onClick={() => setShowUploadModal(true)}
      >
        <UploadIcon className="w-4 h-4" />
        <span className="ml-2">Upload</span>
      </Button>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="text-text-primary flex h-12 flex-none items-center px-4 text-sm font-medium">
        Your uploads
      </div>
      <ModalUpload />
      <UploadPrompt />

      {/* Uploads in Progress Section */}
      {(pendingUploads.length > 0 || activeUploads.length > 0) && (
        <div className="p-4">
          <div className="font-medium text-sm mb-2 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            Uploads in Progress
          </div>
          <div className="flex flex-col gap-2">
            {pendingUploads.map((upload) => (
              <div key={upload.id} className="flex items-center gap-2">
                <span className="truncate text-xs flex-1">
                  {upload.file?.name || upload.url || "Unknown"}
                </span>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
            ))}
            {activeUploads.map((upload) => (
              <div key={upload.id} className="flex items-center gap-2">
                <span className="truncate text-xs flex-1">
                  {upload.file?.name || upload.url || "Unknown"}
                </span>
                <div className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  <span className="text-xs">{upload.progress ?? 0}%</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {upload.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-10 p-4">
        {/* Videos Section */}
        {videos.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <VideoIcon className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">Videos</span>
            </div>
            <ScrollArea className="max-h-32">
              <div className="grid grid-cols-3 gap-2 max-w-full">
                {videos.map((video, idx) => (
                  <Tooltip key={video.id || idx}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 flex-col w-full">
                        <Card
                          className="w-16 h-16 flex items-center justify-center overflow-hidden relative cursor-pointer"
                          onClick={() => handleAddVideo(video)}
                        >
                          {(() => {
                            const srcVideo = video.metadata?.uploadedUrl || video.url || video.filePath
                            return srcVideo ? (
                              <FrozenVideoThumb src={srcVideo} />
                            ) : (
                              <VideoIcon className="w-8 h-8 text-muted-foreground" />
                            )
                          })()}
                        </Card>
                        <div className="text-xs text-muted-foreground w-full text-center">
                          {getVideoDisplayName(video)}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6} className="bg-white text-black" arrowClassName="bg-white fill-white">
                      {getVideoFullName(video)}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Images Section */}
        {images.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">Images</span>
            </div>
            <ScrollArea className="max-h-32">
              <div className="grid grid-cols-3 gap-2 max-w-full">
                {images.map((image, idx) => (
                  <div
                    className="flex items-center gap-2 flex-col w-full"
                    key={image.id || idx}
                  >
                    <Card
                      className="w-16 h-16 flex items-center justify-center overflow-hidden relative cursor-pointer"
                      onClick={() => handleAddImage(image)}
                    >
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </Card>
                    <div className="text-xs text-muted-foreground truncate w-full text-center">
                      {image.file?.name || image.url || "Image"}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Audios Section */}
        {audios.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">Audios</span>
            </div>
            <ScrollArea className="max-h-32">
              <div className="grid grid-cols-3 gap-2 max-w-full">
                {audios.map((audio, idx) => (
                  <div
                    className="flex items-center gap-2 flex-col w-full"
                    key={audio.id || idx}
                  >
                    <Card
                      className="w-16 h-16 flex items-center justify-center overflow-hidden relative cursor-pointer"
                      onClick={() => handleAddAudio(audio)}
                    >
                      <Music className="w-8 h-8 text-muted-foreground" />
                    </Card>
                    <div className="text-xs text-muted-foreground truncate w-full text-center">
                      {audio.file?.name || audio.url || "Audio"}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};
