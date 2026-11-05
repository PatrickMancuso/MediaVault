
import { useEffect, useState } from 'react'

interface CollageArtworkProps {
  src?: string | null
  title: string
  className: string
}

function CollageArtwork({
  src,
  title,
  className,
}: CollageArtworkProps) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!src || failed) {
    return (
      <div className={`${className} collage-art-fallback`}>
        <span>{title}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt=""
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

export default CollageArtwork
