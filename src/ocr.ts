import Tesseract from 'tesseract.js';

export async function extractTextFromImage(imagePath: string): Promise<string> {
    const { data: { text } } = await Tesseract.recognize(
        imagePath,
        'eng', // Language
        {
            logger: m => console.log(m), // Optional: progress logging
            
        }
    );
    return text;
}

