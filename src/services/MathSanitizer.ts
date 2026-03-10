export class MathSanitizer {
  static clean(input: string): string {
    let sanitized = input;

    // 1. Common Substitutions
    sanitized = sanitized.replace(/[lI|]/g, '1');
    sanitized = sanitized.replace(/[Oo]/g, '0');
    
    // Replace S, s with 5 (if not part of a word like "sin")
    sanitized = sanitized.replace(/(?<![a-zA-Z])[Ss](?![a-zA-Z])/g, '5');
    
    sanitized = sanitized.replace(/[Zz]/g, '2');
    sanitized = sanitized.replace(/[gq]/g, '9');
    sanitized = sanitized.replace(/B/g, '8');

    // 2. Operator Cleaning
    if (sanitized.includes('=')) {
      sanitized = sanitized.replace(/X/g, 'x');
    } else {
      const hasOtherLetters = /[a-wyzA-WYZ]/.test(sanitized);
      if (!hasOtherLetters) {
        sanitized = sanitized.replace(/[xX]/g, '*');
      } else {
        sanitized = sanitized.replace(/X/g, 'x');
      }
    }

    // 3. Whitespace
    sanitized = sanitized.replace(/\s+/g, '');

    return sanitized;
  }
}
