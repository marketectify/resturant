// Free-to-use food photos from Unsplash (https://unsplash.com/license), hot-linked.
// An item picture is chosen in this order: the item's own image URL, a file in client/public/menu/,
// the matching photo below, and finally the emoji tile. Add or change entries here as real photos arrive.
const u = id => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=70`;

const P = {
  burger: u('1603508102983-99b101395d1a'), // Nathan Dumlao
  biryani: u('1631515243349-e0cb75fb8d3a'), // Mario Raj
  meatStew: u('1627366422957-3efa9c6df0fc'), // Yubraj Timsina
  pulao: u('1634324092526-91f5e878b72f'), // Eugene Krasnaok
  karahi: u('1768179669433-bd9d52949c20'), // tommao wang
  bbq: u('1626323109697-df55d20f06a8'), // Z Grills Australia
  tikka: u('1599487488170-d11ec9c172f0'), // Hamid Roshaan
  soup: u('1632440722549-692fc6af969e'), // Frank from 5 AM Ramen
  roll: u('1762631383439-18ca3151e825'), // joe boshra
  naan: u('1781332146569-9c5093bc2ca5'), // Zayed Ahmed Zadu
  fries: u('1688978181542-87a886a16fbe'), // Durenne Loris
  salad: u('1773902280003-a769eb447460'), // You Le
  lassi: u('1636044992466-ba190da5d40b'), // nrd
  lime: u('1527661591475-527312dd65f5'), // ShengGeng Lin
};

const RULES = [
  [/burger/i, P.burger],
  [/biryani/i, P.biryani],
  [/haleem|nihari|paye/i, P.meatStew],
  [/pulao/i, P.pulao],
  [/karahi|handi|namkeen gosht/i, P.karahi],
  [/roll/i, P.roll],
  [/soup/i, P.soup],
  [/tikka|kabab|kebab|boti|reshmi/i, P.tikka],
  [/fries/i, P.fries],
  [/salad/i, P.salad],
  [/naan|roti|garlic bread/i, P.naan],
  [/lassi/i, P.lassi],
  [/lime|margarita/i, P.lime],
];
const BY_CAT = { 'Premium Burger': P.burger, 'Bar B.Q. Platter': P.bbq, 'Bar B.Q': P.tikka };

/** Photo URL for a menu item, or '' when we have none (the emoji tile is shown instead). */
export const stockPhoto = item => RULES.find(([re]) => re.test(item.name))?.[1] || BY_CAT[item.cat] || '';
