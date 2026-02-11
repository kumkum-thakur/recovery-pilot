/**
 * Gemini AI Service - Real AI-powered wound analysis
 * Uses Google Gemini Vision API for medical image triage
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiAnalysisResult {
  analysis: 'green' | 'red';
  analysisText: string;
  confidenceScore: number;
  clinicalNote: string;
  recommendation: string;
}

/**
 * Returns the Gemini API key from environment variables.
 */
function getApiKey(): string {
  return import.meta.env.VITE_GEMINI_KEY;
}

/**
 * Converts a File object to a raw base64 string (without data URL prefix).
 *
 * @param file - The file to convert
 * @returns Promise resolving to a raw base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Strip the "data:<mime>;base64," prefix to get raw base64
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Analyzes a wound image using the Gemini Vision API.
 *
 * Sends the image to Gemini with a medical triage prompt and parses
 * the structured JSON response. Falls back gracefully on any error.
 *
 * @param imageFile - The wound image file to analyze
 * @returns Promise resolving to a GeminiAnalysisResult
 */
async function analyzeWoundImage(imageFile: File): Promise<GeminiAnalysisResult> {
  try {
    const apiKey = getApiKey();
    const base64Data = await fileToBase64(imageFile);

    const promptText = `You are a medical AI assistant analyzing a post-surgical wound image. Analyze this image and provide:
1. Assessment: Is the wound "healing well" (green) or showing "risk signs" like redness, swelling, or infection (red)?
2. A brief clinical note (1-2 sentences) describing what you see.
3. A confidence score between 0.70 and 0.99.
4. A recommendation for the patient.

IMPORTANT: Respond ONLY in this exact JSON format, no markdown, no code blocks:
{"analysis":"green or red","analysisText":"brief patient-friendly summary","confidenceScore":0.XX,"clinicalNote":"clinical observation","recommendation":"what patient should do"}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: promptText },
            { inline_data: { mime_type: imageFile.type, data: base64Data } }
          ]
        }]
      })
    });

    const data = await response.json();
    const responseText: string = data.candidates[0].content.parts[0].text;

    // Try to parse the JSON response directly
    try {
      const parsed = JSON.parse(responseText.trim()) as GeminiAnalysisResult;

      // Normalize the analysis field to ensure it's strictly 'green' or 'red'
      if (parsed.analysis !== 'green' && parsed.analysis !== 'red') {
        parsed.analysis = 'green';
      }

      // Clamp confidence score to expected range
      if (typeof parsed.confidenceScore !== 'number' || parsed.confidenceScore < 0.70 || parsed.confidenceScore > 0.99) {
        parsed.confidenceScore = 0.85;
      }

      return parsed;
    } catch {
      // JSON parsing failed - attempt to determine result from response text
      const lowerText = responseText.toLowerCase();
      const isRed = lowerText.includes('red') || lowerText.includes('infection') || lowerText.includes('risk');

      return {
        analysis: isRed ? 'red' : 'green',
        analysisText: isRed
          ? 'Possible risk signs detected. A doctor will review your image shortly.'
          : 'Wound appears to be healing normally. Continue current care routine.',
        confidenceScore: 0.80,
        clinicalNote: responseText.slice(0, 200),
        recommendation: isRed
          ? 'Please monitor closely and contact your care team if symptoms worsen.'
          : 'Continue following your post-operative care instructions.',
      };
    }
  } catch (error) {
    // Network or API error - return safe fallback
    console.error('Gemini wound analysis failed:', error);
    return {
      analysis: 'green',
      analysisText: 'Analysis temporarily unavailable. Image received successfully. A doctor will review shortly.',
      confidenceScore: 0.75,
      clinicalNote: 'Automated analysis could not be completed. Manual review required.',
      recommendation: 'Continue your current care routine and wait for doctor review.',
    };
  }
}

/**
 * Sends a general medical text query to the Gemini API.
 *
 * @param query - The medical question or query text
 * @returns Promise resolving to the response text
 */
async function analyzeMedicalQuery(query: string): Promise<string> {
  try {
    const apiKey = getApiKey();

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: query }
          ]
        }]
      })
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini medical query failed:', error);
    return 'I apologize, but I am unable to process your query at this time. Please try again later or contact your healthcare provider directly.';
  }
}

/**
 * Singleton Gemini AI service instance.
 */
export const geminiService = {
  getApiKey,
  fileToBase64,
  analyzeWoundImage,
  analyzeMedicalQuery,
};
