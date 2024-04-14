import { PornType, type PornItem } from '../../../gameboard/types'
import { useState, type FunctionComponent } from 'react'
import styled from 'styled-components'

interface IPornThumbnailProps {
  porn: PornItem
  onDelete: (porn: PornItem) => void
}

const Thumbnail = styled.button<{ src: string }>`
  position: relative;
  width: 30px !important;
  height: 30px !important;
  background-position: center !important;
  background-size: cover !important;
  cursor: pointer;
  padding: 0 !important;
  cursor: pointer;
  border: 0;

  :hover,
  :focus {
    transform: scale(1.4);
    z-index: 99999;
    box-shadow: 0 0 10px rgba(40, 50, 60, 0.75);
    z-index: 999;
  }

  ${(props) =>
    props.src != null &&
    `
    background-image: url(${props.src}) !important
  `}
`

const ThumbnailPreview = styled.img<{ src?: string }>`
  width: 100px;
  position: absolute;
  z-index: 999;
  top: 90%;
  left: 90%;
  display: none;
  box-shadow: 0 0 10px rgba(40, 50, 60, 0.75);
  border: 1px solid #fff;
  user-select: none;

  ${Thumbnail}:hover &,
  ${Thumbnail}:focus & {
    display: block;
  }

  ${(props: { src?: string }) => !!props.src && `background-image: url(${props.src})`}
`

const VideoPreview = styled.video`
  width: 100px;
  position: absolute;
  z-index: 999;
  top: 90%;
  left: 90%;
  display: none;
  box-shadow: 0 0 10px rgba(40, 50, 60, 0.75);
  border: 1px solid #fff;
  user-select: none;

  ${Thumbnail}:hover &,
  ${Thumbnail}:focus & {
    display: block;
  }
`

export const PornThumbnail: FunctionComponent<IPornThumbnailProps> = ({ porn, onDelete }) => {
  const preload = new Image()
  preload.src = porn.previewUrl

  const [isPreviewShowing, setIsPreviewShowing] = useState(false)
  return (
    <Thumbnail
      onClick={() => {
        onDelete(porn)
      }}
      src={porn.previewUrl}
      onMouseEnter={() => setIsPreviewShowing(true)}
      onMouseLeave={() => setIsPreviewShowing(false)}
    >
      {porn.type === PornType.VIDEO && isPreviewShowing && <VideoPreview src={porn.hoverPreviewUrl} autoPlay={true} loop={true} />}
      {porn.type !== PornType.VIDEO && <ThumbnailPreview src={porn.hoverPreviewUrl} />}
    </Thumbnail>
  )
}
