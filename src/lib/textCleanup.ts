/**
 * Utility to clean up text outputs from AI (Gemini).
 * - Converts <BR>, <br>, <BR/>, <br/> to actual newlines
 * - Normalizes and cleans up LaTeX/math notations (like $\rightarrow$, \le, etc.) into clean unicode characters
 * - Removes loose/unwanted '*' characters that clutter the text, while maintaining Markdown formatting
 * - Standardizes bullet points
 */
export function cleanAiOutputText(text: string): string {
  if (!text) return "";
  
  let cleaned = text;

  // 1. Convert <br> / <BR> and variants to actual newlines
  cleaned = cleaned.replace(/<br\s*\/?>/gi, "\n");

  // 2. Clean up common LaTeX mathematical and symbolic formatting to clean unicode equivalents
  cleaned = cleaned.replace(/\$\\rightarrow\$/g, "→")
                   .replace(/\\rightarrow/g, "→")
                   .replace(/\$\\to\$/g, "→")
                   .replace(/\\to\b/g, "→")
                   .replace(/\$\\Rightarrow\$/g, "⇒")
                   .replace(/\\Rightarrow/g, "⇒")
                   .replace(/\$\\leftarrow\$/g, "←")
                   .replace(/\\leftarrow/g, "←")
                   .replace(/\$\\Leftarrow\$/g, "⇐")
                   .replace(/\\Leftarrow/g, "⇐")
                   .replace(/\$\\leftrightarrow\$/g, "↔")
                   .replace(/\\leftrightarrow/g, "↔")
                   .replace(/\$\\Leftrightarrow\$/g, "⇔")
                   .replace(/\\Leftrightarrow/g, "⇔")
                   .replace(/\$\\le\$/g, "≤")
                   .replace(/\\le\b/g, "≤")
                   .replace(/\$\\leq\$/g, "≤")
                   .replace(/\\leq\b/g, "≤")
                   .replace(/\$\\ge\$/g, "≥")
                   .replace(/\\ge\b/g, "≥")
                   .replace(/\$\\geq\$/g, "≥")
                   .replace(/\\geq\b/g, "≥")
                   .replace(/\$\\neq\$/g, "≠")
                   .replace(/\\neq\b/g, "≠")
                   .replace(/\$\\approx\$/g, "≈")
                   .replace(/\\approx\b/g, "≈")
                   .replace(/\$\\times\$/g, "×")
                   .replace(/\\times\b/g, "×")
                   .replace(/\$\\cdot\$/g, "•")
                   .replace(/\\cdot\b/g, "•")
                   .replace(/\$\\dots\$/g, "...")
                   .replace(/\\dots\b/g, "...")
                   .replace(/\\\$/g, "$")
                   .replace(/\\%/g, "%");

  // Remove LaTeX \text{...} wrappers keeping only the text inside
  cleaned = cleaned.replace(/\\text\{([^\}]+)\}/g, "$1");

  // Clean simple variable math wrappings (e.g. $x$ -> x, $100$ -> 100)
  cleaned = cleaned.replace(/\$([a-zA-Z0-9%\s,=<>+\-\*\/]+)\$/g, "$1");

  // Strip raw markdown code-block tags at the start/end if they leak
  cleaned = cleaned.replace(/^```markdown\s*/gi, "")
                   .replace(/^```html\s*/gi, "")
                   .replace(/```$/gm, "");

  // 3. Fix the * (asterisks) issues:
  // Sometimes Gemini outputs lists like "* item" or "** item" or " * item".
  // Let's normalize stray spaces around bullet lists
  cleaned = cleaned.replace(/^\s*[•*]\s+/gm, "- ");

  // Also, sometimes Gemini uses single asterisks for emphasis, e.g. *texto*.
  // Or it produces lone asterisks due to syntax issues. Let's remove lone asterisks that aren't starting a bullet point or aren't part of a bold double asterisk block (**).
  cleaned = cleaned.replace(/\s\*\s/g, " ");

  // Sometimes there are double bold markers inside headings, like "### **Assunto**". Let's clean that up to be standard heading
  cleaned = cleaned.replace(/^#+\s*\*\*([^\*]+)\*\*/gm, (match, p1) => {
    const headingHashes = match.split("**")[0];
    return headingHashes + p1;
  });

  return cleaned;
}

/**
 * Strips all markdown asterisks (** or *) from a string to render as completely clean plain text.
 */
export function stripMarkdownAsterisks(text: string): string {
  if (!text) return "";
  let cleaned = text;

  // Convert <br> variants to actual newlines
  cleaned = cleaned.replace(/<br\s*\/?>/gi, "\n");

  // Pre-clean LaTeX notations first
  cleaned = cleanAiOutputText(cleaned);

  // Remove double asterisks (used for bolding) but keep the content
  cleaned = cleaned.replace(/\*\*([\s\S]*?)\*\*/g, "$1");

  // Remove single asterisks (used for italics/emphasis) but keep the content
  cleaned = cleaned.replace(/\*([\s\S]*?)\*/g, "$1");

  // Normalize list bullet indicators (e.g. "* item" -> "- item")
  cleaned = cleaned.replace(/^\s*\*\s+/gm, "- ");

  // Remove any remaining loose asterisks that might be left over
  cleaned = cleaned.replace(/\*/g, "");

  return cleaned;
}

/**
 * Strict preprocessing function to remove any '*' character from Gemini responses.
 */
export function strictPreprocessGeminiText(text: string): string {
  if (!text) return "";
  // Return the cleaned version of LaTeX and other AI output flaws
  return cleanAiOutputText(text);
}

/**
 * Recursively removes all '*' characters from any string fields in an object or array.
 */
export function preprocessGeminiResponse<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data === "string") {
    return strictPreprocessGeminiText(data) as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map(item => preprocessGeminiResponse(item)) as unknown as T;
  }
  if (typeof data === "object") {
    const cleanedObj: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        cleanedObj[key] = preprocessGeminiResponse(data[key]);
      }
    }
    return cleanedObj as T;
  }
  return data;
}

