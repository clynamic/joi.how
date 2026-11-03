import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Fields, SettingsDescription, JoiToggleTile } from '../../common';
import {
  GameHypnoType,
  GameHypnoDescriptions,
  GameHypnoLabels,
  hypnoKeys,
} from '../../../game/classic/hypno';
import { useKeys } from '../../bridge/hooks';
import {
  faCat,
  faCow,
  faDog,
  faOtter,
  faPowerOff,
} from '@fortawesome/free-solid-svg-icons';

export const HypnoSettings = () => {
  const [{ hypno }, set] = useKeys(hypnoKeys);

  return (
    <Fields label={'Hypno'} role='radiogroup'>
      <SettingsDescription>Choose a hypno text set</SettingsDescription>
      {Object.keys(GameHypnoType).map(key => {
        const current = GameHypnoType[key as keyof typeof GameHypnoType];
        return (
          <JoiToggleTile
            key={current}
            value={hypno === current}
            onChange={() => set('hypno', current)}
            type={'radio'}
          >
            <h6 className='subtitle'>{GameHypnoLabels[current]}</h6>
            <p className='caption'>{GameHypnoDescriptions[current]}</p>
            <span slot='trailing'>
              {(() => {
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
            </span>
          </JoiToggleTile>
        );
      })}
    </Fields>
  );
};
