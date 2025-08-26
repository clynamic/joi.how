import styled from 'styled-components';
import {
  Button,
  Fields,
  SettingsDescription,
  Space,
  VerticalDivider,
} from '../../common';
import { Settings, useSettings } from '../SettingsProvider';
import { ImageItem, ImageServiceType } from '../../types';
import { useImages } from '../ImageProvider';
import { ChangeEvent } from 'react';

interface TradeFormat {
  name: string;
  version: string;
  settings: Settings;
  images: ImageItem[];
}

const StyledTradeButtons = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 8px;
`;

export const TradeSettings = () => {
  const [settings, setSettings] = useSettings();
  const [images, setImages] = useImages();

  const onExport = () => {
    const tradeFormat: TradeFormat = {
      name: `Export from ${new Date().toLocaleString()}`,
      version: '1',
      settings: settings,
      // local images could be base64 encoded, but this would cause significant bloat
      images: images.filter(image => image.service === ImageServiceType.local),
    };
    const data = JSON.stringify(tradeFormat, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.how';
    a.click();
  };

  const onImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.how';
    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async e => {
        const data = e.target?.result;
        if (typeof data !== 'string') {
          return;
        }
        const tradeFormat = JSON.parse(data) as TradeFormat;
        setSettings(tradeFormat.settings);
        setImages(tradeFormat.images);
      };
      reader.readAsText(file);
    };
    input.addEventListener('change', e =>
      onChange(e as unknown as ChangeEvent<HTMLInputElement>)
    );
    input.click();
  };

  return (
    <Fields label={'Trade'}>
      <SettingsDescription>
        Export or import your settings and images
      </SettingsDescription>
      <StyledTradeButtons>
        <Button onClick={onExport}>Export</Button>
        <VerticalDivider />
        <Button onClick={onImport}>Import</Button>
      </StyledTradeButtons>
      <Space />
    </Fields>
  );
};
