import {
  reactExtension,
  Pressable,
  Image,
  Text,
  useCartLines,
  useApplyAttributeChange,
  useAttributeValues,
  useSettings,
  Style,
  Grid,
  Button,
  BlockSpacer,
  Tooltip,
  Icon,
  Banner,
} from "@shopify/ui-extensions-react/checkout";

const litePackaging = reactExtension(
  "purchase.checkout.block.render",
  () => <LitePackaging />
);
export {litePackaging};

const charityDonation = reactExtension(
  'purchase.checkout.reductions.render-after',
  () => <CharityDonation />,
);
export {charityDonation};

function LitePackaging() {
  const cartLines = useCartLines();
  const applyAttributeChange = useApplyAttributeChange();
  const [packaging] = useAttributeValues(["Packaging"]);

  const { litePackagingAvailable, defaultLitePackaging } = cartLines.reduce(
    (acc, item) => {
      const { attributes } = item;
      const checkoutInfo =
        attributes.find((attr) => attr.key === "_checkoutInfo")?.value || "";

      return {
        litePackagingAvailable:
          acc.litePackagingAvailable ||
          checkoutInfo.includes("litePackagingAvailable"),
        defaultLitePackaging:
          acc.defaultLitePackaging ||
          checkoutInfo.includes("defaultLitePackaging"),
      };
    },
    {
      litePackagingAvailable: false,
      defaultLitePackaging: false,
    }
  );

  const litePackagingCount = cartLines.reduce((count, item) => {
    const { attributes } = item;
    const checkoutInfo =
      attributes.find((attr) => attr.key === "_checkoutInfo")?.value || "";

    return count + (checkoutInfo.includes("litePackagingAvailable") ? 1 : 0);
  }, 0);

  // Set to standard packaging if null
  if (!packaging) {
    applyAttributeChange({
      key: "Packaging",
      type: "updateAttribute",
      value: defaultLitePackaging ? "lite" : "standard",
    });
  }

  const { mobile_image, desktop_image, charity_info, charity_donation } = useSettings();
  const mobileImage: any = mobile_image
    ? mobile_image
    : "https://cdn.shopify.com/s/files/1/0808/0021/9476/files/Lite_Packaging_Mobile.jpg?v=1724336458";
  const desktopImage: any = desktop_image
    ? desktop_image
    : "https://cdn.shopify.com/s/files/1/0808/0021/9476/files/Lite_Packaging_Desktop.jpg?v=1724336481";
  const charityInfo: any = charity_info || "The Bike Project help get refugees and asylum seekers on bikes"
  const charityDonation: any = Number(charity_donation) || 1.50

  const totalCharityValue = `£${(litePackagingCount * charityDonation).toFixed(2)}`

  function packagingLite() {
    applyAttributeChange({
      key: "Packaging",
      type: "updateAttribute",
      value: "lite",
    });
  }

  function packagingDefault() {
    applyAttributeChange({
      key: "Packaging",
      type: "updateAttribute",
      value: "standard",
    });
  }

  if (litePackagingAvailable) {
    return (
      <Grid rows="auto" display={litePackagingAvailable ? "auto" : "none"}>
        <Image
          fit={"cover"}
          source={Style.default(mobileImage).when(
            { viewportInlineSize: { min: "extraSmall" } },
            desktopImage
          )}
          cornerRadius="base"
        />
        <BlockSpacer />
        <Grid
          columns={Style.default(["auto"]).when(
            { viewportInlineSize: { min: "extraSmall" } },
            ["fill", "auto"]
          )}
          blockAlignment="center"
          spacing={Style.default("base").when(
            { viewportInlineSize: { min: "extraSmall" } },
            "extraLoose"
          )}
          rows="auto"
        >
          {packaging === "lite" ? (
            <>
            <Grid rows='auto'>
              <Text appearance="success" emphasis="bold">Lite Packaging™ Selected</Text>
              <Text appearance="success">
                Thanks for choosing to make a difference!
              </Text>
            </Grid>
              <Button
                appearance="monochrome"
                kind="plain"
                onPress={packagingDefault}
              >
                Switch to full packaging
              </Button>
            </>
          ) : (
            <>
              <Grid
                columns={["auto", "fill"]}
                blockAlignment="center"
                spacing="base"
              >
                <Pressable
                  overlay={<Tooltip>{charityInfo}</Tooltip>}
                >
                  <Icon source="question"></Icon>
                </Pressable>
                <Text size="small">
                  We'll strip back your packaging to reduce your order's
                  emissions, and donate {totalCharityValue} to charity on your behalf.
                </Text>
              </Grid>
              <Button
                appearance="monochrome"
                kind="secondary"
                onPress={packagingLite}
              >
                SELECT
              </Button>
            </>
          )}
        </Grid>
      </Grid>
    );
  } else return;
}

function CharityDonation() {
  const cartLines = useCartLines();
  const [packaging] = useAttributeValues(["Packaging"]);

  const litePackagingCount = cartLines.reduce((count, item) => {
    const { attributes } = item;
    const checkoutInfo =
      attributes.find((attr) => attr.key === "_checkoutInfo")?.value || "";

    return count + (checkoutInfo.includes("litePackagingAvailable") ? 1 : 0);
  }, 0);

  const totalCharityValue = `£${(litePackagingCount * 1.50).toFixed(2)}`

  if (packaging == 'lite') {
    return (
      <Banner status="success">
        <Text size="small">Including a <Text size="small" emphasis="bold">{totalCharityValue} charity donation</Text> - at no extra cost to you.</Text>
      </Banner>
    );
  } else {
    return;
  }
}
