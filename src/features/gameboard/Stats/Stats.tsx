import { type FunctionComponent } from 'react'

import { Icon } from '../../../helpers/Icon'
import { type IState } from '../../../store'
import { EGrip } from '../types'

import { useSelector } from 'react-redux'
import './Stats.css'

export const Stats: FunctionComponent = () => {
  const grip = useSelector<IState, IState['game']['grip']>((state) => state.game.grip)
  const pace = useSelector<IState, IState['game']['pace']>((state) => state.game.pace)
  const paceSettings = useSelector<IState, IState['settings']['pace']>((state) => state.settings.pace)
  const isPaused = useSelector<IState, IState['game']['gamePaused']>((state) => state.game.gamePaused)

  return (
    <div className="Stats" role="complementary" aria-label="Current stats">
      <div className="Stats__speedContainer" tabIndex={0} aria-label={getSpeedStateLabel(paceSettings, pace)}>
        <Icon icon="Stopped" className={`Stats__speed ${getClassForSpeed('low', paceSettings, pace, isPaused)}`} />
        <Icon icon="Walk" className={`Stats__speed ${getClassForSpeed('medium', paceSettings, pace, isPaused)}`} />
        <Icon icon="Run" className={`Stats__speed ${getClassForSpeed('high', paceSettings, pace, isPaused)}`} />
        <div role="presentation">
          <strong>{isPaused ? 0 : pace}s</strong>/sec
        </div>
      </div>
      <div className="Stats__handContainer" tabIndex={0} aria-label={getHandStatLabel(grip, isPaused)}>
        <Icon icon="Left" className={`Stats__hand ${getClassForHand(EGrip.left, grip, isPaused)}`} />
        <Icon icon="Right" className={`Stats__hand ${getClassForHand(EGrip.right, grip, isPaused)}`} />
      </div>
    </div>
  )
}

function getClassForHand(side: EGrip, current: EGrip, isPaused: IState['game']['gamePaused']): string {
  const state = (side === current || current === EGrip.both) && !isPaused ? 'active' : 'inactive'

  return `Stats__hand--${state}`
}

function getClassForSpeed(
  range: 'low' | 'medium' | 'high',
  paceSettings: IState['settings']['pace'],
  current: number,
  isPaused: IState['game']['gamePaused'],
): string {
  if (isPaused) return 'Stats__speed--inactive'
  const ratio = (current - paceSettings.min) / (paceSettings.max - paceSettings.min)
  switch (range) {
    case 'low':
      return ratio < 0.33333 ? `Stats__speed--active` : `Stats__speed--inactive`
    case 'medium':
      return ratio >= 0.33333 && ratio < 0.66666 ? `Stats__speed--active` : `Stats__speed--inactive`
    case 'high':
      return ratio >= 0.66666 && ratio <= 1 ? `Stats__speed--active` : `Stats__speed--inactive`
  }
}

function getHandStatLabel(grip: EGrip, isPaused: IState['game']['gamePaused']): string {
  if (isPaused) return "Hand's off entirely!"
  switch (grip) {
    case EGrip.none:
      return "Hand's off entirely!"
    case EGrip.left:
      return 'Left hand only'
    case EGrip.right:
      return 'Right hand only'
    case EGrip.both:
      return 'Both hands'
  }
}

function getSpeedStateLabel(paceSettings: IState['settings']['pace'], current: number): string | undefined {
  const ratio = (current - paceSettings.min) / (paceSettings.max - paceSettings.min)
  if (ratio < 0.33333) return `Slow pace of ${current} strokes per second`
  if (ratio >= 0.33333 && ratio < 0.66666) return `Normal pace of ${current} strokes per second`
  if (ratio >= 0.66666 && ratio <= 1) return `Fast pace of ${current} strokes per second`
}
