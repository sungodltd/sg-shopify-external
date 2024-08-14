import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const response = await admin.graphql(
      `#graphql
      query {
        webPixel {
          id
          settings
        }
      }`
    )
    const responseJson = await response.json()
  
    return json({
      webPixel: responseJson.data.webPixel,
    });
  } catch (error) {
    return json({
      error: "Failed to load web pixel",
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData()
  const action = formData.get("action")

  if (action === "installWebPixel") {
    const amplitudeAPIKey = formData.get("amplitudeAPIKey")
    const response = await admin.graphql(
      `#graphql
      mutation ($settings: JSON!) {
        # This mutation creates a web pixel, and sets the default settings.
        webPixelCreate(webPixel: { settings: $settings }) {
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
      }`,
      { variables: {
        settings: JSON.stringify({
          amplitudeAPIKey
        })
      } }
    )
    const responseJson = await response.json()
    return json(responseJson)
  } else if (action === "uninstallWebPixel") {
    const webPixelId = formData.get("webPixelId")
    const response = await admin.graphql(
      `#graphql
      mutation webPixelDelete($id: ID!) {
        webPixelDelete(id: $id) {
          deletedWebPixelId
          userErrors {
            field
            message
          }
        }
      }`,
      { variables: { id: webPixelId } }
    )
    const responseJson = await response.json()
    return json(responseJson)
  } else {
    return json({
      error: "Unknown action",
    }, {
      status: 400,
    });
  }

  // const color = ["Red", "Orange", "Yellow", "Green"][
  //   Math.floor(Math.random() * 4)
  // ];
  // const response = await admin.graphql(
  //   `#graphql
  //     mutation populateProduct($input: ProductInput!) {
  //       productCreate(input: $input) {
  //         product {
  //           id
  //           title
  //           handle
  //           status
  //           variants(first: 10) {
  //             edges {
  //               node {
  //                 id
  //                 price
  //                 barcode
  //                 createdAt
  //               }
  //             }
  //           }
  //         }
  //       }
  //     }`,
  //   {
  //     variables: {
  //       input: {
  //         title: `${color} Snowboard`,
  //       },
  //     },
  //   },
  // );
  // const responseJson = await response.json();

  // const variantId =
  //   responseJson.data!.productCreate!.product!.variants.edges[0]!.node!.id!;
  // const variantResponse = await admin.graphql(
  //   `#graphql
  //     mutation shopifyRemixTemplateUpdateVariant($input: ProductVariantInput!) {
  //       productVariantUpdate(input: $input) {
  //         productVariant {
  //           id
  //           price
  //           barcode
  //           createdAt
  //         }
  //       }
  //     }`,
  //   {
  //     variables: {
  //       input: {
  //         id: variantId,
  //         price: Math.random() * 100,
  //       },
  //     },
  //   },
  // );

  // const variantResponseJson = await variantResponse.json();

  // return json({
  //   product: responseJson!.data!.productCreate!.product,
  //   variant: variantResponseJson!.data!.productVariantUpdate!.productVariant,
  // });
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  
  const webPixelId = data.webPixel?.id;
  
  const installWebPixel = () => fetcher.submit({
    action: "installWebPixel",
    amplitudeAPIKey: "a3dbb6dc52eedb09088e245a9af7944c"
  }, { method: "POST" });

  const uninstallWebPixel = () => fetcher.submit({
    action: "uninstallWebPixel",
    webPixelId,
  }, { method: "POST" });

  return (
    <Page>
      <TitleBar title="SunGod External" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Custom Pixel
                  </Text>
                  <Text variant="bodyMd" as="p">
                    A custom pixel extension is included in this app to allow us to accurately
                    track customer behaviour from storefront through to checkout.
                  </Text>
                </BlockStack>
                
                <InlineStack gap="300">
                  {webPixelId && (
                    <Button
                      onClick={uninstallWebPixel}
                      loading={isLoading}
                    >
                      Uninstall Web Pixel
                    </Button>
                  )}
                  {!webPixelId && (
                    <Button
                      onClick={installWebPixel}
                      loading={isLoading}
                    >
                      Install Web Pixel
                    </Button>
                  )}
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}