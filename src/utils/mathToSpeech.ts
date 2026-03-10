export function mathToSpeech(text: string): string {
  if (!text) return '';

  // First, handle LaTeX delimiters that might be used instead of $
  let normalizedText = text
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  const processMath = (mathStr: string) => {
    return mathStr
      .replace(/\\frac{([^}]+)}{([^}]+)}/g, '$1 over $2')
      .replace(/\\sqrt{([^}]+)}/g, 'square root of $1')
      .replace(/\\sqrt\[([^\]]+)\]{([^}]+)}/g, '$1 root of $2')
      .replace(/\\div/g, ' divided by ')
      .replace(/\\times/g, ' times ')
      .replace(/\\cdot/g, ' times ')
      .replace(/\\pm/g, ' plus or minus ')
      .replace(/\\mp/g, ' minus or plus ')
      .replace(/\\approx/g, ' is approximately ')
      .replace(/\\neq/g, ' is not equal to ')
      .replace(/\\leq/g, ' is less than or equal to ')
      .replace(/\\geq/g, ' is greater than or equal to ')
      .replace(/\\lt/g, ' is less than ')
      .replace(/\\gt/g, ' is greater than ')
      .replace(/\\pi/g, ' pi ')
      .replace(/\\theta/g, ' theta ')
      .replace(/\\alpha/g, ' alpha ')
      .replace(/\\beta/g, ' beta ')
      .replace(/\\gamma/g, ' gamma ')
      .replace(/\\delta/g, ' delta ')
      .replace(/\\sigma/g, ' sigma ')
      .replace(/\\infty/g, ' infinity ')
      .replace(/\\sum/g, ' the sum of ')
      .replace(/\\int/g, ' the integral of ')
      .replace(/\\sin/g, ' sine ')
      .replace(/\\cos/g, ' cosine ')
      .replace(/\\tan/g, ' tangent ')
      .replace(/\^2/g, ' squared ')
      .replace(/\^3/g, ' cubed ')
      .replace(/\^{([^}]+)}/g, ' to the power of $1 ')
      .replace(/\^([a-zA-Z0-9])/g, ' to the power of $1 ')
      .replace(/_/g, ' sub ')
      .replace(/=/g, ' equals ')
      .replace(/\+/g, ' plus ')
      .replace(/-/g, ' minus ')
      .replace(/\\left\(/g, ' ')
      .replace(/\\right\)/g, ' ')
      .replace(/\\left\[/g, ' ')
      .replace(/\\right\]/g, ' ')
      .replace(/\\left\{/g, ' ')
      .replace(/\\right\}/g, ' ')
      .replace(/\\{/g, ' ')
      .replace(/\\}/g, ' ')
      .replace(/\\/g, ' '); // Remove remaining backslashes
  };

  // Replace block math $$...$$
  let processedText = normalizedText.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
    return ' ' + processMath(math) + ' ';
  });

  // Replace inline math $...$
  processedText = processedText.replace(/\$([^$]+)\$/g, (match, math) => {
    return ' ' + processMath(math) + ' ';
  });

  // Final cleanup for speech
  return processedText
    .replace(/\\n/g, ' ') // Replace literal \n strings
    .replace(/\n/g, ' ')  // Replace actual newlines
    .replace(/\r/g, ' ')
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/\*\*/g, '') // Remove bold
    .replace(/\*/g, '')   // Remove italic
    .replace(/#/g, '')    // Remove headers
    .replace(/`/g, '')    // Remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
    .replace(/\$/g, '')   // Remove any stray dollar signs
    .replace(/^-(\d)/g, 'minus $1')   // Handle leading "-5"
    .replace(/ - (\d)/g, ' minus $1') // Handle " - 5"
    .replace(/ -(\d)/g, ' minus $1')  // Handle "-5"
    .replace(/ - /g, ' minus ')       // Replace standalone minus
    .replace(/ \+ /g, ' plus ')        // Replace standalone plus
    .replace(/ \* /g, ' times ')       // Replace standalone asterisk
    .replace(/ = /g, ' equals ')      // Replace standalone equals
    .trim();
}
