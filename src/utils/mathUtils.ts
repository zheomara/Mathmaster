export function fixMathDelimiters(text: string): string {
  if (!text) return text;
  
  // Replace block math \[ ... \] with $$ ... $$
  let fixed = text.replace(/\\\[([\s\S]*?)\\\]/g, (match, p1) => '$$' + p1 + '$$');
  
  // Replace inline math \( ... \) with $ ... $
  fixed = fixed.replace(/\\\(([\s\S]*?)\\\)/g, (match, p1) => '$' + p1 + '$');
  
  return fixed;
}
