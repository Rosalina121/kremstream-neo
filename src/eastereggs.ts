import { $ } from 'bun'
import { join } from 'path'

export async function playPipe() {
    const soundPath = join(process.cwd(), "src/sounds/pipe.mp3").toString()
    await $`cvlc --play-and-exit ${soundPath}`;
}
