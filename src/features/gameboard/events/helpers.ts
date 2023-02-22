export function wait(time: number) {
  return new Promise((res) => setTimeout(res, time))
}

export async function loop(times: number, callback: (i: number) => Promise<any>) {
  for (let i = 0; i <= times; i++) {
    await callback(i)
  }
  return true
}
