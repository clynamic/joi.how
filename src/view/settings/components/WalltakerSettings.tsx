import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Fields } from '../../common';
import { faPersonDigging } from '@fortawesome/free-solid-svg-icons';

export const WalltakerSettings = () => {
  return (
    <Fields label={'Walltalker'} style={{ opacity: 0.5 }}>
      <div
        style={{
          gridColumn: '1 / -1',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <h1>
          <FontAwesomeIcon icon={faPersonDigging} />
        </h1>
        <p>There is nothing here yet :3</p>
      </div>
    </Fields>
  );
};
