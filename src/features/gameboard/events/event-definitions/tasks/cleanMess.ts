import { GameEvent, PlayerParts } from '../../../types'
import { GameBoardActions } from '../../../store'
import { MessageType } from '../../../MessageArea/MessageTypes'

export const cleanMess: GameEvent = () => {
  return async (state, dispatch) => {
    let msg
    switch (state.settings.player.parts) {
      case PlayerParts.Cock:
        msg = "pre you've leaked"
      case PlayerParts.Pussy:
        msg = "juices you've made"
      case PlayerParts.Neuter:
      default:
        msg = "mess you've made"
    }
    dispatch(GameBoardActions.PauseEvents())
    dispatch(GameBoardActions.PauseGame())
    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.Prompt,
        text: `Lick up any ${msg}`,
        buttons: [
          {
            display: `I'm done $master`,
            method: () => {
              dispatch(GameBoardActions.ResumeEvents())
              dispatch(GameBoardActions.ResumeGame())
              dispatch(
                GameBoardActions.ShowMessage({
                  type: MessageType.NewEvent,
                  text: 'Good $player.',
                }),
              )
            },
          },
        ],
      }),
    )
  }
}
