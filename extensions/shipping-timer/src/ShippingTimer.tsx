import { useEffect, useState } from "react";
import {
  useApi,
  reactExtension,
  Text,
  Banner,
  View,
  SkeletonText,
  useShippingOptionTarget,
  useCartLines,
  useLocalizationCountry,
  useSettings
} from "@shopify/ui-extensions-react/checkout";

import { calculateShipping } from "./calculateShipping";
import { filterByIsoCode, formatData } from "./formatData";

type ShippingContext = 'default' | 'delayedDespatch' | 'preorder' | 'prescription';

const shippingTimer = reactExtension(
  "purchase.checkout.shipping-option-item.render-after",
  () => <ShippingTimer />
);
export {shippingTimer};

const preOrderBanner = reactExtension(
  'purchase.checkout.shipping-option-list.render-after',
  () => <PreorderBanner />,
);
export {preOrderBanner};

const showFakeItems = false;
const fakeCartItems = [
  {
    attributes: [],
  },
  {
    attributes: [
      {
        key: "_checkoutInfo",
        value: "litePackagingAvailable",
      },
    ],
  },
  {
    attributes: [
      {
        key: "_checkoutInfo",
        value: "litePackagingAvailable,isPreorder",
      },
      {
        key: "_despatchDate",
        value: "2024-08-05"
      }
    ],
  },
];

function ShippingTimer() {
  const [productContext, setProductContext] = useState<ShippingContext>("default");
  const [shippingDate, setShippingDate] = useState<string>("");
  const [shipping, setShipping] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [config, setConfig] = useState<any | null>(null);
  const [methods, setMethods] = useState<any>(null);

  const { query } = useApi();
  const { shippingOptionTarget } = useShippingOptionTarget();
  const localization = useLocalizationCountry();
  const cartLines = showFakeItems ? fakeCartItems : useCartLines();

  const fetchData = async () => {
    try {
      const { data, errors } = await query(`
        query {
          config: metaobjects(type:"shipping_config",first:1) {
            nodes {
              handle
              type
              fields {
                key
                value
              }
            }
          }
          methods: metaobjects(type:"shipping_methods",first:250) {
            nodes {
              handle
              type
              fields {
                key
                value
              }
            }
          }
        }
      `);

      if (errors) {
        console.error("Error fetching config:", errors);
        return;
      }

      setConfig(formatData(data.config.nodes[0].fields, 'config'));
      setMethods(filterByIsoCode(data.methods.nodes, localization));
    } catch (error) {
      console.error("Error fetching config:", error);
    }
  };

  

  const updateProductContext = async () => {
    setProductContext("default");
    setShippingDate("");
    setIsLoading(true);

    const {
      isPrescription,
      isPreorder,
      isDelayedDespatch,
      variableDespatchDate,
    } = cartLines.reduce(
      (acc, item) => {
        const { attributes } = item;
        const checkoutInfo =
          attributes.find((attr) => attr.key === "_checkoutInfo")?.value || "";
        const despatchDate = attributes.find(
          (attr) => attr.key === "_despatchDate"
        )?.value;

        return {
          isPrescription:
            acc.isPrescription || checkoutInfo.includes("isPrescription"),
          isPreorder: acc.isPreorder || checkoutInfo.includes("isPreorder"),
          isDelayedDespatch:
            acc.isDelayedDespatch || checkoutInfo.includes("delayedDespatch"),
          // Always let the despatchDate be the latest date
          variableDespatchDate: despatchDate
            ? new Date(despatchDate) > new Date(acc.variableDespatchDate)
              ? despatchDate
              : acc.variableDespatchDate
            : acc.variableDespatchDate,
        };
      },
      {
        isPrescription: false,
        isPreorder: false,
        isDelayedDespatch: false,
        variableDespatchDate: null,
      }
    );

    // prescription with no preorder or delayed despatch
    if (isPrescription && !variableDespatchDate) {
      setProductContext("prescription");
      // delayed despatch or preorder
    } else if (variableDespatchDate) {
      setProductContext(
        isPreorder
          ? "preorder"
          : isDelayedDespatch
          ? "delayedDespatch"
          : "default"
      );
      setShippingDate(variableDespatchDate);
    }

    if (config && methods) {
      try {
        const shippingOptions = await methods.map((item) => ({
          name: item.name,
          type: item.type,
          ...calculateShipping(productContext, shippingDate, config, item)
        }));
        setShipping(shippingOptions);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [query]);

  useEffect(() => {
    updateProductContext();
  }, [cartLines, config, methods]);

  const { code } = shippingOptionTarget;

  if (isLoading) {
    return <SkeletonText inlineSize="base" size="base" />;
  }

  if (shipping) {
    const matchedOption = shipping.find(
      (option) => option.name === code
    );

    return (
      <>
        {(matchedOption && matchedOption.type !== 'Standard') &&
          <>
            <Text size="base">{matchedOption.prefix}</Text>{" "}
            <Text emphasis="bold" size="base" appearance={matchedOption.fastDelivery ? 'success' : 'accent'}>
              {matchedOption.despatchDate}
            </Text>
          </>
        }
        {(matchedOption && matchedOption.type === 'Standard') &&
          <>
            <Text size="base">{matchedOption.prefix}</Text>{" "}
            <Text size="base" appearance="subdued">
              {matchedOption.despatchDate}
            </Text>
          </>
        }
      </>
    );
  }
}

function PreorderBanner() {
  const { preorder_title, preorder_body } = useSettings();
  const preorderTitle = preorder_title || "Your order will be despatched as one shipment once all required parts have been restocked."
  const preorderBody = preorder_body || "You can cancel your pre-order at any time prior to despatch if required."
  const cartLines = showFakeItems ? fakeCartItems : useCartLines();
  const {
    isPreorder
  } = cartLines.reduce(
    (acc, item) => {
      const { attributes } = item;
      const checkoutInfo =
        attributes.find((attr) => attr.key === "_checkoutInfo")?.value || "";

      return {
        isPreorder:
          acc.isPreorder || checkoutInfo.includes("isPreorder")
      };
    },
    {
      isPreorder: false
    }
  );
  return (
    <View
      display={isPreorder ? 'auto' : 'none'}
    >
      <Banner
        status="info"
        title={`${preorderTitle}`}
      >
        {preorderBody}
      </Banner>
    </View>
)}
