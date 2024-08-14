# Custom Pixels
This extension adds custom pixels to the store to allow us to track Amplitude events and any others that aren't natively supported by the Shopify.

[https://shopify.dev/docs/apps/build/marketing-analytics/build-web-pixels](Docs)

## Activate

```graphql
mutation {
  # This mutation creates a web pixel, and sets the default settings.
  webPixelCreate(webPixel: { settings: "{\"amplitudeAPIKey\":\"a3dbb6dc52eedb09088e245a9af7944c\"}" }) {
    userErrors {
      code
      field
      message
    }
    webPixel {
      settings
      id
    }
  }
}
```