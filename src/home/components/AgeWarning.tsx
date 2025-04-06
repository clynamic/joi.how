import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useHomeValue } from '../HomeProvider';

export const AgeWarning = () => {
  const [ageCheckConfirm, setAgeCheckConfirm] = useHomeValue('ageCheckConfirm');

  return (
    <Dialog
      open={!ageCheckConfirm}
      onClose={() => {}}
      sx={{
        '& .MuiBackdrop-root': {
          backdropFilter: 'blur(20px)',
        },
      }}
    >
      <DialogTitle>Age Warning</DialogTitle>
      <DialogContent>
        <Box sx={{ fontSize: '1rem', maxWidth: 400, margin: '0 auto' }}>
          <Typography>
            This app is meant for adults only, and should not be used by anyone
            under the age of 18.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1,
              marginTop: 2,
            }}
          >
            <Button
              variant='contained'
              color='error'
              startIcon={<BlockIcon />}
              onClick={() => {
                window.location.href = 'https://www.google.com';
              }}
            >
              I am not 18
            </Button>
            <Button
              variant='contained'
              color='primary'
              startIcon={<CheckCircleIcon />}
              onClick={() => setAgeCheckConfirm(true)}
            >
              I am 18 or older
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
