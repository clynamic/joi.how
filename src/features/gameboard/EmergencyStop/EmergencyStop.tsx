import { useMemo, type FunctionComponent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Icon } from '../../../helpers/Icon'

import { type AnyAction } from 'redux'
import { type ThunkDispatch } from 'redux-thunk'
import { loop, wait } from '../../../helpers/helpers'
import { type IState } from '../../../store'
import { MessageType } from '../MessageArea/MessageTypes'
import { playTone } from '../sound'
import { GameBoardActions } from '../store'
import './EmergencyStop.css'

export const EmergencyStop: FunctionComponent = () => {
  const dispatch: ThunkDispatch<IState, unknown, AnyAction> = useDispatch()
  const intensity = useSelector<IState, IState['game']['intensity']>((state) => state.game.intensity)
  const isPaused = useSelector<IState, IState['game']['gamePaused']>((state) => state.game.gamePaused)

  const timeToCalmDown = useMemo(() => {
    return Math.ceil(Math.min(intensity * 500 + 10000, 90000) / 1000)
  }, [intensity])

  async function stop(): Promise<void> {
    dispatch(GameBoardActions.PauseEvents())
    dispatch(GameBoardActions.PauseGame())
    playTone(400)
    await wait(100)
    playTone(300)
    await wait(100)
    playTone(250)
    await wait(100)
    playTone(200)
    await wait(100)
    playTone(200)

    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.NewEvent,
        text: 'Calm down with your hands off.',
      }),
    )

    void dispatch(GameBoardActions.SetPace(1))
    void dispatch(GameBoardActions.DecIntensity(30))

    await wait(5000)

    await loop(timeToCalmDown, async (i) => {
      dispatch(
        GameBoardActions.ShowMessage({
          type: MessageType.EventDescription,
          text: `${timeToCalmDown - i}...`,
        }),
      )
      await wait(1000)
    })

    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.NewEvent,
        text: 'Get your hand back on your shaft.',
      }),
    )

    await wait(2000)

    playTone(200)
    await wait(100)
    playTone(300)
    await wait(100)
    playTone(350)
    await wait(100)
    playTone(400)
    await wait(100)
    playTone(400)

    void dispatch(GameBoardActions.SetPace(1))
    void dispatch(GameBoardActions.DecIntensity(30))

    dispatch(GameBoardActions.ResumeEvents())
    dispatch(GameBoardActions.ResumeGame())
  }

  return (
    <div className="EmergencyStop">
      <button
        disabled={isPaused}
        onClick={() => {
          void stop()
        }}
        title="Press when too close to cumming to continue"
      >
        Too Close
        <Icon icon="Right" />
      </button>
    </div>
  )
}
