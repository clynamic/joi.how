export async function wait(time: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, time))
}

export async function loop(times: number, callback: (i: number) => Promise<unknown>): Promise<boolean> {
  for (let i = 0; i <= times; i++) {
    await callback(i)
  }

  return true
}
