import React from 'react'
import { connect } from 'react-redux'
import { IState } from '../../../store'
import { PropsForConnectedComponent, EGrip } from '../types'
import { Icon } from '../../../helpers/Icon'

import './Stats.css'

interface IStatsProps extends PropsForConnectedComponent {
  grip: EGrip
  pace: number
  paceSettings: IState['settings']['pace'],
  isPaused: IState['game']['gamePaused']
}

export const Stats = connect(
  (state: IState) =>
    ({
      grip: state.game.grip,
      pace: state.game.pace,
      paceSettings: state.settings.pace,
      isPaused: state.game.gamePaused
    } as IStatsProps),
)(
  class extends React.Component<IStatsProps> {
    render() {
      return (
        <div className="Stats" role="complementary" aria-label="Current stats">
          <div className="Stats__speedContainer" tabIndex={0} aria-label={getSpeedStateLabel(this.props.paceSettings, this.props.pace)}>
            <Icon icon="Stopped" className={`Stats__speed ${getClassForSpeed('low', this.props.paceSettings, this.props.pace, this.props.isPaused)}`} />
            <Icon icon="Walk" className={`Stats__speed ${getClassForSpeed('medium', this.props.paceSettings, this.props.pace, this.props.isPaused)}`} />
            <Icon icon="Run" className={`Stats__speed ${getClassForSpeed('high', this.props.paceSettings, this.props.pace, this.props.isPaused)}`} />
            <div role="presentation">
              <strong>{this.props.isPaused ? 0 : this.props.pace}s</strong>/sec
            </div>
          </div>
          <div className="Stats__handContainer" tabIndex={0} aria-label={getHandStatLabel(this.props.grip, this.props.isPaused)}>
            <Icon icon="Left" className={`Stats__hand ${getClassForHand(EGrip.left, this.props.grip, this.props.isPaused)}`} />
            <Icon icon="Right" className={`Stats__hand ${getClassForHand(EGrip.right, this.props.grip, this.props.isPaused)}`} />
          </div>
        </div>
      )
    }
  },
)

function getClassForHand(side: EGrip, current: EGrip, isPaused: IStatsProps['isPaused']): string {
  const state =
    (side === current ||
    current === EGrip.both) &&
    !isPaused
    ? 'active' : 'inactive'
  return `Stats__hand--${state}`
}

function getClassForSpeed(range: 'low' | 'medium' | 'high', paceSettings: IStatsProps['paceSettings'], current: number, isPaused: IStatsProps['isPaused']): string {
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

function getHandStatLabel(grip: EGrip, isPaused: IStatsProps['isPaused']) {
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

function getSpeedStateLabel(paceSettings: IStatsProps['paceSettings'], current: number) {
  const ratio = (current - paceSettings.min) / (paceSettings.max - paceSettings.min)
  if (ratio < 0.33333) return `Slow pace of ${current} strokes per second`
  if (ratio >= 0.33333 && ratio < 0.66666) return `Normal pace of ${current} strokes per second`
  if (ratio >= 0.66666 && ratio <= 1) return `Fast pace of ${current} strokes per second`
}
