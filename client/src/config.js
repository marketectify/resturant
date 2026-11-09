// Edit your real business details here (one place)
export const BIZ = { name: 'Master Foods & Pakwan Centre', tag: 'Karachi ka asli zaiqa', phone: '+92 300 0000000', whatsapp: '923000000000', address: 'Karachi, Pakistan', hours: 'Daily 11:00 AM – 1:00 AM', map: 'https://www.google.com/maps/search/?api=1&query=Master+foods+%26+Pakwan+centre+Karachi' };
// Shown automatically if the API is not reachable (so the demo never looks empty)
export const DEMO_MENU = [
  ['Chicken Biryani', 'Aromatic basmati, tender chicken, secret masala', 450, 'Rice', '🍛'], ['Beef Biryani', 'Slow-cooked Karachi style, bold & spicy', 520, 'Rice', '🍚'],
  ['Chicken Karahi', 'Wok-fired with tomatoes, ginger & green chilli', 1450, 'Karahi', '🍲'], ['Mutton Karahi', 'Desi ghee, fresh spices, melt-in-mouth mutton', 2400, 'Karahi', '🥘'],
  ['Seekh Kabab', 'Charcoal grilled, juicy minced beef', 380, 'BBQ', '🍢'], ['Chicken Tikka', 'Smoky, marinated overnight', 420, 'BBQ', '🍗'],
  ['Halwa Puri', 'Classic Sunday breakfast with chana & aloo', 350, 'Breakfast', '🥞'], ['Doodh Patti Chai', 'Dum-brewed, creamy, perfect', 100, 'Drinks', '☕'],
].map(([name, desc, price, cat, emoji], i) => ({ _id: 'd' + i, name, desc, price, cat, emoji }));
