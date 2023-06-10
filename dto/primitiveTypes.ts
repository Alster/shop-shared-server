enum _smallMoney {}
export type MoneySmall = number | { _A: _smallMoney };

enum _bigMoney {}
export type MoneyBig = number | { _A: _bigMoney };

export function moneySmallToBig(x: MoneySmall): MoneyBig {
  return (Math.floor(x as number) / 100) as MoneyBig;
}

export function moneyBigToSmall(x: MoneyBig): MoneySmall {
  return Math.floor((x as number) * 100) as MoneySmall;
}
