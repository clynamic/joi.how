import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPersonDigging } from '@fortawesome/free-solid-svg-icons';

export const WalltakerSearch = () => {
  return (
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
  );
};
