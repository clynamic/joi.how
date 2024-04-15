import { PornService, PornType, type PornList } from '../../../gameboard/types'
import { type IPornSettingProps } from './PornSetting'
import type { FunctionComponent } from 'react'
import { useCallback, useState } from 'react'
import './PornSetting.css'
import '../settings.css'

interface ILocalFilesPornSettingProps extends IPornSettingProps {}

export const LocalFilesPornSetting: FunctionComponent<ILocalFilesPornSettingProps> = (props) => {
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<File[] | null>(null)

  const selectFiles = useCallback(async () => {
    try {
      const options: OpenFilePickerOptions = {
        types: [
          {
            description: 'Images and Videos',
            accept: {
              'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
              'video/*': ['.mp4', '.mov', '.avi'],
            },
          },
        ],
        multiple: true,
      }

      const files: File[] = []
      const handles = await window.showOpenFilePicker(options)

      for (const handle of handles) {
        if (handle.kind === 'file') {
          const file = await handle.getFile()
          if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            files.push(file)
          }
        }
      }

      setFiles(files)
    } catch (error) {
      console.error('Error picking the files:', error)
    }
  }, [])

  const selectFolder = useCallback(async () => {
    try {
      const directoryHandle = await window.showDirectoryPicker()
      const files: File[] = []

      const processDirectory = async (dirHandle: FileSystemDirectoryHandle) => {
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile()
            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
              files.push(file)
            }
          } else if (entry.kind === 'directory') {
            await processDirectory(entry)
          }
        }
      }

      await processDirectory(directoryHandle)
      setFiles(files)
    } catch (error) {
      console.error('Error picking the directory:', error)
    }
  }, [])

  const addFiles = useCallback(async () => {
    if (!files || isLoading) {
      return
    }

    setIsLoading(true)

    const pornItems: PornList = []
    for (const file of Array.from(files)) {
      let imageUrl = ''
      let videoUrl = ''

      if (file.type.startsWith('video')) {
        videoUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsArrayBuffer(file)
          reader.onerror = reject
          reader.onload = function (e) {
            const buffer = e.target!.result
            const videoBlob = new Blob([new Uint8Array(buffer as ArrayBuffer)], { type: file.type })
            resolve(URL.createObjectURL(videoBlob))
          }
        })
      } else {
        imageUrl = URL.createObjectURL(file)
      }

      pornItems.push({
        previewUrl: file.type.startsWith('video') ? '' : imageUrl,
        hoverPreviewUrl: file.type.startsWith('video') ? videoUrl : imageUrl,
        mainUrl: file.type.startsWith('video') ? videoUrl : imageUrl,
        highResUrl: file.type.startsWith('video') ? videoUrl : imageUrl,
        type: file.type.startsWith('video') ? PornType.VIDEO : file.type === 'image/gif' ? PornType.GIF : PornType.IMAGE,
        source: '',
        service: PornService.LOCAL,
        uniqueId: file.name,
      })
    }

    const newPornList = [...props.porn, ...pornItems]
    props.setPorn(newPornList)
    setFiles(null)
    setIsLoading(false)
  }, [files, isLoading, props])

  return (
    <div className="settings-row">
      <div className="settings-innerrow">
        <em>
          Local files are not saved in between page reloads or through the Save/Load feature due to browsers limited access to the file
          system.
          <br />
          <br />
          Using large files may cause performance issues or browser crashes.
        </em>
        <label>
          <span>Selection</span>
        </label>
        <button key={'selectFiles'} onClick={selectFiles}>
          Select Files
        </button>
        <button key={'selectFolder'} onClick={selectFolder}>
          Select Folder
        </button>
        <label>
          <span> {files ? files.length : 0} files selected</span>
        </label>
        <br />
        <br />
        <em>Adding local files may take some time to process, please be patient.</em>
        <button disabled={isLoading} onClick={addFiles}>
          {isLoading ? <i>⌛</i> : 'Add files'}
        </button>
      </div>
    </div>
  )
}
