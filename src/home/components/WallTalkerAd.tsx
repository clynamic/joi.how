import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { ContentSection } from '../../common';

const StyledWallTalkerAd = styled(ContentSection)`
  background: linear-gradient(#ffb300, #916706);
  color: #583c0f;

  padding-right: 46px;
  padding-bottom: 16px;
  position: relative;

  cursor: pointer;
  transition: all 0.2s ease-out;

  overflow: hidden;

  & h2 {
    font-size: 1.1rem;
    margin: 3px 0 10px 0;
  }

  &:hover {
    transform: scale(1.05);
  }

  & a {
    text-decoration: none;
  }

  &::before {
    position: absolute;

    content: 'Walltalker ✨';
    color: var(--card-color);
    background-color: #000000b5;
    text-align: center;

    right: -20px;
    bottom: 120px;
    width: 200px;
    height: 20px;

    transform: translateY(50%) rotate(-45deg);
    transform-origin: top right;
  }
`;

export const WallTalkerAd = () => {
  return (
    <StyledWallTalkerAd>
      <Link to='https://walltaker.joi.how'>
        <h2>Want to let other people set your wallpaper?</h2>
        <p>
          Checkout walltaker! It&apos;s an app made by gray and the other folks
          at PawCorp, the little horny-coding collective! It lets you up a link
          where people can set the wallpaper on you phone or PC to an e621 post,
          within your blacklist!
        </p>
      </Link>
    </StyledWallTalkerAd>
  );
};
