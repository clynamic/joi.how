export const itemExtensions = [
  'gif',
  'bmp',
  'jpg',
  'jpeg',
  'webp',
  'png',
  'svg',
  'mp4',
  'webm',
];

export const videoExtensions = ['mp4', 'webm'];

export const discoverImageFiles = async (
  dir: FileSystemDirectoryHandle
): Promise<FileSystemFileHandle[]> => {
  const files: FileSystemFileHandle[] = [];
  const entries: (FileSystemFileHandle | FileSystemDirectoryHandle)[] = [];

  for await (const entry of dir.values()) {
    entries.push(entry);
  }

  const CHUNK_SIZE = 5;
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunk = entries.slice(i, i + CHUNK_SIZE);

    await Promise.all(
      chunk.map(async entry => {
        if (entry.kind === 'directory') {
          files.push(...(await discoverImageFiles(entry)));
        } else if (entry.kind === 'file') {
          const file = await entry.getFile();
          const extension = file.name.split('.').pop();

          if (extension && itemExtensions.includes(extension)) {
            files.push(entry);
          }
        }
      })
    );
  }

  return files;
};
