function toEffectiveUrl (url: string): string {
  if (typeof window === 'undefined' || !url) return url
  try {
    const u = new URL(url, window.location.origin)
    if (u.origin !== window.location.origin) {
      return `/api/uploads/url?u=${encodeURIComponent(url)}`
    }
  } catch {}
  return url
}

export const getBlobFromUrl = async (url: string) => {
  const effective = toEffectiveUrl(url)
  const response = await fetch(effective)
  if (!response.ok) throw new Error(`Failed to fetch blob: ${response.status}`)
  const blob = await response.blob()
  if (!blob || blob.size === 0) throw new Error('Fetched blob is empty')
  return blob
};

export const getFileFromUrl = async (url: string) => {
  const effective = toEffectiveUrl(url)
  const response = await fetch(effective)
  if (!response.ok) throw new Error(`Failed to fetch file: ${response.status}`)
  const blob = await response.blob()
  if (!blob || blob.size === 0) throw new Error('Fetched file blob is empty')
  const filename = url.split("/").pop() || "video.mp4"
  const file = new File([blob], filename)
  return file
};

export const fileToBlob = async (file: File) => {
  const blob = await new Response(file.stream()).blob();
  return blob;
};

export const blobToStream = async (blob: Blob) => {
  const file = new File([blob], "video.mp4");
  const stream = file.stream();
  return stream;
};

export const getStreamFromUrl = async (url: string) => {
  const effective = toEffectiveUrl(url)
  const response = await fetch(effective)
  if (!response.ok) throw new Error(`Failed to fetch stream: ${response.status}`)
  const blob = await response.blob()
  if (!blob || blob.size === 0) throw new Error('Fetched stream blob is empty')
  const file = new File([blob], "video.mp4")
  const stream = file.stream()
  return stream
};
