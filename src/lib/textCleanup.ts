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

  // 2. Clean up LaTeX fractions (e.g., \frac{5}{20} -> 5/20) and run 3 times to handle nested fractions
  for (let i = 0; i < 3; i++) {
    cleaned = cleaned.replace(/\\frac\{([^\}]+)\}\{([^\}]+)\}/g, "$1/$2");
  }

  // 3. Clean up LaTeX blackboard bold sets (e.g., \mathbb{N} -> ℕ)
  cleaned = cleaned.replace(/\\mathbb\{N\}/g, "ℕ")
                   .replace(/\\mathbb\{Z\}/g, "ℤ")
                   .replace(/\\mathbb\{Q\}/g, "ℚ")
                   .replace(/\\mathbb\{R\}/g, "ℝ")
                   .replace(/\\mathbb\{C\}/g, "ℂ")
                   .replace(/\\mathbb\{P\}/g, "ℙ")
                   .replace(/\\mathbb\s+N\b/g, "ℕ")
                   .replace(/\\mathbb\s+Z\b/g, "ℤ")
                   .replace(/\\mathbb\s+Q\b/g, "ℚ")
                   .replace(/\\mathbb\s+R\b/g, "ℝ")
                   .replace(/\\mathbb\s+C\b/g, "ℂ")
                   .replace(/\\mathbb\s+P\b/g, "ℙ")
                   .replace(/\\mathbb\{([^\}]+)\}/g, "$1");

  // 4. Clean up common LaTeX mathematical and symbolic formatting to clean unicode equivalents
  cleaned = cleaned.replace(/\$\\rightarrow\$/g, "→")
                   .replace(/\\rightarrow\b/g, "→")
                   .replace(/\$\\to\$/g, "→")
                   .replace(/\\to\b/g, "→")
                   .replace(/\$\\Rightarrow\$/g, "⇒")
                   .replace(/\\Rightarrow\b/g, "⇒")
                   .replace(/\$\\leftarrow\$/g, "←")
                   .replace(/\\leftarrow\b/g, "←")
                   .replace(/\$\\Leftarrow\$/g, "⇐")
                   .replace(/\\Leftarrow\b/g, "⇐")
                   .replace(/\$\\leftrightarrow\$/g, "↔")
                   .replace(/\\leftrightarrow\b/g, "↔")
                   .replace(/\$\\Leftrightarrow\$/g, "⇔")
                   .replace(/\\Leftrightarrow\b/g, "⇔")
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
                   .replace(/\\mid\b/g, " | ")
                   .replace(/\\in\b/g, " ∈ ")
                   .replace(/\\notin\b/g, " ∉ ")
                   .replace(/\\subset\b/g, " ⊂ ")
                   .replace(/\\subseteq\b/g, " ⊆ ")
                   .replace(/\\cap\b/g, " ∩ ")
                   .replace(/\\cup\b/g, " ∪ ")
                   .replace(/\\emptyset\b/g, " ∅ ")
                   .replace(/\\infty\b/g, " ∞ ")
                   .replace(/\\pm\b/g, " ± ")
                   .replace(/\\mp\b/g, " ∓ ")
                   .replace(/\\div\b/g, " ÷ ")
                   .replace(/\\pi\b/g, "π")
                   .replace(/\\theta\b/g, "θ")
                   .replace(/\\alpha\b/g, "α")
                   .replace(/\\beta\b/g, "β")
                   .replace(/\\gamma\b/g, "γ")
                   .replace(/\\delta\b/g, "δ")
                   .replace(/\\lambda\b/g, "λ")
                   .replace(/\\sigma\b/g, "σ")
                   .replace(/\\omega\b/g, "ω")
                   .replace(/\\Delta\b/g, "Δ")
                   .replace(/\\\$/g, "$")
                   .replace(/\\%/g, "%");

  // Remove LaTeX \text{...} wrappers keeping only the text inside
  cleaned = cleaned.replace(/\\text\{([^\}]+)\}/g, "$1");

  // Clean LaTeX square root (e.g., \sqrt{25} -> √(25))
  cleaned = cleaned.replace(/\\sqrt\{([^\}]+)\}/g, "√($1)");

  // Clean simple variable math wrappings or double dollar math blocks (e.g. $x$ -> x, $100$ -> 100)
  cleaned = cleaned.replace(/\$\$([\s\S]*?)\$\$/g, "$1");
  cleaned = cleaned.replace(/\$([a-zA-Z0-9%\s,=<>+\-\*\/\\|_^]+)\$/g, "$1");

  // Strip raw markdown code-block tags at the start/end if they leak
  cleaned = cleaned.replace(/^```markdown\s*/gi, "")
                   .replace(/^```html\s*/gi, "")
                   .replace(/```$/gm, "");

  // 5. Fix the * (asterisks) issues:
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

