import { PropsWithChildren } from 'react';
import styled from 'styled-components';

const StyledTooltip = styled.div`
  position: relative;
  display: inline-block;

  & .tooltiptext {
    visibility: hidden;
    width: 120px;
    background-color: #000000b9;
    color: #fff;
    text-align: center;
    border-radius: 6px;
    padding: 5px 0;
    position: absolute;
    z-index: 1;
    bottom: 125%;
    left: 50%;
    margin-left: -60px;
    opacity: 0;
    transition: opacity 0.3s;
  }

  & .tooltiptext::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: black transparent transparent transparent;
  }

  &:hover .tooltiptext {
    visibility: visible;
    opacity: 1;
  }
`;

export interface TooltipProps extends PropsWithChildren {
  content: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content }) => {
  return (
    <StyledTooltip>
      {children}
      <span className='tooltiptext'>{content}</span>
    </StyledTooltip>
  );
};
