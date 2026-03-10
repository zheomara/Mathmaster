export function mathToSpeech(text: string): string {
  // First, extract math blocks (both inline $...$ and block $$...$$)
  // and process them separately so we don't accidentally replace normal text.
  
  const processMath = (mathStr: string) => {
    return mathStr
      .replace(/\\frac{([^}]+)}{([^}]+)}/g, '$1 over $2')
      .replace(/\\sqrt{([^}]+)}/g, 'square root of $1')
      .replace(/\\div/g, ' divided by ')
      .replace(/÷/g, ' divided by ')
      .replace(/\//g, ' divided by ')
      .replace(/\\times/g, ' multiply by ')
      .replace(/×/g, ' multiply by ')
      .replace(/\\cdot/g, ' times ')
      .replace(/\\pi/g, ' pi ')
      .replace(/\\approx/g, ' is approximately equal to ')
      .replace(/\\neq/g, ' is not equal to ')
      .replace(/\\leq?/g, ' is less than or equal to ')
      .replace(/\\geq?/g, ' is greater than or equal to ')
      .replace(/\\pm/g, ' plus or minus ')
      .replace(/\\infty/g, ' infinity ')
      .replace(/\\sum/g, ' sum of ')
      .replace(/\\int/g, ' integral of ')
      .replace(/\\sin/g, ' sine ')
      .replace(/\\cos/g, ' cosine ')
      .replace(/\\tan/g, ' tangent ')
      .replace(/\\theta/g, ' theta ')
      .replace(/\\alpha/g, ' alpha ')
      .replace(/\\beta/g, ' beta ')
      .replace(/\\gamma/g, ' gamma ')
      .replace(/\^2/g, ' squared ')
      .replace(/\^3/g, ' cubed ')
      .replace(/\^{([^}]+)}/g, ' to the power of $1 ')
      .replace(/\^([a-zA-Z0-9])/g, ' to the power of $1 ')
      .replace(/_/g, ' sub ')
      .replace(/=/g, ' equals ')
      .replace(/\+/g, ' plus ')
      .replace(/-/g, ' minus ')
      .replace(/\\left\(/g, ' open parenthesis ')
      .replace(/\\right\)/g, ' close parenthesis ')
      .replace(/\\left\[/g, ' open bracket ')
      .replace(/\\right\]/g, ' close bracket ')
      .replace(/\\/g, ' '); // Remove any remaining backslashes
  };

  // Replace block math $$...$$
  let processedText = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
    return processMath(math);
  });

  // Replace inline math $...$
  processedText = processedText.replace(/\$([^$]+)\$/g, (match, math) => {
    return processMath(math);
  });

  // Clean up markdown formatting and apply general symbol rules
  processedText = processedText
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\//g, ' divided by ')
    .replace(/÷/g, ' divided by ')
    .replace(/×/g, ' multiply by ');

  return processedText.trim();
}
