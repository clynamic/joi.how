import React from 'react'
import './StrokeMeter.css'
import { EStroke } from '../types'

interface IStrokeMeterProps {
  pace: number
  stroke: EStroke
  cumming: boolean
}

class StrokeMeter extends React.Component<IStrokeMeterProps> {
  getCircleStateClass(stroke: IStrokeMeterProps['stroke']): string {
    switch (stroke) {
      case EStroke.up:
        return 'StrokeMeter__circle--up'
      case EStroke.down:
        return 'StrokeMeter__circle--down'
    }
  }

  getCirclePaceClass(pace: IStrokeMeterProps['pace']): string {
    if (pace >= 5) return 'StrokeMeter__circle--fast'
    if (pace >= 3 && pace < 5) return 'StrokeMeter__circle--medium'
    if (pace < 3 && pace > 0) return 'StrokeMeter__circle--slow'
    return 'StrokeMeter__circle--stop'
  }

  getCircleCummingClass(cumming: IStrokeMeterProps['cumming']): string {
    if (cumming) return 'StrokeMeter__circle--cumming'
    else return ''
  }

  render() {
    return (
      <div className="StrokeMeter">
        <div
          className={`StrokeMeter__circle ${this.getCircleStateClass(this.props.stroke)} ${this.getCirclePaceClass(
            this.props.pace,
          )} ${this.getCircleCummingClass(this.props.cumming)}`}
        />
      </div>
    )
  }
}

export default StrokeMeter
