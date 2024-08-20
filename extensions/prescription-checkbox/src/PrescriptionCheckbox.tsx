import {
  reactExtension,
  Checkbox,
  Text,
  useCartLines,
  useExtensionCapability,
  useBuyerJourneyIntercept,
  useSettings,
  Heading,
  TextBlock,
  BlockSpacer,
} from "@shopify/ui-extensions-react/checkout";
import { useState } from "react";
export default reactExtension("purchase.checkout.block.render", () => (
  <App />
));

function App() {
  const [acknowledged, setAcknowledged] = useState(false);
  const [validationError, setValidationError] = useState("");

  const { title, body, checkbox, error } = useSettings();
  const titleText = title || "Prescription";
  const bodyText =
    body ||
    "To create your Prescription SunGods, we need a copy of your prescription from your optician (dated within the last 2 years). After you've placed your order, we'll email you an upload link so you can share this.";
  const checkboxText =
    checkbox || "I will upload my prescription once I have placed my order";
  const errorText =
    error ||
    "You must acknowledge that your prescription needs to be uploaded in order to progress your order.";

  const cartLines = useCartLines();
  const { isPrescription } = cartLines.reduce(
    (acc, item) => {
      const { attributes } = item;
      const checkoutInfo =
        attributes.find((attr) => attr.key === "_checkoutInfo")?.value || "";

      return {
        isPrescription:
          acc.isPrescription || checkoutInfo.includes("isPrescription"),
      };
    },
    {
      isPrescription: false,
    }
  );

  const canBlockProgress = useExtensionCapability("block_progress");
  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    if (canBlockProgress && isPrescription && !acknowledged) {
      return {
        behavior: "block",
        reason: "Prescription not acknowledged",
        perform: (result) => {
          if (result.behavior === "block") {
            setValidationError(errorText.toString());
          }
        },
      };
    }

    return {
      behavior: "allow",
      perform: () => {
        clearValidationErrors();
      },
    };
  });

  function clearValidationErrors() {
    setValidationError("");
  }

  function handleCheckboxChange() {
    clearValidationErrors();
    setAcknowledged(!acknowledged);
  }

  return (
    <>
      {isPrescription && (
        <>
          <Heading level={1}>{titleText}</Heading>
          <BlockSpacer />
          <TextBlock>{bodyText}</TextBlock>
          {canBlockProgress && (
            <>
              <BlockSpacer />
              <Checkbox
                accessibilityLabel="number"
                checked={acknowledged}
                value={acknowledged}
                onChange={handleCheckboxChange}
                error={validationError}
              >
                <Text>
                  {checkboxText}
                </Text>
              </Checkbox>
            </>
          )}
        </>
      )}
    </>
  );
}
