import { debounce } from 'lodash'
import { useEffect, useRef } from 'react'
import reactGA from '../../../analytics'

type EventRefs<P> = {
  [key in keyof P]: (prop: P[key]) => void
}

export function useGA<P>(category: string, props: P, record: Array<keyof P>): void {
  const eventRefs = useRef(
    record.reduce<Partial<EventRefs<P>>>(
      (acc, key) => ({
        ...acc,
        [key]: debounce((prop) => {
          if (localStorage.getItem('allowCookies') !== 'true' || localStorage.getItem('allowCookies') !== null) return
          if (typeof prop === 'number') {
            reactGA.event({
              category,
              action: `Changed ${String(key)}`,
              value: prop,
            })
          } else if (typeof prop === 'object') {
            reactGA.event({
              category,
              action: `Changed ${String(key)} to ${String(prop)}`,
              label: JSON.stringify(prop),
            })
          } else {
            reactGA.event({
              category,
              action: `Changed ${String(key)} to ${String(prop)}`,
            })
          }
        }, 2000),
      }),
      {},
    ),
  )

  useEffect(() => {
    record.forEach((key) => {
      eventRefs.current[key]?.(props[key])
    })
  }, [props, record])
}
