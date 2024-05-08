import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
  useTransitionStyles,
} from '@floating-ui/react';
import { faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled, { CSSProperties } from 'styled-components';
import { IconButton } from './IconButton';
import { useEffect } from 'react';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVisibleChange?: (visible: boolean) => void;
  closable?: boolean;
  dismissable?: boolean;
  barrierColor?: CSSProperties['backgroundColor'];
  background?: CSSProperties['backgroundColor'];
  title?: React.ReactNode;
  content: React.ReactNode;
}

const StyledDialog = styled.div``;

const StyledDialogChildren = styled.div``;

const StyledDialogContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  height: 100%;
  width: 100%;

  padding: 16px;
`;

const StyledDialogContentWrapper = styled.div`
  display: flex;
  flex-direction: column;

  max-height: 100%;
  max-width: 100%;

  background: var(--section-background);
  color: var(--section-text);
  border-radius: var(--border-radius);

  padding: 8px;
`;

const StyledDialogTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 8px;
`;

export const Dialog = ({
  open,
  onOpenChange,
  onVisibleChange,
  content,
  title,
  closable = true,
  dismissable = false,
  barrierColor = 'var(--overlay-color)',
  background = 'var(--section-background)',
  children,
}: React.PropsWithChildren<DialogProps>) => {
  const { refs, context } = useFloating({
    open: open,
    onOpenChange: onOpenChange,
  });

  const { isMounted, styles } = useTransitionStyles(context);

  const click = useClick(context);
  const dismiss = useDismiss(context, {
    outsidePressEvent: 'mousedown',
  });
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  useEffect(() => {
    onVisibleChange?.(isMounted);
  }, [isMounted, onVisibleChange]);

  return (
    <StyledDialog>
      <StyledDialogChildren ref={refs.setReference} {...getReferenceProps()}>
        {children}
      </StyledDialogChildren>
      {isMounted && (
        <FloatingPortal>
          <FloatingOverlay
            lockScroll
            style={{
              background: barrierColor,
              ...styles,
              zIndex: 1000,
            }}
            onClick={() => dismissable && onOpenChange(false)}
          >
            <FloatingFocusManager context={context}>
              <StyledDialogContent
                ref={refs.setFloating}
                {...getFloatingProps()}
              >
                <StyledDialogContentWrapper
                  onClick={event => event.stopPropagation()}
                  style={{
                    background: background,
                  }}
                >
                  {(title || closable) && (
                    <StyledDialogTitle>
                      {title || <div />}
                      {closable && (
                        <IconButton
                          onClick={() => onOpenChange(false)}
                          icon={<FontAwesomeIcon icon={faClose} />}
                        />
                      )}
                    </StyledDialogTitle>
                  )}
                  {content}
                </StyledDialogContentWrapper>
              </StyledDialogContent>
            </FloatingFocusManager>
          </FloatingOverlay>
        </FloatingPortal>
      )}
    </StyledDialog>
  );
};
