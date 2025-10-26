import { Player } from 'mkcentral-api';

export async function fetchMmr(playerId: number) {
    const player = await Player.Get(playerId);
    console.log(player);
}
