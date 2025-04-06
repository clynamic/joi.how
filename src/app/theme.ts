import { createTheme } from '@mui/material/styles';

const themeConstants = {
  background: '#1c1b1f',
  textColor: '#fff',
  overlayBackground: '#1c1b1fb3',
  overlayColor: '#fff',
  primary: '#92678d',
  cardBackground: '#2e2f3b',
  cardColor: '#d3cedc',
  sectionBackground: '#7a7ba31f',
  buttonBackground: '#595a7766',
  buttonColor: '#fff',
  legendBackground: '#595a77',
};

declare module '@mui/material/styles' {
  interface PaletteOptions {
    const: typeof themeConstants;
  }
  interface Palette {
    const: typeof themeConstants;
  }
}

export const theme = createTheme({
  palette: {
    mode: 'dark',
    const: themeConstants,
    background: {
      default: themeConstants.background,
      paper: themeConstants.cardBackground,
    },
    primary: {
      main: themeConstants.primary,
    },
    secondary: {
      main: themeConstants.buttonBackground,
    },
    text: {
      primary: themeConstants.textColor,
      secondary: themeConstants.cardColor,
    },
  },
  typography: {
    fontFamily: ['Helvetica Neue', 'Helvetica', 'sans-serif'].join(','),
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: ({ theme }) => ({
          transition: 'background-color 0.2s',
          '&:hover': {
            backgroundColor: theme.palette.primary.main,
          },
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: ({ theme }) => ({
          backgroundColor: theme.palette.const.buttonBackground,
          '&:hover': {
            backgroundColor: theme.palette.primary.main,
          },
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.const.background,
        }),
        notchedOutline: ({ theme }) => ({
          borderColor: theme.palette.primary.main,
        }),
        input: ({ theme }) => ({
          padding: theme.spacing(0.5),
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: theme.palette.const.buttonBackground,
          },
        }),
      },
    },
    MuiSlider: {
      styleOverrides: {
        rail: ({ theme }) => ({
          opacity: 0.7,
          backgroundColor: theme.palette.const.background,
          height: 6,
        }),
        track: {
          height: 6,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.const.overlayBackground,
          color: theme.palette.const.overlayColor,
        }),
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }) => ({
          backgroundColor: theme.palette.const.overlayBackground,
          color: theme.palette.const.overlayColor,
        }),
        arrow: ({ theme }) => ({
          color: theme.palette.const.overlayBackground,
        }),
      },
    },
  },
});
