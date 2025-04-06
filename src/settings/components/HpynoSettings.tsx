import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Fields,
  SettingsDescription,
  ToggleCard,
  ToggleTileType,
} from '../../common';
import {
  GameHypnoType,
  GameHypnoDescriptions,
  GameHypnoLabels,
} from '../../types';
import { useSetting } from '../SettingsProvider';
import {
  faCat,
  faCow,
  faDog,
  faOtter,
  faPowerOff,
} from '@fortawesome/free-solid-svg-icons';
import { Typography } from '@mui/material';

export const HypnoSettings = () => {
  const [hypno, setHypno] = useSetting('hypno');

  return (
    <Fields label={'Hypno'} role='radiogroup'>
      <SettingsDescription>Choose a hypno text set</SettingsDescription>
      {Object.keys(GameHypnoType).map(key => {
        const current = GameHypnoType[key as keyof typeof GameHypnoType];
        return (
          <ToggleCard
            key={current}
            value={hypno === current}
            onClick={() => setHypno(current)}
            type={ToggleTileType.radio}
            trailing={(() => {
              switch (current) {
                case GameHypnoType.off:
                  return <FontAwesomeIcon icon={faPowerOff} />;
                case GameHypnoType.joi:
                  return <FontAwesomeIcon icon={faOtter} />;
                case GameHypnoType.breeding:
                  return <FontAwesomeIcon icon={faCow} />;
                case GameHypnoType.maledom:
                  return <FontAwesomeIcon icon={faDog} />;
                case GameHypnoType.femdom:
                  return <FontAwesomeIcon icon={faCat} />;
              }
            })()}
          >
            <Typography variant='subtitle2'>
              {GameHypnoLabels[current]}
            </Typography>
            <Typography variant='caption'>
              {GameHypnoDescriptions[current]}
            </Typography>
          </ToggleCard>
        );
      })}
    </Fields>
  );
};
