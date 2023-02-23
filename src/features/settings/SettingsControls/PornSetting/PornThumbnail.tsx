import { type FunctionComponent } from 'react'
import styled from 'styled-components'

interface IPornThumbnailProps {
  image: string
  onDelete: (image: string) => void
}

const Thumbnail = styled.button<{ src: string; lowRes: boolean }>`
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

  ::after {
    ${(props) => (props.lowRes ? 'content: "🐴"' : 'content: "🦄"')}
  }

  ${(props) =>
    props.src != null &&
    `
    background-image: url(${props.src}) !important
  `}
`

const ThumbnailPreview = styled.img<{ src: string }>`
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

  ${(props: { src?: string }) =>
    props.src != null &&
    `
    background-image: url(${props.src})
  `}
`

export const PornThumbnail: FunctionComponent<IPornThumbnailProps> = ({ image, onDelete }) => {
  const imageIsLowRes = image.includes('/data/sample')
  const imageIsAnimated = image.includes('.gif')
  const previewURL = image.replace(/\/data\/(sample\/)?/, '/data/preview/').replace(/((\.png)|(\.bmp)|(.webp)|(.gif))/, '.jpg')
  const preload = new Image()
  preload.src = image

  return (
    <Thumbnail
      onClick={() => {
        onDelete(image)
      }}
      src={previewURL}
      lowRes={imageIsLowRes}
    >
      <ThumbnailPreview src={imageIsAnimated ? image : previewURL} />
    </Thumbnail>
  )
}
