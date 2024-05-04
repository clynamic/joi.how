import { SettingsDescription, SettingsTile } from '../../common';
import { E621Search } from '../../e621';

export const ServiceSettings = () => {
  return (
    <SettingsTile label={'e621'}>
      <SettingsDescription>Add images from e621</SettingsDescription>
      <E621Search />
    </SettingsTile>
  );
};
