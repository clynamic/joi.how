import {
  ImageGrid,
  SettingsDescription,
  SettingsTile,
  Space,
} from '../../common';
import { useImages } from '../../settings';

export const ImageSettings = () => {
  const [images] = useImages();

  return (
    <SettingsTile label='Images' style={{ gridColumn: '1 / -1' }}>
      <SettingsDescription>
        {`You have loaded ${images.length} images`}
      </SettingsDescription>
      <ImageGrid images={images} />
      <Space size='medium' />
    </SettingsTile>
  );
};
