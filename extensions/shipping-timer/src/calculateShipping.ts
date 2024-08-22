import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import advancedFormat from "dayjs/plugin/advancedFormat";
import duration from "dayjs/plugin/duration";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);
dayjs.extend(duration);

let countryData;
let shippingConfig;
let fastDelivery = false;
let despatchDate: dayjs.Dayjs;
let delivery: { min: dayjs.Dayjs; max: dayjs.Dayjs };
const timeNow = dayjs().tz("Europe/London");

type ShippingContext = 'default' | 'delayedDespatch' | 'preorder' | 'prescription';

export function calculateShipping(
  context: ShippingContext,
  date: string,
  config: any,
  data: Object
) {
  countryData = data
  shippingConfig = config;
  despatchDate = calculateDespatchDay(date, context);
  delivery = calculateTransit();

  return {
    prefix: calculatePrefix(context),
    despatchDate: calculateDeliveryTitle(delivery),
    fastDelivery
  };
}

function calculateDespatchDay(date: string, context: ShippingContext): dayjs.Dayjs {
  const baseDate = date ? dayjs(date) : timeNow;

  switch (context) {
    case 'delayedDespatch':
      return checkDespatching(baseDate);
    case 'preorder':
      return checkDespatching(baseDate.add(2, 'days'));
    case 'prescription':
      return checkDespatching(baseDate.add(shippingConfig.prescriptionLeadTime, 'days'));
    default:
      const isPastCutoff = Number(timeNow.format("HMM")) >= shippingConfig.shippingCutoff;
      return isPastCutoff ? checkDespatching(timeNow.add(1, 'days')) : checkDespatching(baseDate);
  }
}

function calculateTransit(): { min: dayjs.Dayjs; max: dayjs.Dayjs } {
  return {
    min: transitToDate(countryData.transitMin),
    max: transitToDate(countryData.transitMax)
  };
}

function transitToDate(transit: number): dayjs.Dayjs {
  let datetime = despatchDate;
  while (transit > 0) {
    datetime = datetime.add(1, 'days');
    datetime = checkDelivering(datetime);
    transit -= 1;
  }
  return datetime;
}

function calculateDeliveryTitle(deliveryDates: { min: dayjs.Dayjs; max: dayjs.Dayjs }): string {
  const today = dayjs();
  const daysUntilDelivery = dayjs(deliveryDates.min).diff(today, 'day');
  if (deliveryDates.min.isSame(deliveryDates.max, 'day')) {
    const deliveryDay = deliveryDates.min;

    if (deliveryDay.isSame(today, 'day')) {
      fastDelivery = true;
      return 'Today';
    } else if (deliveryDay.isSame(today.add(1, 'days'), 'day')) {
      fastDelivery = true;
      return 'Tomorrow';
    } else if (daysUntilDelivery < 6) {
      fastDelivery = true;
      return `on ${deliveryDay.format("dddd")}`;
    }
    return `${deliveryDay.format('dddd Do MMMM')}`;
  }
  return `between ${deliveryDates.min.format('dddd Do MMMM')} and ${deliveryDates.max.format('dddd Do MMMM')}`;
}

function checkDespatching(date: dayjs.Dayjs): dayjs.Dayjs {
  date = checkIfWeekend(date);
  
  const formattedDate = date.format("YYYY-MM-DD");
  if (shippingConfig.shippingNonShipDays.includes(formattedDate) ||
      shippingConfig.shippingNonDespatch.includes(formattedDate)) {
    date = date.add(1, "day");
  }
  return checkIfWeekend(date);
}

function checkDelivering(date: dayjs.Dayjs): dayjs.Dayjs {
  date = checkIfWeekend(date);

  const formattedDate = date.format("YYYY-MM-DD");
  if (shippingConfig.shippingNonShipDays.includes(formattedDate)) {
    date = date.add(1, "day");
  }
  return checkIfWeekend(date);
}

function calculatePrefix(context: ShippingContext) {
  if (context === 'default' || context === 'prescription') {
    return 'Get them';
  }
  return `Estimated delivery`;
}

// If the date is a weekend then add a day until it's a weekday
function checkIfWeekend(date: dayjs.Dayjs): dayjs.Dayjs {
  while (date.day() === 0 || date.day() === 6) {
    date = date.add(1, "day");
  }
  return date;
}
