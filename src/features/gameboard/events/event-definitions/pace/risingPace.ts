import { GameEvent } from '../../../types'
import { GameBoardActions } from '../../../store'
import { MessageType } from '../../../MessageArea/MessageTypes'
import { round } from '../../../../../helpers/round'
import { intensityToPaceBounds } from '../../../../../helpers/intensity'
import { wait } from '../../helpers'

export const risingPace: GameEvent<[number]> = (acceleration: number) => {
  return async (state, dispatch) => {
    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.NewEvent,
        text: `Rising pace strokes!`,
      }),
    )

    const bounds = intensityToPaceBounds(state.game.intensity, state.settings.steepness, state.settings.pace)
    const portion = round((bounds.max - state.settings.pace.min) / acceleration)
    let currentPace = state.settings.pace.min
    for (let i = 0; i < acceleration; i++) {
      await wait(10000)
      dispatch(
        GameBoardActions.ShowMessage({
          type: MessageType.EventDescription,
          text: `Pace set to ${round(currentPace)}`,
        }),
      )
      dispatch(GameBoardActions.SetVibration(round(currentPace) / state.settings.pace.max))
      dispatch(GameBoardActions.SetPace(round(currentPace)))
      currentPace += portion
    }
    await wait(10000)
    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.NewEvent,
        text: `Stay at this pace for a bit`,
      }),
    )
    await wait(15000)
  }
}
