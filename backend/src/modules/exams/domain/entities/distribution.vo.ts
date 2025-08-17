export type Distribution = {
  multiple_choice: number;
  true_false: number;
  open_analysis: number;
  open_exercise: number;
};

export class DistributionVO {
  constructor(public readonly value: Distribution, public readonly total: number) {
    const { multiple_choice, true_false, open_analysis, open_exercise } = value;
    const list = [multiple_choice, true_false, open_analysis, open_exercise];
    if (list.some(n => !Number.isInteger(n) || n < 0)) {
      throw new Error('Distribución inválida: valores deben ser enteros ≥ 0.');
    }
    const sum = list.reduce((a,b)=>a+b,0);
    if (sum !== total) {
      throw new Error(`Distribución inválida: la suma (${sum}) debe ser igual al total (${total}).`);
    }
  }
}