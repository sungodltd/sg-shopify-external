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

register(({ analytics, browser, init, settings }) => {
  amplitude.getInstance().init(settings.amplitudeAPIKey)

  analytics.subscribe("all_standard_events", event => {
    // Ensure we have the correct device ID to be consistent with storefront
    const cartAmplitudeDeviceId = getDeviceIDFromEvent(event)
    const activeAmplitudeDeviceId = amplitude.getInstance().getDeviceId()
    console.log(cartAmplitudeDeviceId, activeAmplitudeDeviceId)
    if (cartAmplitudeDeviceId && (cartAmplitudeDeviceId !== activeAmplitudeDeviceId)) {
      amplitude.getInstance().setDeviceId(cartAmplitudeDeviceId)
    }

    console.log("Event data ", event?.data);
  });

  analytics.subscribe('checkout_started', event => {
    console.log('Checkout Started', { platform: 'shopify' })
    amplitude.getInstance().logEvent('Checkout Started', { platform: 'shopify' })
  })

  analytics.subscribe('checkout_completed', event => {
    console.log('Checkout Completed', { platform: 'shopify' })
    amplitude.getInstance().logEvent('Checkout Completed', { platform: 'shopify' })
  })
});
