/**
 * Compresses an image file to minimize storage size
 * Converts to WebP format with optimized quality settings
 */
export async function compressImage(file: File, maxWidth: number = 800, quality: number = 0.75): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        // Draw image with better quality settings
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to Blob with WebP format and compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"))
              return
            }

            // Create a new File object with compressed data
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
              type: "image/webp",
              lastModified: Date.now(),
            })

            resolve(compressedFile)
          },
          "image/webp",
          quality
        )
      }

      img.onerror = () => {
        reject(new Error("Failed to load image"))
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Gets estimated file size in KB
 */
export function getFileSizeKB(file: File): number {
  return Math.round(file.size / 1024)
}

