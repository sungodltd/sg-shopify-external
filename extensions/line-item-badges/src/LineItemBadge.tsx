import {
  reactExtension,
  Badge,
  BlockSpacer,
  useCartLineTarget,
  useSettings,
  useAttributeValues,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension(
  "purchase.checkout.cart-line-item.render-after",
  () => <LineItemBadge />
);

function LineItemBadge() {
  const { attributes } = useCartLineTarget();

  const [packaging] = useAttributeValues(["Packaging"]);
  const litePackagingSelected = packaging === "lite";

  const checkoutInfo =
    attributes.find((attr) => attr.key === "_checkoutInfo")?.value || "";

  const isPreorder = checkoutInfo.includes("isPreorder");
  const litePackagingAvailable = checkoutInfo.includes("litePackagingAvailable");
  // const litePackagingAvailable = true;
  // const isPreorder = true

  const { preorder_text, lite_packaging_text, lite_packaging_active_text } =
    useSettings();
  const litePackagingText = lite_packaging_text || "Lite™ Packaging Available";
  const litePackagingActiveText =
    lite_packaging_active_text || "Lite™ Packaging Selected";
  const preorderText = preorder_text || "Preorder";

  return (
    <>
      <BlockSpacer spacing="tight" />
      {isPreorder && preorderText && (
        <Badge size="small" icon="clock" accessibilityLabel={preorderText}>
          {preorderText}
        </Badge>
      )}
      {(litePackagingSelected && litePackagingAvailable && litePackagingText) && (
        <>
          {isPreorder && " "}
          <Badge
            size="small"
            tone="subdued"
            icon={"checkmark"}
            accessibilityLabel={litePackagingActiveText}
          >
            {litePackagingActiveText}
          </Badge>
        </>
      )}
    </>
  );
}
