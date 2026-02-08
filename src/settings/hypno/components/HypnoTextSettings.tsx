import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Fields, SettingsDescription, JoiToggleTile } from '../../../common';
import {
  GameHypnoType,
  GameHypnoDescriptions,
  GameHypnoLabels,
} from '../../../types';
import { useSetting, subsetting } from '../../SettingsProvider';
import {
  faCat,
  faCow,
  faDog,
  faOtter,
  faPowerOff,
  faGear,
} from '@fortawesome/free-solid-svg-icons';

export const HypnoTextSettings = () => {
  const [hypno, setHypno] = subsetting(useSetting('hypno'), 'textType');

  return (
    <Fields label={'Hypno Text'} role='radiogroup'>
      <SettingsDescription>Choose a hypno text set</SettingsDescription>
      {Object.keys(GameHypnoType).map(key => {
        const current = GameHypnoType[key as keyof typeof GameHypnoType];
        return (
          <JoiToggleTile
            key={current}
            value={hypno === current}
            onChange={() => setHypno(current)}
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
                  case GameHypnoType.custom:
                    return <FontAwesomeIcon icon={faGear} />;
                }
              })()}
            </span>
          </JoiToggleTile>
        );
      })}
    </Fields>
  );
};
