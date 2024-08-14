import { register } from "@shopify/web-pixels-extension";
import amplitude from 'amplitude-js'

type CartAttribute = {
  key: string
  value: string
}
function getDeviceIDFromEvent (event) {
  const attributes = (event?.checkout?.attributes || []) as CartAttribute[]
  const deviceIDAttribute = attributes.find(attr => attr.key === '_amplitudeDeviceId')
  return deviceIDAttribute?.value
}

function getCheckoutPayload (checkout) {
  const distinctLineItems = checkout.lineItems.filter((lineItem) => {
    const properties = Object.fromEntries(lineItem.customAttributes.map(attr => [attr.key, attr.value]))

    // If the line item has no _bundleId and _baseVariantId then it's distinct
    if (!properties._bundleId && !properties._baseVariantId) return true

    // If a line item has a _bundleId and it's _baseVariantId matches itself then it's the base variant of a bundle
    if (properties._bundleId && properties._baseVariantId?.split('/')?.pop() === lineItem.variant.id) return true

    return false
  })

  const items = distinctLineItems.map((lineItem) => {
    const properties = Object.fromEntries(lineItem.properties?.map(attr => [attr.key, attr.value]) || [])

    const sku = properties?._bundleSku || lineItem.variant.sku
    
    return {
      sku,
      product_id: sku,
      variant: sku,
      category: sku?.split('-')[0],
      brand: "SunGod",
      legacy_sku: sku,
      base_sku: sku?.split('-')[0],
      name: lineItem.title,
      is_limited_edition: sku?.includes('-le_'),
      image_url: `https://dynamic.sungod.co/?sku=${sku}`
    }
  })

  return {
    platform: 'shopify',
    order_id: checkout?.order?.id,
    item_count: distinctLineItems.length,
    currency: checkout?.totalPrice?.currencyCode,
    total: checkout?.totalPrice?.amount,
    revenue: checkout?.totalPrice?.amount,
    value: checkout?.totalPrice?.amount,
    subtotal: checkout?.subtotalPrice?.amount,
    shipping: checkout?.shippingLine?.price?.amount,
    tax: checkout?.totalTax?.amount,
    discount: checkout?.discountsAmount?.amount,
    items,
    products: items
  }
}

register(({ analytics, browser, init, settings }) => {
  amplitude.getInstance().init(settings.amplitudeAPIKey)

  analytics.subscribe("all_standard_events", event => {
    // Ensure we have the correct device ID to be consistent with storefront
    const cartAmplitudeDeviceId = getDeviceIDFromEvent(event?.data)
    const activeAmplitudeDeviceId = amplitude.getInstance().getDeviceId()
    console.log(cartAmplitudeDeviceId, activeAmplitudeDeviceId)
    if (cartAmplitudeDeviceId && (cartAmplitudeDeviceId !== activeAmplitudeDeviceId)) {
      amplitude.getInstance().setDeviceId(cartAmplitudeDeviceId)
    }

    console.log("Event data ", event?.data);
  });

  analytics.subscribe('checkout_started', event => {
    console.log('Checkout Started', getCheckoutPayload(event?.data?.checkout))
    amplitude.getInstance().logEvent('Checkout Started', getCheckoutPayload(event?.data?.checkout))
  })

  analytics.subscribe('checkout_completed', event => {
    console.log('Checkout Completed', getCheckoutPayload(event?.data?.checkout))
    amplitude.getInstance().logEvent('Checkout Completed', getCheckoutPayload(event?.data?.checkout))
  })
});
