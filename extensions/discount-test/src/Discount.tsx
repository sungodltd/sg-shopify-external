import {
  reactExtension,
  useDiscountCodes,
  useApplyDiscountCodeChange,
  useSettings
} from "@shopify/ui-extensions-react/checkout";
import CryptoJS from 'crypto-js';
// import legacyDiscounts from './test-codes.json';
import legacyDiscounts from './codes_combined_with_free_shipping.json';
import { useState, useEffect } from "react";

export default reactExtension("purchase.checkout.footer.render-after", () => (
  <Extension />
));

function Extension() {
  const [validCodePresent, setValidCodePresent] = useState<boolean>(false);
  const [freeShippingPresent, setFreeShippingPresent] = useState<boolean>(false);
  const codes = useDiscountCodes()
  const { free_shipping_code } = useSettings();
  const freeShippingCode = free_shipping_code || '+ freeshipping';
  const applyDiscountCodeChange = useApplyDiscountCodeChange();

  useEffect(() => {
    let hasValidCode = false;
    let hasFreeShipping = false;
    if (codes.length > 0) {
      codes.forEach(discount => {
        if (discount.code === freeShippingCode) {
          hasFreeShipping = true
        }
        if (legacyDiscounts.includes(discount.code) || hasValidFreeShippingSuffix(discount.code)) {
          hasValidCode = true;
          return;
        }
      });
    }
    setValidCodePresent(hasValidCode);
    setFreeShippingPresent(hasFreeShipping);
  }, [codes]);

  useEffect(() => {
    if (validCodePresent && !freeShippingPresent) {
      applyDiscountCodeChange({
        code: freeShippingCode,
        type: 'addDiscountCode',
      })
      .catch((error) => {
        console.error('Error applying discount code:', error);
      });
      return
    } else if (
      (!validCodePresent && freeShippingPresent)
    ) {
      applyDiscountCodeChange({
        code: freeShippingCode,
        type: 'removeDiscountCode'
      })
    }
  }, [validCodePresent, freeShippingPresent])
  return;
}

function addFreeShippingSuffix(coupon) {
    const salt = 'FREE_SHIPPING';
    const hash = CryptoJS.MD5(coupon + salt).toString();
    return `${coupon}-${hash.slice(0, 3)}`;
}
function hasValidFreeShippingSuffix(coupon) {
    /**
     * Check if the coupon has a valid free shipping suffix by comparing the suffix
     * to the expected hash of the coupon code and 'FREE_SHIPPING'.
     */
    const parts = coupon.split('-');
    if (parts.length < 2) {
        return false;
    }
    const withoutSuffix = parts.slice(0, -1).join('-');
    const suffix = parts[parts.length - 1];
    const expectedSuffix = CryptoJS.MD5(withoutSuffix + 'FREE_SHIPPING').toString().slice(0, 3);
    return suffix === expectedSuffix;
}