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
  lime: u('1527661591475-527312dd65f5'), // ShengGeng Lin, Vicky Ng, Joshua Ryder
};

const RULES = [[/egg fried/i,P.eggRice],[/chicken fried/i,P.riceEgg2],
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
const BY_CAT = { 'Fried Rice': P.eggRice, 'Premium Burger': P.burger, 'Bar B.Q. Platter': P.bbq, 'Bar B.Q': P.tikka };

// One photo per dish (picked from Unsplash search results by description; swap any entry here, or drop a real
// photo into client/public/menu/ which always wins).
const NAMED = {
  "Zinger Burger": u('1761515397046-44035db91504'),
  "Beef Smash Burger": u('1572802419224-296b0aeee0d9'),
  "Chicken Tikka Burger": u('1766735126781-1b2527043bf0'),
  "Mighty Stack Burger": u('1607013251379-e6eecfffe234'),
  "Crispy Zinger Double": u('1760533536289-9e4106eaf62e'),
  "Grilled Chicken Burger": u('1603508102983-99b101395d1a'),
  "Chicken Biryani 1 Kg": u('1631515243349-e0cb75fb8d3a'),
  "Beef Biryani 1 KG": u('1589302168068-964664d93dc0'),
  "Chicken Biryani": u('1782541370275-6761522e39d1'),
  "Beef Biryani": u('1716550781939-beb7d7247aae'),
  "Chicken Biryani 2 Kg": u('1719239885399-f87d992e0f18'),
  "Beef Biryani 2 Kg": u('1563379091339-03b21ab4a4f8'),
  "Sindhi Biryani": u('1633945274405-b6c8069047b0'),
  "Special Haleem": u('1627366422957-3efa9c6df0fc'),
  "Chicken Haleem": u('1708782344137-21c48d98dfcc'),
  "Beef Haleem 1 Kg": u('1596797038530-2c107229654b'),
  "Mutton Haleem": u('1545247181-516773cae754'),
  "Chicken Pulao": u('1774669063671-1f34847a661d'),
  "Beef Pulao": u('1634324092526-91f5e878b72f'),
  "Yakhni Pulao 1 Kg": u('1771074168439-0083aaac48e7'),
  "Chicken Pulao 1 Kg": u('1516714435131-44d6b64dc6a2'),
  "Chicken Karahi Half": u('1768179669433-bd9d52949c20'),
  "Chicken Karahi Full": u('1603496987351-f84a3ba5ec85'),
  "Mutton Karahi Half": u('1694579740719-0e601c5d2437'),
  "Namkeen Gosht": u('1534939561126-855b8675edd7'),
  "Beef Karahi Half": u('1559203244-78de52adba0e'),
  "Beef Karahi Full": u('1708782340793-ec5f2159a689'),
  "Mutton Karahi Full": u('1708782344490-9026aaa5eec7'),
  "Chicken Handi Half": u('1764304733301-3a9f335f0c67'),
  "Chicken White Karahi Half": u('1716535232842-d10da4eb33d5'),
  "Special BBQ Platter": u('1626323109697-df55d20f06a8'),
  "Family BBQ Platter": u('1778449588437-97bd47f88276'),
  "Behari Platter": u('1781332151269-adfdc2a1c3c2'),
  "Chicken Tikka Chest": u('1599487488170-d11ec9c172f0'),
  "Chicken Tikka Leg": u('1775039983787-3fe9b416c545'),
  "Seekh Kabab": u('1781332146555-5507a0fc9bc9'),
  "Chicken Malai Boti": u('1772730064970-a7b2735c93b9'),
  "Behari Kabab": u('1705359573325-f2006d5e459f'),
  "Chicken Reshmi Kabab": u('1641873933980-fcff60026f50'),
  "Beef Boti": u('1555939594-58d7cb561ad1'),
  "Chicken Tikka Boti": u('1781334266250-a7e72fdf539f'),
  "Gola Kabab": u('1610057099431-d73a1c9d2f2f'),
  "Chicken Manchurian": u('1693820488674-4f8c98fbc0f9'),
  "Chicken Chilli Dry": u('1567529854970-ce2c4207e242'),
  "Chicken Shashlik": u('1524239077444-27413e763bba'),
  "Chicken Chowmein": u('1772729219168-af0f0e57bb9c'),
  "Vegetable Chowmein": u('1634864572865-1cf8ff8bd23d'),
  "Chicken Garlic Sauce": u('1758979690131-11e2aa0b142b'),
  "Singaporean Rice": u('1757445060049-0531425f8643'),
  "Singaporean Special": u('1783196736270-d08d63485303'),
  "Egg Fried Rice": u('1627308595186-e6bb36712645'),
  "Chicken Fried Rice": u('1600326145359-3a44909d1a39'),
  "Vegetable Fried Rice": u('1603133872878-684f208fb84b'),
  "Chicken Corn Soup": u('1547592166-23ac45744acd'),
  "Hot & Sour Soup": u('1620791144170-8a443bf37a33'),
  "Wonton Soup": u('1632440722549-692fc6af969e'),
  "Chicken Chatni Roll": u('1762631383439-18ca3151e825'),
  "Beef Chatni Roll": u('1719282431565-3b30bb7d2658'),
  "Paratha Roll Deal": u('1760888549051-f1109fb8de8c'),
  "Zinger Paratha Roll": u('1699728088614-7d1d4277414b'),
  "Seekh Kabab Roll": u('1562059390-a761a084768e'),
  "Halwa Puri": u('1788602564560-9bcbf0f9acb6'),
  "Aloo Paratha": u('1788538397295-41114c76044d'),
  "Nashta Nihari": u('1565557623262-b51c2513a641'),
  "Anda Paratha": u('1683533743190-89c9b19f9ea6'),
  "Chana Puri": u('1654199903998-e49181b41a95'),
  "Paye": u('1710091691771-96b2e6d17dac'),
  "Mayo Garlic": u('1476718406336-bb5a9690ee2a'),
  "Puri Paratha": u('1708783741187-ff1d081d87da'),
  "Raita": u('1571212515416-fef01fc43637'),
  "Garlic Bread": u('1611107415406-1c12f8cda424'),
  "Naan": u('1781332146569-9c5093bc2ca5'),
  "Fresh Salad": u('1773902280003-a769eb447460'),
  "French Fries": u('1688978181542-87a886a16fbe'),
  "Roghni Naan": u('1640625314547-aee9a7696589'),
  "Tandoori Roti": u('1707424963059-6a7a559cae28'),
  "Doodh Patti Chai": u('1759530539862-5f8ce627d930'),
  "Mint Margarita": u('1527661591475-527312dd65f5'),
  "Sweet Lassi": u('1636044992466-ba190da5d40b'),
  "Soft Drink 1.5 L": u('1624552184280-9e9631bbeee9'),
  "Fresh Lime Soda": u('1692620609860-be6717812f71'),
  "Cold Coffee": u('1461023058943-07fcbe16d735'),
  "Mineral Water": u('1561041695-d2fadf9f318c'),
  "Kheer": u('1777613112969-d7511ddfbe15'),
  "Gulab Jamun (2 Pcs)": u('1758910536889-43ce7b3199fd'),
  "Gajar Ka Halwa": u('1517244683847-7456b63c5969'),
  "Kulfi": u('1758221617148-7d019e8e3388'),
};

/** Photo URL for a menu item, or '' when we have none (the emoji tile is shown instead). */
export const stockPhoto = item => NAMED[item.name] || RULES.find(([re]) => re.test(item.name))?.[1] || BY_CAT[item.cat] || '';
