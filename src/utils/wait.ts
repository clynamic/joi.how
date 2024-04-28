export async function wait(time: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, time));
}
