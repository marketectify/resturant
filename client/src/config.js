// Edit your real business details here (one place)
export const BIZ = {
  name: 'Master Foods & Pakwan Centre',
  short: 'Master Foods',
  tag: 'Karachi ka asli zaiqa',
  phone: '+92 300 0000000',
  phoneTel: '+923000000000',
  whatsapp: '923000000000',
  address: 'Karachi, Pakistan',
  hours: 'Daily 11:00 AM – 1:00 AM',
  map: 'https://www.google.com/maps/search/?api=1&query=Master+foods+%26+Pakwan+centre+Karachi',
  deliveryFee: 180, // used until the server answers; the server's DELIVERY_FEE is the real one
};

// Delivery areas shown in the checkout form
export const AREAS = [
  'Gulshan-e-Iqbal', 'Gulistan-e-Johar', 'North Nazimabad', 'Nazimabad', 'Clifton', 'DHA', 'PECHS', 'Saddar', 'Malir', 'Korangi',
];

export const rs = n => `Rs. ${Number(n)}`;
