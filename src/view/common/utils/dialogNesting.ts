export function nestedDialogProps(onClose: () => void) {
  return {
    onWaHide: (e: Event) => {
      if (
        e.target === e.currentTarget &&
        (e.currentTarget as HTMLElement)?.querySelector('wa-dialog[open]')
      )
        e.preventDefault();
    },
    onWaAfterHide: (e: Event) => {
      if (e.target !== e.currentTarget) return;
      onClose();
    },
  };
}
