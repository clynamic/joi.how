import { GameEvent } from '../../../types'
import { GameBoardActions } from '../../../store'
import { MessageType } from '../../../MessageArea/MessageTypes'

export const lickPre: GameEvent = () => {
  return async (state, dispatch) => {
    dispatch(GameBoardActions.PauseEvents())
    dispatch(GameBoardActions.PauseGame())
    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.Prompt,
        text: `Lick up any pre you've leaked`,
        buttons: [
          {
            display: `I'm done`,
            method: () => {
              dispatch(GameBoardActions.ResumeEvents())
              dispatch(GameBoardActions.ResumeGame())
              dispatch(
                GameBoardActions.ShowMessage({
                  type: MessageType.NewEvent,
                  text: 'Good boy.',
                }),
              )
            },
          },
        ],
      }),
    )
  }
}
