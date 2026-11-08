import { ReactiveElement } from 'lit';
ReactiveElement.disableWarning?.('change-in-update');

import '@awesome.me/webawesome/dist/styles/webawesome.css';
import './index.css';
import { HOME_TAG } from './game/home/page';
import { PLAY_TAG } from './game/classic/play';
import { SUMMARY_TAG } from './game/classic/summary';
import { startLoop } from './view/loop';
import { startRouter } from './view/router';
import { startStage } from './view/stage';
import { registerServiceWorker } from './view/serviceWorker';

registerServiceWorker();
startLoop();
startRouter();

startStage(document.getElementById('root')!, {
  boot: HOME_TAG,
  home: HOME_TAG,
  game: PLAY_TAG,
  end: SUMMARY_TAG,
});
