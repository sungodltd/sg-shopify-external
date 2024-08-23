// @ts-check

import type {
  RunInput,
  FunctionRunResult
} from "../generated/api";

const NO_CHANGES = {
  operations: [],
} as FunctionRunResult

export function run(input: RunInput): FunctionRunResult {
  // console.error("Running cart...");

  // Get all line items and group them by their bundleId. Ignore if they don't have a bundleId.
  type GroupedBundles = {
    [bundleId: string]: {
      parentVariantId: string,
      items: typeof input.cart.lines,
      attributes: Record<string, string>
    }
  }
  const bundles = input.cart.lines.reduce((acc, line) => {
    if (!line.bundleId?.value) return acc;
    const bundleId = line.bundleId.value;
    if (!acc[bundleId]) acc[bundleId] = {
      items: [],
      parentVariantId: '',
      attributes: { _bundleId: bundleId }
    };
    acc[bundleId].items.push(line);

    acc[bundleId].parentVariantId = line.parentVariantId?.value || acc[bundleId].parentVariantId

    acc[bundleId].attributes['_checkoutInfo'] = line.checkoutInfo?.value || acc[bundleId].attributes['_checkoutInfo']
    acc[bundleId].attributes['_despatchDate'] = line.despatchDate?.value || acc[bundleId].attributes['_despatchDate']
    acc[bundleId].attributes['_bundleSku'] = line.bundleSku?.value || acc[bundleId].attributes['_bundleSku']

    return acc;
  }, {} as GroupedBundles)

  // Check the total number of bundles in the cart. If it is <= 4 then bail out
  // as we will rely on create-on-the-fly-bundles to take over with images.
  // if (Object.keys(bundles).length <= 4) {
  //   return NO_CHANGES
  // }

  // console.error(bundles)

  // If there are no bundles, return early.
  if (Object.keys(bundles).length === 0) {
    return NO_CHANGES;
  }

  // Create merge operations for each bundle
  const updates = Object.values(bundles).map(({ items, parentVariantId, attributes }) => {
    if (!parentVariantId) return null

    return {
      merge: {
        cartLines: items.map((line) => ({
          cartLineId: line.id,
          quantity: 1
        })),
        parentVariantId,
        attributes: Object.entries(attributes).filter(
          ([_, value]) => value
        ).map(([key, value]) => ({ key, value }))
      }
    }
  }).filter(Boolean) as FunctionRunResult["operations"]

  return {
    operations: updates
  }
}

