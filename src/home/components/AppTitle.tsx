import styled from 'styled-components';
import { ContentSection } from '../../common';

const StyledTitle = styled(ContentSection)`
  background: transparent;
  color: var(--text-color);

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;

  & h1 {
    font-size: 3rem;
    margin-bottom: 32px;
  }

  & img {
    padding: 40px 0 30px 0;
    width: 200px;
    aspect-ratio: 1;
  }

  & abbr {
    text-decoration: none;
    background: rgba(70, 87, 105, 0.4);
    padding: 5px 20px;
    margin: 0 10px;
  }
`;

export const HomeTitle = () => {
  return (
    <StyledTitle>
      <img src={'/logo.svg'} alt='JOI.how' />
      <h1>
        <abbr title='Jack Off Instructions'>JOI</abbr>
        <sup>.how</sup>
      </h1>
    </StyledTitle>
  );
};
