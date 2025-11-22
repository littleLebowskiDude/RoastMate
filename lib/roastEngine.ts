import { Blend, BlendComponent, Coffee, OnHandStock } from '@prisma/client';

export interface OrderLine {
  mappedCoffeeId?: string;
  mappedBlendId?: string;
  mappedIsBlend: boolean;
  sizeG: number;
  quantity: number;
}

export interface BlendWithComponents extends Blend {
  components: (BlendComponent & { coffee: Coffee })[];
}

export type OnHandLookup = {
  coffees: Record<string, number>;
  blends: Record<string, number>;
};

export interface RoastCalculation {
  coffeeId: string;
  coffeeName: string;
  roastLossPercentage: number;
  requiredRoastedG: number;
  requiredGreenG: number;
  dropsRequired: number;
  totalGreen: number;
  totalRoastedOutput: number;
  surplusRoastedG: number;
}

export interface RoastEngineResult {
  results: RoastCalculation[];
  onHandAfter: OnHandLookup;
}

const DROP_SIZE_G = 5000;

export function buildOnHandLookup(stocks: OnHandStock[]): OnHandLookup {
  return stocks.reduce<OnHandLookup>(
    (acc, stock) => {
      if (stock.coffeeId) {
        acc.coffees[stock.coffeeId] = stock.onHandRoastedG;
      }
      if (stock.blendId) {
        acc.blends[stock.blendId] = stock.onHandRoastedG;
      }
      return acc;
    },
    { coffees: {}, blends: {} }
  );
}

export function roastEngine({
  coffees,
  blends,
  orders,
  onHand
}: {
  coffees: Coffee[];
  blends: BlendWithComponents[];
  orders: OrderLine[];
  onHand: OnHandLookup;
}): RoastEngineResult {
  const roastedNeeded: Record<string, number> = {};
  const singleNeeds: Record<string, number> = {};
  const blendComponentNeeds: Record<string, Record<string, number>> = {};
  const coffeeIndex = Object.fromEntries(coffees.map((c) => [c.id, c]));
  const blendIndex = Object.fromEntries(blends.map((b) => [b.id, b]));
  const workingOnHand: OnHandLookup = {
    coffees: { ...onHand.coffees },
    blends: { ...onHand.blends }
  };

  const consumeOnHand = (bucket: Record<string, number>, key: string, desired: number) => {
    const available = bucket[key] || 0;
    const remaining = Math.max(0, desired - available);
    const updated = Math.max(0, available - desired);
    bucket[key] = updated;
    return remaining;
  };

  for (const orderLine of orders) {
    const baseNeeded = orderLine.sizeG * orderLine.quantity;
    if (orderLine.mappedIsBlend && orderLine.mappedBlendId) {
      const blend = blendIndex[orderLine.mappedBlendId];
      if (!blend) continue;
      const remainingBlend = consumeOnHand(workingOnHand.blends, blend.id, baseNeeded);
      blendTotals[blend.id] = (blendTotals[blend.id] || 0) + remainingBlend;
      for (const component of blend.components) {
        const compRoasted = remainingBlend * (component.percentage / 100);
        roastedNeeded[component.coffeeId] = (roastedNeeded[component.coffeeId] || 0) + compRoasted;
        blendComponentNeeds[blend.id] = blendComponentNeeds[blend.id] || {};
        blendComponentNeeds[blend.id][component.coffeeId] =
          (blendComponentNeeds[blend.id][component.coffeeId] || 0) + compRoasted;
      }
    } else if (orderLine.mappedCoffeeId) {
      const remainingCoffee = consumeOnHand(workingOnHand.coffees, orderLine.mappedCoffeeId, baseNeeded);
      roastedNeeded[orderLine.mappedCoffeeId] =
        (roastedNeeded[orderLine.mappedCoffeeId] || 0) + remainingCoffee;
      singleNeeds[orderLine.mappedCoffeeId] = (singleNeeds[orderLine.mappedCoffeeId] || 0) + remainingCoffee;
    }
  }

  const results: RoastCalculation[] = Object.entries(roastedNeeded).map(([coffeeId, roasted]) => {
    const coffee = coffeeIndex[coffeeId];
    const roastLoss = (coffee?.roastLossPercentage ?? 0) / 100;
    const requiredGreenG = roasted / (1 - roastLoss || 1);
    const dropsRequired = Math.ceil(requiredGreenG / DROP_SIZE_G);
    const totalGreen = dropsRequired * DROP_SIZE_G;
    const totalRoastedOutput = totalGreen * (1 - roastLoss);
    const surplusRoastedG = totalRoastedOutput - roasted;
    const blendNeedForCoffee = Object.values(blendComponentNeeds).reduce(
      (acc, comp) => acc + (comp[coffeeId] || 0),
      0
    );
    const singleNeedForCoffee = singleNeeds[coffeeId] || 0;
    const totalNeed = blendNeedForCoffee + singleNeedForCoffee || 1;
    const outputForBlend = blendNeedForCoffee > 0 ? totalRoastedOutput * (blendNeedForCoffee / totalNeed) : 0;
    const outputForSingles = totalRoastedOutput - outputForBlend;
    const surplusSingles = outputForSingles - singleNeedForCoffee;
    if (surplusSingles > 0) {
      workingOnHand.coffees[coffeeId] = (workingOnHand.coffees[coffeeId] || 0) + surplusSingles;
    }

    if (blendNeedForCoffee > 0) {
      for (const [blendId, componentNeeds] of Object.entries(blendComponentNeeds)) {
        const needForBlend = componentNeeds[coffeeId] || 0;
        if (!needForBlend) continue;
        const share = needForBlend / blendNeedForCoffee;
        const portionOutput = outputForBlend * share;
        const surplus = portionOutput - needForBlend;
        if (surplus > 0) {
          workingOnHand.blends[blendId] = (workingOnHand.blends[blendId] || 0) + surplus;
        }
      }
    }

    return {
      coffeeId,
      coffeeName: coffee?.name ?? 'Unknown',
      roastLossPercentage: coffee?.roastLossPercentage ?? 0,
      requiredRoastedG: roasted,
      requiredGreenG,
      dropsRequired,
      totalGreen,
      totalRoastedOutput,
      surplusRoastedG
    };
  });

  return { results, onHandAfter: workingOnHand };
}
