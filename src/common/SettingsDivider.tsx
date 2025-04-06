import { Divider } from '@mui/material';

export const SettingsDivider = () => {
  return (
    <Divider
      variant='middle'
      sx={{
        width: 24,
        margin: 1,
        marginLeft: 'auto',
        marginRight: 'auto',
        gridColumn: '1 / -1',
      }}
    />
  );
};
