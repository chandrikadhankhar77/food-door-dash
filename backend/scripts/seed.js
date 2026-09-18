import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Restaurant from '../src/models/Restaurant.js';
import MenuCategory from '../src/models/MenuCategory.js';
import FoodItem from '../src/models/FoodItem.js';
import Cart from '../src/models/Cart.js';
import Order from '../src/models/Order.js';
import Review from '../src/models/Review.js';
import Notification from '../src/models/Notification.js';
import Payment from '../src/models/Payment.js';
import Favorite from '../src/models/Favorite.js';
import Promo from '../src/models/Promo.js';

const DEMO_PASSWORD = 'Demo@1234';

const restaurantSeeds = [
  {
    name: 'Spice Route Kitchen',
    description: 'Bold Indian flavors with fresh spices and classic comfort dishes.',
    cuisine: ['Indian', 'Vegetarian'],
    address: { street: '12 Curry Lane', city: 'Austin', state: 'TX', zip: '78701' },
    location: 'Austin',
    coordinates: { lat: 30.2711, lng: -97.7437 },
    openingHours: '10:00',
    closingHours: '22:00',
    image:
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
    priceRange: '$$',
    contact: { phone: '+1-512-555-0101', email: 'spice@example.com' },
    isFeatured: true,
    deliveryFee: 2.99,
    categories: [
      {
        name: 'Starters',
        items: [
          {
            name: 'Samosa Plate',
            description: 'Crispy pastry filled with spiced potatoes and peas.',
            price: 6.99,
            image:
              'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
            isVegetarian: true,
            isPopular: true,
            nutritionalInfo: { calories: 320, protein: 6, carbs: 38, fat: 16 },
            addOns: [
              { name: 'Mint chutney', price: 0.5 },
              { name: 'Extra samosa', price: 2.5 },
            ],
          },
          {
            name: 'Chicken Pakora',
            description: 'Crispy battered chicken bites with chaat masala.',
            price: 8.49,
            image:
              'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&q=80',
            isVegetarian: false,
            nutritionalInfo: { calories: 410, protein: 22, carbs: 24, fat: 24 },
            addOns: [{ name: 'Spicy mayo', price: 0.75 }],
          },
        ],
      },
      {
        name: 'Mains',
        items: [
          {
            name: 'Butter Chicken',
            description: 'Creamy tomato curry with tender chicken.',
            price: 14.99,
            image:
              'https://images.unsplash.com/photo-1603894584372-a73696270ac1?w=600&q=80',
            isPopular: true,
            nutritionalInfo: { calories: 620, protein: 34, carbs: 28, fat: 38 },
            addOns: [
              { name: 'Garlic naan', price: 2.99 },
              { name: 'Extra gravy', price: 1.5 },
            ],
          },
          {
            name: 'Paneer Tikka Masala',
            description: 'Grilled paneer cubes in rich masala sauce.',
            price: 13.49,
            image:
              'https://images.unsplash.com/photo-1565557623262-b51c2513a41f?w=600&q=80',
            isVegetarian: true,
            nutritionalInfo: { calories: 540, protein: 22, carbs: 30, fat: 34 },
            addOns: [{ name: 'Jeera rice', price: 2.49 }],
          },
        ],
      },
    ],
  },
  {
    name: 'Nonna Bella Pizzeria',
    description: 'Wood-fired pizzas, fresh pasta, and Italian classics.',
    cuisine: ['Italian', 'Pizza'],
    address: { street: '88 Olive Ave', city: 'Austin', state: 'TX', zip: '78702' },
    location: 'Austin',
    coordinates: { lat: 30.2625, lng: -97.7242 },
    openingHours: '11:00',
    closingHours: '23:00',
    image:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
    priceRange: '$$',
    contact: { phone: '+1-512-555-0102', email: 'nonna@example.com' },
    isFeatured: true,
    deliveryFee: 3.49,
    categories: [
      {
        name: 'Pizza',
        items: [
          {
            name: 'Margherita',
            description: 'San Marzano tomato, mozzarella, basil.',
            price: 12.99,
            image:
              'https://images.unsplash.com/photo-1574071318508-1cdbab80d264?w=600&q=80',
            isVegetarian: true,
            isPopular: true,
            nutritionalInfo: { calories: 780, protein: 28, carbs: 90, fat: 30 },
            addOns: [
              { name: 'Extra cheese', price: 1.99 },
              { name: 'Gluten-free crust', price: 2.5 },
            ],
          },
          {
            name: 'Pepperoni Feast',
            description: 'Classic pepperoni with oregano and mozzarella.',
            price: 14.49,
            image:
              'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80',
            isPopular: true,
            nutritionalInfo: { calories: 920, protein: 36, carbs: 88, fat: 42 },
            addOns: [{ name: 'Hot honey drizzle', price: 1.25 }],
          },
        ],
      },
      {
        name: 'Pasta',
        items: [
          {
            name: 'Spaghetti Carbonara',
            description: 'Egg, pecorino, guanciale, black pepper.',
            price: 15.99,
            image:
              'https://images.unsplash.com/photo-1612874742237-990107322684?w=600&q=80',
            nutritionalInfo: { calories: 710, protein: 30, carbs: 68, fat: 34 },
            addOns: [{ name: 'Garlic bread', price: 2.99 }],
          },
        ],
      },
    ],
  },
  {
    name: 'Tokyo Bowl',
    description: 'Fresh sushi rolls, ramen bowls, and Japanese street food.',
    cuisine: ['Japanese', 'Sushi'],
    address: { street: '5 Sakura St', city: 'Dallas', state: 'TX', zip: '75201' },
    location: 'Dallas',
    coordinates: { lat: 32.7831, lng: -96.7984 },
    openingHours: '11:30',
    closingHours: '21:30',
    image:
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
    priceRange: '$$$',
    contact: { phone: '+1-214-555-0103', email: 'tokyo@example.com' },
    isFeatured: true,
    deliveryFee: 3.99,
    categories: [
      {
        name: 'Sushi',
        items: [
          {
            name: 'Salmon Avocado Roll',
            description: 'Fresh salmon, avocado, sushi rice, nori.',
            price: 11.99,
            image:
              'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80',
            isPopular: true,
            nutritionalInfo: { calories: 430, protein: 20, carbs: 48, fat: 16 },
            addOns: [
              { name: 'Extra wasabi', price: 0.5 },
              { name: 'Soy glaze', price: 0.75 },
            ],
          },
          {
            name: 'Spicy Tuna Roll',
            description: 'Tuna, spicy mayo, cucumber, sesame.',
            price: 12.49,
            image:
              'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&q=80',
            nutritionalInfo: { calories: 460, protein: 22, carbs: 50, fat: 18 },
            addOns: [{ name: 'Crunchy topping', price: 1.0 }],
          },
        ],
      },
      {
        name: 'Bowls',
        items: [
          {
            name: 'Tonkotsu Ramen',
            description: 'Rich pork broth, chashu, egg, noodles.',
            price: 15.49,
            image:
              'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
            isPopular: true,
            nutritionalInfo: { calories: 680, protein: 32, carbs: 72, fat: 28 },
            addOns: [
              { name: 'Extra chashu', price: 2.99 },
              { name: 'Soft egg', price: 1.5 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Green Fork Cafe',
    description: 'Healthy bowls, salads, and plant-forward comfort food.',
    cuisine: ['Healthy', 'Salads', 'Vegan'],
    address: { street: '44 Kale Blvd', city: 'Austin', state: 'TX', zip: '78704' },
    location: 'Austin',
    coordinates: { lat: 30.2456, lng: -97.7689 },
    openingHours: '08:00',
    closingHours: '20:00',
    image:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    priceRange: '$$',
    contact: { phone: '+1-512-555-0104', email: 'green@example.com' },
    isFeatured: true,
    deliveryFee: 2.49,
    categories: [
      {
        name: 'Bowls',
        items: [
          {
            name: 'Mediterranean Power Bowl',
            description: 'Quinoa, chickpeas, cucumber, feta, lemon tahini.',
            price: 12.99,
            image:
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
            isVegetarian: true,
            isPopular: true,
            nutritionalInfo: { calories: 520, protein: 18, carbs: 58, fat: 22 },
            addOns: [
              { name: 'Grilled chicken', price: 3.5 },
              { name: 'Avocado', price: 1.75 },
            ],
          },
          {
            name: 'Vegan Buddha Bowl',
            description: 'Sweet potato, tofu, greens, sesame dressing.',
            price: 13.49,
            image:
              'https://images.unsplash.com/photo-1511690657104-cdd9d4d0d0e3?w=600&q=80',
            isVegetarian: true,
            nutritionalInfo: { calories: 490, protein: 16, carbs: 62, fat: 18 },
            addOns: [{ name: 'Extra tofu', price: 2.0 }],
          },
        ],
      },
    ],
  },
  {
    name: 'Smokehouse 512',
    description: 'Texas BBQ with smoked brisket, ribs, and classic sides.',
    cuisine: ['BBQ', 'American'],
    address: { street: '901 Pit Rd', city: 'Houston', state: 'TX', zip: '77002' },
    location: 'Houston',
    coordinates: { lat: 29.7589, lng: -95.3677 },
    openingHours: '11:00',
    closingHours: '21:00',
    image:
      'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&q=80',
    priceRange: '$$$',
    contact: { phone: '+1-713-555-0105', email: 'smoke@example.com' },
    isFeatured: true,
    deliveryFee: 3.99,
    categories: [
      {
        name: 'BBQ Plates',
        items: [
          {
            name: 'Brisket Plate',
            description: 'Slow-smoked brisket with pickles and onion.',
            price: 18.99,
            image:
              'https://images.unsplash.com/photo-1558030006-45067559534d?w=600&q=80',
            isPopular: true,
            nutritionalInfo: { calories: 860, protein: 48, carbs: 20, fat: 58 },
            addOns: [
              { name: 'Mac & cheese', price: 3.49 },
              { name: 'Extra sauce', price: 0.75 },
            ],
          },
          {
            name: 'St. Louis Ribs',
            description: 'Half rack glazed ribs with house rub.',
            price: 19.49,
            image:
              'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
            nutritionalInfo: { calories: 940, protein: 44, carbs: 24, fat: 66 },
            addOns: [{ name: 'Cornbread', price: 2.49 }],
          },
        ],
      },
    ],
  },
  {
    name: 'Taco Libre',
    description: 'Street-style tacos, burritos, and fresh salsas.',
    cuisine: ['Mexican', 'Tacos'],
    address: { street: '17 Fiesta Way', city: 'Dallas', state: 'TX', zip: '75204' },
    location: 'Dallas',
    coordinates: { lat: 32.8015, lng: -96.7699 },
    openingHours: '10:00',
    closingHours: '23:00',
    image:
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
    priceRange: '$',
    contact: { phone: '+1-214-555-0106', email: 'taco@example.com' },
    isFeatured: true,
    deliveryFee: 1.99,
    categories: [
      {
        name: 'Tacos',
        items: [
          {
            name: 'Al Pastor Tacos (3)',
            description: 'Marinated pork, pineapple, onion, cilantro.',
            price: 9.99,
            image:
              'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&q=80',
            isPopular: true,
            nutritionalInfo: { calories: 540, protein: 28, carbs: 48, fat: 24 },
            addOns: [
              { name: 'Extra salsa verde', price: 0.5 },
              { name: 'Guacamole', price: 1.99 },
            ],
          },
          {
            name: 'Veggie Burrito',
            description: 'Black beans, rice, grilled veggies, pico.',
            price: 10.49,
            image:
              'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80',
            isVegetarian: true,
            nutritionalInfo: { calories: 620, protein: 18, carbs: 86, fat: 20 },
            addOns: [{ name: 'Cheese', price: 1.0 }],
          },
        ],
      },
    ],
  },
];

const seed = async () => {
  await connectDB();

  console.log('Clearing collections...');
  await Promise.all([
    User.deleteMany({}),
    Restaurant.deleteMany({}),
    MenuCategory.deleteMany({}),
    FoodItem.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
    Notification.deleteMany({}),
    Payment.deleteMany({}),
    Favorite.deleteMany({}),
    Promo.deleteMany({}),
  ]);

  console.log('Creating users...');
  const customer = await User.create({
    name: 'Aarav Sharma',
    email: 'aarav.sharma@fooddash.app',
    password: DEMO_PASSWORD,
    role: 'customer',
    phone: '+1-512-555-0142',
    addresses: [
      {
        label: 'Home',
        street: '214 Riverside Drive',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
        isDefault: true,
      },
    ],
  });

  const admin1 = await User.create({
    name: 'Neha Kapoor',
    email: 'neha.kapoor@fooddash.app',
    password: DEMO_PASSWORD,
    role: 'restaurant_admin',
    phone: '+1-512-555-0188',
  });

  const admin2 = await User.create({
    name: 'Rohan Patel',
    email: 'rohan.patel@fooddash.app',
    password: DEMO_PASSWORD,
    role: 'restaurant_admin',
    phone: '+1-713-555-0166',
  });

  const platformAdmin = await User.create({
    name: 'Ananya Verma',
    email: 'ananya.verma@fooddash.app',
    password: DEMO_PASSWORD,
    role: 'admin',
    phone: '+1-214-555-0199',
  });

  const reviewers = await User.insertMany([
    {
      name: 'Kabir Mehta',
      email: 'kabir.mehta@fooddash.app',
      password: DEMO_PASSWORD,
      role: 'customer',
      phone: '+1-512-555-0211',
    },
    {
      name: 'Isha Nair',
      email: 'isha.nair@fooddash.app',
      password: DEMO_PASSWORD,
      role: 'customer',
      phone: '+1-512-555-0212',
    },
    {
      name: 'Vikram Singh',
      email: 'vikram.singh@fooddash.app',
      password: DEMO_PASSWORD,
      role: 'customer',
      phone: '+1-713-555-0213',
    },
    {
      name: 'Meera Joshi',
      email: 'meera.joshi@fooddash.app',
      password: DEMO_PASSWORD,
      role: 'customer',
      phone: '+1-214-555-0214',
    },
    {
      name: 'Arjun Desai',
      email: 'arjun.desai@fooddash.app',
      password: DEMO_PASSWORD,
      role: 'customer',
      phone: '+1-512-555-0215',
    },
    {
      name: 'Sneha Reddy',
      email: 'sneha.reddy@fooddash.app',
      password: DEMO_PASSWORD,
      role: 'customer',
      phone: '+1-713-555-0216',
    },
  ]);

  const owners = [admin1, admin2, admin1, admin2, admin1, admin2];
  const createdRestaurants = [];
  const allFoodItems = [];

  for (let i = 0; i < restaurantSeeds.length; i++) {
    const seedRest = restaurantSeeds[i];
    const owner = owners[i];
    const { categories, ...restData } = seedRest;

    const restaurant = await Restaurant.create({
      ...restData,
      owner: owner._id,
      isActive: true,
      rating: 0,
      ratingCount: 0,
    });

    if (!owner.restaurant) {
      owner.restaurant = restaurant._id;
      await owner.save();
    }

    createdRestaurants.push(restaurant);

    for (let c = 0; c < categories.length; c++) {
      const catSeed = categories[c];
      const category = await MenuCategory.create({
        restaurant: restaurant._id,
        name: catSeed.name,
        description: `${catSeed.name} at ${restaurant.name}`,
        sortOrder: c,
      });

      for (const itemSeed of catSeed.items) {
        const item = await FoodItem.create({
          restaurant: restaurant._id,
          category: category._id,
          ...itemSeed,
          isAvailable: true,
        });
        allFoodItems.push(item);
      }
    }
  }

  console.log('Creating delivered orders + unique reviewer names...');

  const allReviewers = [customer, ...reviewers];
  const reviewComments = [
    'Amazing flavors and fast delivery!',
    'Great pizza, crust was perfect.',
    'Fresh sushi and generous portions.',
    'Healthy and delicious bowls.',
    'Smoky BBQ done right — will order again.',
    'Tacos were fresh and full of flavor.',
  ];

  const reviewData = [];

  // One approved review per restaurant, each from a different diner
  for (let i = 0; i < createdRestaurants.length; i++) {
    const rest = createdRestaurants[i];
    const reviewer = allReviewers[i % allReviewers.length];
    const item = await FoodItem.findOne({ restaurant: rest._id });
    if (!item) continue;

    const order = await Order.create({
      user: reviewer._id,
      restaurant: rest._id,
      items: [
        {
          foodItem: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
          addOns: [],
        },
      ],
      deliveryAddress: {
        label: 'Home',
        street: `${100 + i} Oak Avenue`,
        city: rest.address?.city || 'Austin',
        state: rest.address?.state || 'TX',
        zip: rest.address?.zip || '78701',
      },
      deliveryType: 'now',
      estimatedDeliveryAt: new Date(Date.now() - 40000000),
      status: 'delivered',
      paymentStatus: 'paid',
      subtotal: item.price,
      deliveryFee: rest.deliveryFee,
      tax: Math.round(item.price * 0.08 * 100) / 100,
      total: Math.round((item.price + rest.deliveryFee + item.price * 0.08) * 100) / 100,
      statusHistory: [
        { status: 'pending', at: new Date(Date.now() - 86400000), note: 'Order created' },
        { status: 'confirmed', at: new Date(Date.now() - 80000000), note: 'Paid' },
        { status: 'preparing', at: new Date(Date.now() - 70000000), note: 'Kitchen started' },
        { status: 'out_for_delivery', at: new Date(Date.now() - 60000000), note: 'On the way' },
        { status: 'delivered', at: new Date(Date.now() - 50000000), note: 'Delivered' },
      ],
    });

    reviewData.push({
      user: reviewer._id,
      restaurant: rest._id,
      order: order._id,
      rating: 4 + (i % 2),
      deliveryRating: 5 - (i % 2),
      comment: reviewComments[i % reviewComments.length],
      moderationStatus: 'approved',
      adminResponse: i === 1 ? 'Thanks for dining with us!' : undefined,
    });
  }

  // Extra reviews on first restaurant so Home can show 3 different names
  const homeExtra = [
    { reviewer: reviewers[0], comment: 'Butter chicken was rich and perfectly spiced.' },
    { reviewer: reviewers[1], comment: 'Loved the samosas and quick delivery.' },
  ];
  for (let i = 0; i < homeExtra.length; i++) {
    const rest = createdRestaurants[0];
    const { reviewer, comment } = homeExtra[i];
    const itemList = await FoodItem.find({ restaurant: rest._id }).skip(i).limit(1);
    const item = itemList[0];
    if (!item) continue;
    const order = await Order.create({
      user: reviewer._id,
      restaurant: rest._id,
      items: [
        {
          foodItem: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
          addOns: [],
        },
      ],
      deliveryAddress: {
        label: 'Home',
        street: `${200 + i} Cedar Lane`,
        city: 'Austin',
        state: 'TX',
        zip: '78702',
      },
      status: 'delivered',
      paymentStatus: 'paid',
      subtotal: item.price,
      deliveryFee: rest.deliveryFee,
      tax: Math.round(item.price * 0.08 * 100) / 100,
      total: Math.round((item.price + rest.deliveryFee + item.price * 0.08) * 100) / 100,
      statusHistory: [{ status: 'delivered', at: new Date(), note: 'Delivered' }],
    });
    reviewData.push({
      user: reviewer._id,
      restaurant: rest._id,
      order: order._id,
      rating: 5,
      deliveryRating: 4 + i,
      comment,
      moderationStatus: 'approved',
    });
  }

  await Review.insertMany(reviewData);

  await Promo.insertMany([
    {
      title: 'Welcome 15% off',
      description: 'New customers save 15% on food subtotal. Use code at checkout.',
      code: 'WELCOME15',
      discountPercent: 15,
      minOrder: 15,
      isActive: true,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Free-ish Friday',
      description: '10% off your food subtotal this weekend.',
      code: 'FRIDAY10',
      discountPercent: 10,
      minOrder: 20,
      isActive: true,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  ]);

  for (const rest of createdRestaurants.slice(0, 4)) {
    const stats = await Review.aggregate([
      { $match: { restaurant: rest._id, moderationStatus: 'approved' } },
      { $group: { _id: '$restaurant', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats[0]) {
      rest.rating = Math.round(stats[0].avg * 10) / 10;
      rest.ratingCount = stats[0].count;
      await rest.save();
    }
  }

  await Notification.create({
    user: customer._id,
    title: 'Welcome to FoodDash',
    message: 'Thanks for joining FoodDash. Explore nearby restaurants and order in minutes.',
    type: 'system',
  });

  await Notification.create({
    user: customer._id,
    title: 'Promo unlocked: WELCOME15',
    message: 'Use code WELCOME15 at checkout for 15% off orders over ₹15.',
    type: 'promo',
  });

  await Notification.create({
    user: customer._id,
    title: 'New restaurant nearby',
    message: 'Spice Route Kitchen just joined FoodDash in Austin. Browse their menu today.',
    type: 'promo',
  });

  await Favorite.create({
    user: customer._id,
    restaurants: [createdRestaurants[0]._id, createdRestaurants[1]._id],
    foodItems: allFoodItems.slice(0, 3).map((f) => f._id),
  });

  console.log('\n========================================');
  console.log('SEED COMPLETE — LOGIN ACCOUNTS');
  console.log('========================================');
  console.log('Customer:          aarav.sharma@fooddash.app / Demo@1234');
  console.log('Restaurant Admin:  neha.kapoor@fooddash.app / Demo@1234');
  console.log('Restaurant Admin2: rohan.patel@fooddash.app / Demo@1234');
  console.log('Platform Admin:    ananya.verma@fooddash.app / Demo@1234');
  console.log('----------------------------------------');
  console.log(`Restaurants: ${createdRestaurants.length}`);
  console.log(`Food items:  ${allFoodItems.length}`);
  console.log(`Reviews:     ${reviewData.length}`);
  console.log('========================================\n');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
