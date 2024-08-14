// @ts-check

import type {
  RunInput,
  FunctionRunResult
} from "../generated/api";

const NO_CHANGES = {
  operations: [],
} as FunctionRunResult

export function run(input: RunInput): FunctionRunResult {
  console.error("Running cart...");
  console.error(JSON.stringify(input));

  // Get all line items and group them by their bundleId. Ignore if they don't have a bundleId.
  type GroupedBundles = {
    [bundleId: string]: typeof input.cart.lines
  }
  const bundles: GroupedBundles = {}
  input.cart.lines.forEach((line) => {
    if (!line.bundleId?.value) return;
    if (!line.parentVariantId?.value) return;
    const bundleId = line.bundleId.value as string;
    if (!bundles[bundleId]) {
      bundles[bundleId] = [];
    }
    bundles[bundleId].push(line);
  })
  console.error(bundles)

  // If there are no bundles, return early.
  if (Object.keys(bundles).length === 0) {
    return NO_CHANGES;
  }

  // Create merge operations for each bundle
  const updates = Object.values(bundles).map((bundleLines) => {
    const parentVariantId = bundleLines.find(
      (line) => line.parentVariantId?.value
    )?.parentVariantId?.value;
    if (!parentVariantId) return null

    return {
      merge: {
        cartLines: bundleLines.map((line) => ({
          cartLineId: line.id,
          quantity: line.quantity
        })),
        parentVariantId,
        image: {
          url: 'https://cdn.shopify.com/s/files/1/0878/4835/4098/files/tempests-tf_Fclear-tgle_Nsilverblue.webp'
        }
      }
    }
  }).filter(Boolean) as FunctionRunResult["operations"]

  return {
    operations: updates
  }
}

