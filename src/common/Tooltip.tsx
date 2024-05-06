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
} from '@floating-ui/react';
import { useRef, useState } from 'react';
import styled from 'styled-components';

export interface TooltipProps {
  children: React.ReactNode;
  content?: React.ReactNode;
}

const StyledTooltip = styled.div``;

const StyledTooltipChildren = styled.div``;

const StyledTooltipContent = styled.div<{ $open: boolean }>`
  font-size: 0.8rem;
  background: var(--overlay-color);
  padding: 4px 6px;
  border-radius: var(--border-radius);

  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transition: opacity 0.2s;
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
      <StyledTooltipContent
        $open={isOpen && content != null}
        ref={refs.setFloating}
        {...getFloatingProps()}
        style={floatingStyles}
      >
        <FloatingArrow
          ref={arrowRef}
          context={context}
          fill='var(--overlay-color)'
        />
        {content}
      </StyledTooltipContent>
    </StyledTooltip>
  );
};
