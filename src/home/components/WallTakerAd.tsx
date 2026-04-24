import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { ContentSection } from '../../common';

const StyledWallTakerAd = styled(ContentSection)`
  background: linear-gradient(#ffb300, #916706);
  color: #583c0f;

  padding-right: 46px;
  padding-bottom: 16px;
  position: relative;

  cursor: pointer;
  transition: transform 0.2s;

  overflow: hidden;

  & h2 {
    font-size: 1.1rem;
    margin: 3px 0 10px 0;
  }

  &:hover {
    transform: scale(1.05);
  }

  @layer overrides {
    & a {
      text-decoration: none;
      color: inherit;
    }
  }
`;

const StyledWalltakerMascotBackground = styled.div`
  bottom: -50px;
  right: -40px;
  height: 180px;
  aspect-ratio: 1/1;
  position: absolute;
  background-image: url('https://walltaker.joi.how/assets/mascot/TaylorSFW-1f4700509acff90902c73b80246473840a4879dca17a0052e0d8a41b1e4556e2.png');
  background-repeat: no-repeat;
  background-size: contain;
  background-position: right bottom;
`;

export const WallTakerAd = () => {
  return (
    <StyledWallTakerAd>
      <StyledWalltakerMascotBackground />
      <Link to='https://walltaker.joi.how'>
        <h2>Want to let other people set your wallpaper?</h2>
        <p>
          Checkout walltaker! It&apos;s an app made by gray and the other folks
          at PawCorp, the little horny-coding collective! It lets you up a link
          where people can set the wallpaper on you phone or PC to an e621 post,
          within your blacklist!
        </p>
      </Link>
    </StyledWallTakerAd>
  );
};
