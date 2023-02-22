import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Icon } from '../../../helpers/Icon'

import './EmergencyStop.css'
import { playTone } from '../sound'
import { MessageType } from '../MessageArea/MessageTypes'
import { IState } from '../../../store'
import { wait, loop } from '../events/helpers'
import { AnyAction } from 'redux'
import { ThunkDispatch } from 'redux-thunk'
import { GameBoardActions } from '../store'

export function EmergencyStop() {
  const dispatch: ThunkDispatch<IState, any, AnyAction> = useDispatch()
  const intensity = useSelector<IState, IState['game']['intensity']>((state) => state.game.intensity)
  const isPaused = useSelector<IState, IState['game']['gamePaused']>((state) => state.game.gamePaused)

  const timeToCalmDown = useMemo(() => {
    return Math.ceil(Math.min(intensity * 500 + 10000, 90000) / 1000)
  }, [intensity])

  async function stop() {
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

    dispatch(GameBoardActions.SetPace(1))
    dispatch(GameBoardActions.DecIntensity(30))

    await wait(5000)

    await loop(timeToCalmDown, (i) => {
      dispatch(
        GameBoardActions.ShowMessage({
          type: MessageType.EventDescription,
          text: `${timeToCalmDown - i}...`,
        }),
      )
      return wait(1000)
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

    dispatch(GameBoardActions.SetPace(1))
    dispatch(GameBoardActions.DecIntensity(30))

    dispatch(GameBoardActions.ResumeEvents())
    dispatch(GameBoardActions.ResumeGame())
  }

  return (
    <div className="EmergencyStop">
      <button disabled={isPaused} onClick={stop} title="Press when too close to cumming to continue">
        Too Close
        <Icon icon="Right" />
      </button>
    </div>
  )
}
