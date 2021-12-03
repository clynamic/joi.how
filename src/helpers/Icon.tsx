import React from 'react'

import { ReactComponent as LeftIcon } from '../assets/icons/Left.svg'
import { ReactComponent as RightIcon } from '../assets/icons/Right.svg'
import { ReactComponent as RunIcon } from '../assets/icons/Run.svg'
import { ReactComponent as WalkIcon } from '../assets/icons/Walk.svg'
import { ReactComponent as StoppedIcon } from '../assets/icons/Stopped.svg'
import { ReactComponent as SettingsIcon } from '../assets/icons/Settings.svg'

interface IIconProps {
  icon: 'Left' | 'Right' | 'Run' | 'Walk' | 'Stopped' | 'Settings'
  className?: string
}

export const Icon: React.FC<IIconProps> = props => {
  if (props.icon === 'Left') return <LeftIcon className={props.className} />
  if (props.icon === 'Right') return <RightIcon className={props.className} />
  if (props.icon === 'Run') return <RunIcon className={props.className} />
  if (props.icon === 'Walk') return <WalkIcon className={props.className} />
  if (props.icon === 'Stopped') return <StoppedIcon className={props.className} />
  if (props.icon === 'Settings') return <SettingsIcon className={props.className} />
  return <></>
}
