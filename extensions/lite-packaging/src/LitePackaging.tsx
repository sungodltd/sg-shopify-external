import {
  reactExtension,
  BlockStack,
  Switch,
  Text,
  Image,
  useCartLines,
  SkeletonImage,
  useApplyAttributeChange,
  useAttributeValues,
  useSettings,
  View,
  Style,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.block.render", () => (
  <LitePackaging />
));

function LitePackaging() {
  const cartLines = useCartLines();
  const applyAttributeChange = useApplyAttributeChange();
  const [packaging] =
    useAttributeValues([
      'Packaging'
  ]); 

  // const fakeCartItems = [
  //     {
  //       attributes: [],
  //     },
  //     {
  //       attributes: [
  //         {
  //           key: "_checkoutInfo",
  //           value: "litePackagingAvailable,defaultLitePackaging",
  //         },
  //       ],
  //     }
  //   ];

  const {
    litePackagingAvailable,defaultLitePackaging
  } = cartLines.reduce(
    (acc, item) => {
      const { attributes } = item;
      const checkoutInfo =
        attributes.find((attr) => attr.key === "_checkoutInfo")?.value || "";

      return {
        litePackagingAvailable:
          acc.litePackagingAvailable || checkoutInfo.includes("litePackagingAvailable"),
        defaultLitePackaging:
          acc.defaultLitePackaging || checkoutInfo.includes("defaultLitePackaging")
      };
    },
    {
      litePackagingAvailable: false,
      defaultLitePackaging: false
    }
  );


  // Set to standard packaging if null
  if (!packaging) {
    applyAttributeChange({
      key: "Packaging",
      type: "updateAttribute",
      value: defaultLitePackaging ? "lite" : "standard",
    });
  }

  const { mobile_image, desktop_image } = useSettings();
  const mobileImage = mobile_image ? mobile_image : 'https://cdn.shopify.com/s/files/1/0638/6679/8216/files/placeholderLitePackagingMobile.jpg'
  const desktopImage = desktop_image ? desktop_image : 'https://cdn.shopify.com/s/files/1/0638/6679/8216/files/placeholderLitePackaging.jpg'

  return (
    <>
    <View
      display={litePackagingAvailable ? 'auto' : 'none'}
    >
      <BlockStack 
        padding={"none"}
        overflow={"hidden"}>
        <SkeletonImage>
        </SkeletonImage>
        <Image
          fit={"cover"}
          source={
            Style.default(mobileImage)
              .when({ viewportInlineSize: { min: 'extraSmall' } }, desktopImage)
          }
        />
        <Switch 
          checked={packaging === 'lite'}
          onChange={packagingChange}
          accessibilityLabel="choose-lite-packaging"
          label={'Choose Lite Packaging (FREE)'}
          />
      </BlockStack>
    </View>
    {/* For Testing: */}
    <Text size="extraSmall" appearance="subdued">Current Packaging: {packaging}</Text>
    </>
  );

  function packagingChange(isChecked: Boolean) {
    applyAttributeChange({
      key: "Packaging",
      type: "updateAttribute",
      value: isChecked ? "lite" : "standard",
    });
  }
}