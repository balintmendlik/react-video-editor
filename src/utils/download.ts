export const download = (url: string, filename: string) => {
  try {
    console.log('Downloading from URL:', url);
    
    // Create a temporary link element and click it
    // This works for presigned S3 URLs and avoids CORS issues
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    link.setAttribute("target", "_blank");
    link.style.display = "none";
    
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
    
    console.log('Download initiated successfully');
  } catch (error) {
    console.error("Download error:", error);
    
    // Fallback: just open in new tab
    console.log('Fallback: opening in new tab');
    window.open(url, '_blank');
  }
};
