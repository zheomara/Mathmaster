export class LinearSolver {
  static solve(equation: string): string[] {
    const steps: string[] = [];
    
    // Basic parsing for ax+b=c
    const regex = /^(-?\d*)([a-z])([+-]\d+)?=(-?\d+)$/;
    const match = equation.match(regex);

    if (!match) {
      return ["Could not parse equation. Please ensure it is in the format ax+b=c (e.g., 2x+4=12)."];
    }

    let aStr = match[1];
    const variable = match[2];
    const bStr = match[3];
    const cStr = match[4];

    let a = 1;
    if (aStr === '-') a = -1;
    else if (aStr !== '') a = parseInt(aStr, 10);

    let b = bStr ? parseInt(bStr, 10) : 0;
    let c = parseInt(cStr, 10);

    steps.push(`Step 1: Identify the equation: ${a}${variable} ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c}`);

    let rightSide = c;
    if (b !== 0) {
      rightSide = c - b;
      const op = b > 0 ? 'subtracting' : 'adding';
      steps.push(`Step 2: Move the constant (${b > 0 ? '+' : ''}${b}) to the right side by ${op} it: ${c} ${b > 0 ? '-' : '+'} ${Math.abs(b)} = ${rightSide}.`);
    } else {
      steps.push(`Step 2: No constant to move.`);
    }

    let finalAnswer = rightSide;
    if (a !== 1) {
      finalAnswer = rightSide / a;
      steps.push(`Step 3: Divide by the coefficient (${a}): ${rightSide} / ${a} = ${finalAnswer}.`);
    } else {
      steps.push(`Step 3: Coefficient is 1, no division needed.`);
    }

    steps.push(`Step 4: Final Answer: ${variable} = ${finalAnswer}.`);

    return steps;
  }
}
