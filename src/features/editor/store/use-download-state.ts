import { IDesign } from "@designcombo/types";
import { create } from "zustand";
interface Output {
  url: string;
  type: string;
}

interface DownloadState {
  projectId: string;
  exporting: boolean;
  exportType: "json" | "mp4";
  progress: number;
  output?: Output;
  payload?: IDesign;
  displayProgressModal: boolean;
  actions: {
    setProjectId: (projectId: string) => void;
    setExporting: (exporting: boolean) => void;
    setExportType: (exportType: "json" | "mp4") => void;
    setProgress: (progress: number) => void;
    setState: (state: Partial<DownloadState>) => void;
    setOutput: (output: Output) => void;
    startExport: () => void;
    setDisplayProgressModal: (displayProgressModal: boolean) => void;
  };
}

//const baseUrl = "https://api.combo.sh/v1";

export const useDownloadState = create<DownloadState>((set, get) => ({
  projectId: "",
  exporting: false,
  exportType: "mp4",
  progress: 0,
  displayProgressModal: false,
  actions: {
    setProjectId: (projectId) => set({ projectId }),
    setExporting: (exporting) => set({ exporting }),
    setExportType: (exportType) => set({ exportType }),
    setProgress: (progress) => set({ progress }),
    setState: (state) => set({ ...state }),
    setOutput: (output) => set({ output }),
    setDisplayProgressModal: (displayProgressModal) =>
      set({ displayProgressModal }),
    startExport: async () => {
      try {
        // Set exporting to true at the start
        set({ exporting: true, displayProgressModal: true, progress: 0 });

        // Get payload from state
        const { payload, exportType } = get();

        if (!payload) throw new Error("Payload is not defined");

        // Handle JSON export (no rendering needed)
        if (exportType === "json") {
          const jsonBlob = new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json"
          });
          const url = URL.createObjectURL(jsonBlob);
          set({ 
            exporting: false, 
            output: { url, type: "json" },
            progress: 100 
          });
          return;
        }

        // For MP4 export, use Remotion Lambda
        console.log("Starting Remotion Lambda export...");

        // Extract track items from payload
        // First, let's see what the payload structure looks like
        console.log('[Export] Payload structure:', {
          hasTracks: !!payload.tracks,
          tracksCount: payload.tracks?.length,
          hasTrackItemsMap: !!payload.trackItemsMap,
          trackItemsMapKeys: Object.keys(payload.trackItemsMap || {}).length
        });

        // Track items might be in trackItemsMap, not in tracks.items
        let trackItems: any[] = [];
        
        if (payload.trackItemsMap) {
          // Get track items from the map
          console.log('[Export] trackItemsMap sample:', {
            keys: Object.keys(payload.trackItemsMap).slice(0, 3),
            firstValue: Object.values(payload.trackItemsMap)[0]
          });
          trackItems = Object.values(payload.trackItemsMap);
          console.log('[Export] Using trackItemsMap, found', trackItems.length, 'items');
        } else if (payload.tracks) {
          // Fallback to old method
          trackItems = payload.tracks.flatMap(track => track.items || []);
          console.log('[Export] Using tracks.items, found', trackItems.length, 'items');
        }

        console.log("Track items before validation:", trackItems.length);
        
        // Log first item for debugging
        if (trackItems.length > 0) {
          console.log('[Export] First track item sample:', trackItems[0]);
        }
        
        // Filter out invalid track items BEFORE sending to Lambda
        const validTrackItems = trackItems.filter((item, index) => {
          // Check if item is even an object
          if (typeof item !== 'object' || item === null) {
            console.error(`[Export] Track item ${index} is not an object:`, typeof item, item);
            return false;
          }
          
          // Check for required properties
          if (!item.id || !item.type) {
            console.error(`[Export] Track item ${index} missing basic properties:`, {
              hasId: !!item.id,
              hasType: !!item.type,
              keys: Object.keys(item),
              item
            });
            return false;
          }
          
          // Check for display property
          if (!item.display) {
            console.error(`[Export] Track item ${item.id} missing display property:`, item);
            return false;
          }
          
          // Check display values
          if (typeof item.display.from !== 'number' || typeof item.display.to !== 'number') {
            console.error(`[Export] Track item ${item.id} has invalid display values:`, {
              from: item.display.from,
              to: item.display.to
            });
            return false;
          }
          
          // Check display range
          if (item.display.from < 0 || item.display.to <= item.display.from) {
            console.error(`[Export] Track item ${item.id} has invalid display range:`, {
              from: item.display.from,
              to: item.display.to
            });
            return false;
          }
          
          return true;
        });

        console.log(`Track items after validation: ${validTrackItems.length} (removed ${trackItems.length - validTrackItems.length} invalid items)`);
        
        // Log details of valid track items for debugging
        console.log('[Export] Valid track items details:');
        validTrackItems.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.type} (${item.id}):`, {
            display: item.display,
            src: (item as any).details?.src,
            trim: (item as any).trim
          });
        });

        // Transform relative URLs to absolute URLs for Lambda access
        // WARNING: Lambda needs PUBLICLY accessible URLs - localhost won't work!
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        
        // Check if we're using localhost (Lambda can't access it)
        const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
        
        // Collect local file paths that need to be uploaded to S3
        const localFilePaths: string[] = [];
        validTrackItems.forEach((item) => {
          if (item.details && 'src' in item.details && item.details.src) {
            const src = item.details.src as string;
            if (src.startsWith('/api/uploads/file/')) {
              localFilePaths.push(src);
            }
          }
        });

        // Upload local files to S3 if we're on localhost
        let s3UrlMap: Record<string, string> = {};
        if (isLocalhost && localFilePaths.length > 0) {
          console.log('[Export] Uploading local files to S3...', localFilePaths);
          try {
            const uploadResponse = await fetch('/api/remotion/upload-media', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filePaths: localFilePaths })
            });

            if (!uploadResponse.ok) {
              throw new Error('Failed to upload media to S3');
            }

            const uploadData = await uploadResponse.json();
            s3UrlMap = uploadData.uploadedUrls || {};
            console.log('[Export] Files uploaded to S3:', s3UrlMap);
          } catch (error) {
            console.error('[Export] Failed to upload files to S3:', error);
            throw new Error('Cannot render: Failed to upload local files to S3');
          }
        }
        
        const transformedTrackItems = validTrackItems.map((item) => {
          if (!item.details) return item;

          // Transform video/audio/image sources
          if ('src' in item.details && item.details.src) {
            const src = item.details.src as string;
            
            // If we have an S3 URL for this file, use it
            if (s3UrlMap[src]) {
              return {
                ...item,
                details: {
                  ...item.details,
                  src: s3UrlMap[src]
                }
              };
            }
            
            // If it's already an absolute external URL, keep it as is
            if (src.startsWith('http://') || src.startsWith('https://')) {
              return item;
            }
            
            // If it's a relative URL and we're not on localhost, make it absolute
            if (src.startsWith('/') && !src.startsWith('//') && !isLocalhost) {
              return {
                ...item,
                details: {
                  ...item.details,
                  src: `${baseUrl}${src}`
                }
              };
            }
          }

          return item;
        });

        console.log("Transformed track items with absolute URLs");
        
        // Log transformed URLs for debugging
        console.log('[Export] Transformed track items:');
        transformedTrackItems.forEach((item, index) => {
          if ('src' in (item.details || {})) {
            console.log(`  ${index + 1}. ${item.type}:`, (item.details as any).src);
          }
        });

        // Calculate video duration from track items
        const maxDuration = transformedTrackItems.reduce((max, item) => {
          const itemEnd = item.display?.to || 0;
          return Math.max(max, itemEnd);
        }, 0);

        const durationInSeconds = maxDuration / 1000;
        
        console.log('[Export] Render settings:', {
          trackItemCount: transformedTrackItems.length,
          durationInSeconds,
          videoWidth: payload.size?.width || 1080,
          videoHeight: payload.size?.height || 1920,
          background: payload.background
        });

        // Show progress message (setting up infrastructure can take time on first export)
        set({ progress: 1 });

        // Step 1: POST request to start rendering with Remotion Lambda
        console.log('[Export] Setting up Remotion infrastructure...');
        const response = await fetch(`/api/remotion/render`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            trackItems: transformedTrackItems,
            background: payload.background || {
              type: "color",
              value: "transparent"
            },
            videoWidth: payload.size?.width || 1080,
            videoHeight: payload.size?.height || 1920,
            fps: 30,
            durationInSeconds,
            codec: "h264",
            imageFormat: "jpeg",
            maxRetries: 1,
            framesPerLambda: 20,
            privacy: "public",
            siteName: "video-editor-site"
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Render API error:", errorData);
          throw new Error(errorData.message || "Failed to submit export request.");
        }

        const jobInfo = await response.json();
        console.log("Render started:", jobInfo);
        
        const { renderId, bucketName, functionName } = jobInfo;

        if (!renderId || !bucketName || !functionName) {
          throw new Error("Invalid response from render API");
        }

        // Step 2 & 3: Polling for status updates
        const checkStatus = async () => {
          try {
            const statusResponse = await fetch(
              `/api/remotion/render?renderId=${renderId}&bucketName=${encodeURIComponent(bucketName)}&functionName=${encodeURIComponent(functionName)}`,
              {
                headers: {
                  "Content-Type": "application/json"
                }
              }
            );

            if (!statusResponse.ok) {
              const errorData = await statusResponse.json().catch(() => ({}));
              console.error("Status check failed:", {
                status: statusResponse.status,
                statusText: statusResponse.statusText,
                error: errorData
              });
              throw new Error(errorData.message || "Failed to fetch export status.");
            }

            const statusInfo = await statusResponse.json();
            console.log("Render status:", statusInfo);

            const { status, progress, outputUrl, errors, fatalErrorEncountered } = statusInfo;

            // Update progress (0-1 to 0-100)
            const progressPercent = Math.round((progress || 0) * 100);
            console.log(`Render progress: ${progressPercent}%`);
            set({ progress: progressPercent });

            if (status === "COMPLETED" && outputUrl) {
              console.log("Render completed:", outputUrl);
              set({ 
                exporting: false, 
                output: { url: outputUrl, type: "mp4" },
                progress: 100
              });
            } else if (status === "FAILED" || fatalErrorEncountered) {
              console.error("Render failed on Lambda");
              console.error("Lambda errors:", errors);
              
              // Get detailed error message
              let errorMessage = "Render failed on Lambda";
              if (errors && errors.length > 0) {
                const errorDetails = errors.map(e => e.message || e.stack || JSON.stringify(e)).join("\n");
                errorMessage = `Render failed:\n${errorDetails}`;
                console.error("Detailed error:", errorDetails);
              }
              
              throw new Error(errorMessage);
            } else if (status === "PROCESSING" || status === "PENDING") {
              // Continue polling
              setTimeout(checkStatus, 2500);
            } else {
              console.warn("Unknown render status:", status);
              // Continue polling anyway
              setTimeout(checkStatus, 2500);
            }
          } catch (error) {
            console.error("Status check error:", error);
            set({ exporting: false, progress: 0 });
            alert(error instanceof Error ? error.message : "Failed to check render status. Check console for details.");
          }
        };

        // Start polling
        checkStatus();
      } catch (error) {
        console.error("Export error:", error);
        set({ exporting: false, progress: 0 });
        // Show error to user
        alert(error instanceof Error ? error.message : "Export failed. Please try again.");
      }
    }
  }
}));
