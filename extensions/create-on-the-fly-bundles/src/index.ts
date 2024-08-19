// @ts-check

import type {
  RunInput,
  FunctionRunResult
} from "../generated/api";

const NO_CHANGES = {
  operations: [],
} as FunctionRunResult

function cleanSKU (sku: string): string {
  // Remove lens techs
  const pattern = /le_(N|P|8P|8|[A-Z]{0,3}RX)?([a-z]*)(N|8N)?/
  sku = sku.replace(pattern, 'le_$2')

  // Map all matte parts to infinite (_M to _I)
  sku = sku.replace(/_M/, '_I')

  return sku
}

type ProductImage = {
  url: string
}
function getProductImage(lines: typeof RunInput["cart"]["lines"]): ProductImage | null {
  try {
    // Get the SKUs of all parts in this bundle
    let bundlePartSKUs = lines.map(
      (line) => cleanSKU(line.merchandise.sku)
    ).filter(Boolean) as string[]

    const image = lines.map((line) => {
      const images = line.merchandise.productImages?.jsonValue
      if (!images) return null
      const partsKey = bundlePartSKUs.filter(
        sku => images?.validSKUPrefixes.includes(sku.split('_')[0])
      ).sort((a, b) => a.localeCompare(b)).join(',')
      console.error(partsKey)
      if (!partsKey) return null
      if (partsKey in images.mapping) {
        return {
          url: images.baseURL + images.mapping[partsKey]
        }
      }
    }).find(Boolean) as ProductImage

    console.error(image?.url)

    return image

  } catch (error) {
    console.error("Error getting product image")
    console.error(error)
    return null
  }
}

export function run(input: RunInput): FunctionRunResult {
  console.error("Running cart...");

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

    const image = getProductImage(bundleLines)

    return {
      merge: {
        cartLines: bundleLines.map((line) => ({
          cartLineId: line.id,
          quantity: line.quantity
        })),
        parentVariantId,
        image
      }
    }
  }).filter(Boolean) as FunctionRunResult["operations"]

  return {
    operations: updates
  }
}

