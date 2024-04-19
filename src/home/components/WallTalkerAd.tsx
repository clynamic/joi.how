import { Link } from 'react-router-dom';
import styled from 'styled-components';

const StyledWallTalkerAd = styled.div`
  padding: 10px 15px;
  background: linear-gradient(#ffb300, #916706);
  cursor: pointer;
  transition: all 0.2s ease-out;
  color: #583c0f;

  &:hover {
    transform: scale(1.05);
  }

  & a {
    color: inherit;
    text-decoration: none;
  }
`;

export const WallTalkerAd = () => {
  return (
    <StyledWallTalkerAd>
      <Link to='https://walltaker.joi.how'>
        <h2>Want to let other people set your wallpaper?</h2>
        <p>
          Checkout walltaker! It&apos;s a app made by gray and the other folks
          at PawCorp, the little horny-coding collective! It lets you up a link
          where people can set the wallpaper on you phone or PC to an e621 post,
          within your blacklist!
        </p>
      </Link>
    </StyledWallTalkerAd>
  );
};
