enum _smallMoney {}
export type SmallMoney = number | { _A: _smallMoney };

enum _bigMoney {}
export type BigMoney = number | { _A: _bigMoney };

export function moneySmallToBig(x: SmallMoney): BigMoney {
  return (Math.floor(x as number) / 100) as BigMoney;
}

export function moneyBigToSmall(x: BigMoney): SmallMoney {
  return Math.floor((x as number) * 100) as SmallMoney;
}
