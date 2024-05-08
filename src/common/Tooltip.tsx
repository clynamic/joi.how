import {
  arrow,
  autoUpdate,
  flip,
  FloatingArrow,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useTransitionStyles,
} from '@floating-ui/react';
import { useRef, useState } from 'react';
import styled from 'styled-components';

export interface TooltipProps {
  children: React.ReactNode;
  content?: React.ReactNode;
}

const StyledTooltip = styled.div``;

const StyledTooltipChildren = styled.div``;

const StyledTooltipContent = styled.div`
  font-size: 0.8rem;
  background: var(--overlay-color);
  padding: 4px 6px;
  border-radius: var(--border-radius);
`;

export const Tooltip: React.FC<TooltipProps> = ({ children, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef(null);

  const { refs, floatingStyles, context } = useFloating({
    placement: 'top',
    strategy: 'fixed',
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(7),
      flip(),
      shift({
        padding: 8,
      }),
      arrow({
        element: arrowRef,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const { isMounted, styles } = useTransitionStyles(context);

  const hover = useHover(context, {
    delay: 400,
    move: false,
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
  ]);

  return (
    <StyledTooltip>
      <StyledTooltipChildren ref={refs.setReference} {...getReferenceProps()}>
        {children}
      </StyledTooltipChildren>
      {content && isMounted && (
        <StyledTooltipContent
          ref={refs.setFloating}
          {...getFloatingProps()}
          style={{
            ...floatingStyles,
            ...styles,
          }}
        >
          <FloatingArrow
            ref={arrowRef}
            context={context}
            fill='var(--overlay-color)'
          />
          {content}
        </StyledTooltipContent>
      )}
    </StyledTooltip>
  );
};
