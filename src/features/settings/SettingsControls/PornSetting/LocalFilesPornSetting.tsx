import type { FunctionComponent } from 'react';
import { useCallback, useState } from 'react';
import { PornService, PornType, type PornList } from '../../../gameboard/types';
import { type IPornSettingProps } from './PornSetting';
import '../settings.css';
import './PornSetting.css';

interface ILocalFilesPornSettingProps extends IPornSettingProps {}

export const LocalFilesPornSetting: FunctionComponent<ILocalFilesPornSettingProps> = (props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);

  const updateFiles = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFiles(event.target.files)
    },
    [setFiles],
  )

  const addFiles = useCallback(async (cumTo: boolean) => {
    if (!files || isLoading) {
      return;
    }

    setIsLoading(true);

    const pornItems: PornList = [];
    for (const file of Array.from(files)) {
      let imageUrl = "" ;
      let videoUrl = "";

      if (file.type.startsWith("video")) {
        videoUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsArrayBuffer(file);
          reader.onerror = reject;
          reader.onload = function(e) {
            // The file reader gives us an ArrayBuffer:
            const buffer = e.target!.result;

            // We have to convert the buffer to a blob:
            const videoBlob = new Blob([new Uint8Array(buffer as ArrayBuffer)], { type: file.type });

            // The blob gives us a URL to the video file:
            resolve(URL.createObjectURL(videoBlob));
          }
        })
      } else {
        imageUrl = URL.createObjectURL(file);
      }

      pornItems.push({
        previewUrl: file.type.startsWith("video") ? "" : imageUrl,
        hoverPreviewUrl: file.type.startsWith("video") ? videoUrl : imageUrl,
        mainUrl: file.type.startsWith("video") ? videoUrl : imageUrl,
        highResUrl: file.type.startsWith("video") ? videoUrl : imageUrl,
        type: file.type.startsWith("video") ? PornType.VIDEO : (file.type === "image/gif" ? PornType.GIF : PornType.IMAGE),
        source: "",
        service: PornService.LOCAL,
        uniqueId: file.name,
      })
    }

    const pornList = cumTo ? props.pornToCumTo : props.porn;
    const newPornList = [...pornList, ...pornItems];

    if (cumTo) {
      props.setPornToCumTo(newPornList);
    } else {
      props.setPorn(newPornList);
    }
    setIsLoading(false);
  }, [files, isLoading, props]);

  return (
    <div className="settings-row">
      <div className="settings-innerrow">
        <em>
          Local files are not saved in between page reloads or through the Save/Load feature due to browsers limited access to the file system.<br/><br/>Using large files may cause performance issues or browser crashes.
        </em>
        <label>
          <span>Select files</span>
          <input type="file" multiple={true} onChange={updateFiles} />
        </label>
        <br/>
        <em>
          Adding local files may take some time to process, please be patient.
        </em>
        <button disabled={isLoading} onClick={() => addFiles(false)}>{isLoading ? <i>⌛</i> : "Add files"}</button>
        <button disabled={isLoading} onClick={() => addFiles(true)}>{isLoading ? <i>⌛</i> : "Add files (For Cumming)"}</button>
      </div>
    </div>
  )
}
