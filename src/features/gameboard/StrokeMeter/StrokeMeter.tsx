import { type FunctionComponent } from 'react'
import { EStroke } from '../types'
import './StrokeMeter.css'

interface IStrokeMeterProps {
  pace: number
  stroke: EStroke
  cumming: boolean
}

export const StrokeMeter: FunctionComponent<IStrokeMeterProps> = (props) => {
  const getCircleStateClass = (stroke: IStrokeMeterProps['stroke']): string => {
    switch (stroke) {
      case EStroke.up:
        return 'StrokeMeter__circle--up'
      case EStroke.down:
        return 'StrokeMeter__circle--down'
    }
  }

  const getCirclePaceClass = (pace: IStrokeMeterProps['pace']): string => {
    if (pace >= 5) return 'StrokeMeter__circle--fast'
    if (pace >= 3 && pace < 5) return 'StrokeMeter__circle--medium'
    if (pace < 3 && pace > 0) return 'StrokeMeter__circle--slow'

    return 'StrokeMeter__circle--stop'
  }

  const getCircleCummingClass = (cumming: IStrokeMeterProps['cumming']): string => {
    if (cumming) return 'StrokeMeter__circle--cumming'
    else return ''
  }

  return (
    <div className="StrokeMeter">
      <div
        className={`StrokeMeter__circle ${getCircleStateClass(props.stroke)} ${getCirclePaceClass(props.pace)} ${getCircleCummingClass(
          props.cumming,
        )}`}
      />
    </div>
  )
}
