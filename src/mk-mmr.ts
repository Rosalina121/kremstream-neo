import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";

const MMR_FILE_PATH = join(process.cwd(), 'data', 'mmr.json');
const DEFAULT_MMR = 4600;

export interface MmrManager {
    saveMmr(mmr: number): Promise<void>;
    loadMmr(): Promise<number>;
    getMmrPath(): string;
}

class FileMmrManager implements MmrManager {
    async saveMmr(mmr: number): Promise<void> {
        await mkdir(join(process.cwd(), 'data'), { recursive: true });
        await writeFile(MMR_FILE_PATH, JSON.stringify({ mmr }), 'utf-8');
    }

    async loadMmr(): Promise<number> {
        try {
            const data = await readFile(MMR_FILE_PATH, 'utf-8');
            return JSON.parse(data).mmr;
        } catch {
            return DEFAULT_MMR;
        }
    }

    getMmrPath(): string {
        return MMR_FILE_PATH;
    }
}

// Export a singleton instance
export const mmrManager = new FileMmrManager();
