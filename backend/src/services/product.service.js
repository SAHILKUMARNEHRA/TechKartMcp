import { prisma } from '../config/database.js';

const SEEDED_PRODUCTS = [
  {
    externalId: 'tk-001',
    title: 'Apple MacBook Pro 14" M3',
    description:
      'Apple M3 chip, 18GB RAM, 512GB SSD, Liquid Retina XDR display, 22-hour battery life. Perfect for professionals.',
    price: 189900,
    originalPrice: 209900,
    category: 'laptops',
    brand: 'Apple',
    imageUrl:
      'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310?wid=892&hei=820&fmt=jpeg&qlt=90',
    rating: 4.9,
    reviewCount: 2341,
    stock: 45,
    isFeatured: true,
    specs: {
      processor: 'Apple M3',
      ram: '18GB',
      storage: '512GB SSD',
      display: '14.2" Liquid Retina XDR',
      battery: '22 hours',
      weight: '1.55 kg',
      os: 'macOS Sonoma',
    },
    tags: ['apple', 'laptop', 'premium', 'featured'],
  },
  {
    externalId: 'tk-002',
    title: 'Samsung Galaxy S24 Ultra',
    description:
      'Snapdragon 8 Gen 3, 12GB RAM, 256GB, 200MP camera, built-in S Pen, titanium frame. The ultimate Android flagship.',
    price: 134999,
    originalPrice: 149999,
    category: 'smartphones',
    brand: 'Samsung',
    imageUrl:
      'https://images.samsung.com/is/image/samsung/p6pim/in/2401/gallery/in-galaxy-s24-ultra-s928-sm-s928bzkgins-thumb-539573381?$650_519_PNG$',
    rating: 4.8,
    reviewCount: 5632,
    stock: 120,
    isFeatured: true,
    specs: {
      processor: 'Snapdragon 8 Gen 3',
      ram: '12GB',
      storage: '256GB',
      camera: '200MP',
      display: '6.8" Dynamic AMOLED 2X',
      battery: '5000mAh',
      sPen: true,
    },
    tags: ['samsung', 'smartphone', 'flagship'],
  },
  {
    externalId: 'tk-003',
    title: 'Sony WH-1000XM5 Headphones',
    description:
      'Industry-leading noise cancellation, 30-hour battery, multipoint connection, crystal clear hands-free calling.',
    price: 26990,
    originalPrice: 34990,
    category: 'audio',
    brand: 'Sony',
    imageUrl:
      'https://www.sony.co.in/image/5d02da5df552836db894cead8a68f5f3?fmt=png-alpha&wid=440',
    rating: 4.7,
    reviewCount: 8901,
    stock: 200,
    isFeatured: false,
    specs: {
      type: 'Over-ear',
      connectivity: 'Bluetooth 5.2',
      battery: '30 hours',
      noiseCancellation: 'Active',
      weight: '250g',
      multipoint: true,
    },
    tags: ['sony', 'headphones', 'noise-cancelling'],
  },
  {
    externalId: 'tk-004',
    title: 'NVIDIA GeForce RTX 4080 Super',
    description:
      '16GB GDDR6X, DLSS 3.5, Ada Lovelace architecture, 4K gaming at ultra settings, PCIe 4.0 interface.',
    price: 109999,
    originalPrice: 119999,
    category: 'computers',
    brand: 'NVIDIA',
    imageUrl:
      'https://www.nvidia.com/content/dam/en-zz/Solutions/geforce/ada/rtx-4080-super/geforce-ada-4080-super-web-800-jpg.jpg',
    rating: 4.9,
    reviewCount: 1205,
    stock: 30,
    isFeatured: true,
    specs: {
      vram: '16GB GDDR6X',
      architecture: 'Ada Lovelace',
      tdp: '320W',
      interface: 'PCIe 4.0',
      outputs: '3x DP 1.4a, 1x HDMI 2.1',
    },
    tags: ['nvidia', 'gpu', 'gaming', '4k'],
  },
  {
    externalId: 'tk-005',
    title: 'iPad Pro 12.9" M2 Wi-Fi',
    description:
      'M2 chip, 256GB storage, Liquid Retina XDR display with ProMotion 120Hz, Apple Pencil 2 support.',
    price: 112900,
    originalPrice: 119900,
    category: 'tablets',
    brand: 'Apple',
    imageUrl:
      'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-finish-unselect-gallery-2-202212?wid=720&hei=660&fmt=p-jpg',
    rating: 4.8,
    reviewCount: 3201,
    stock: 80,
    isFeatured: false,
    specs: {
      processor: 'Apple M2',
      storage: '256GB',
      display: '12.9" Liquid Retina XDR',
      refresh: '120Hz ProMotion',
      battery: '10 hours',
      connectivity: 'Wi-Fi 6E',
    },
    tags: ['apple', 'ipad', 'tablet', 'creative'],
  },
  {
    externalId: 'tk-006',
    title: 'Dell XPS 15 Intel Core i9',
    description:
      'Intel Core i9-13900H, 32GB DDR5, 1TB SSD, OLED 3.5K display, NVIDIA RTX 4060, Windows 11 Pro.',
    price: 179990,
    originalPrice: 199990,
    category: 'laptops',
    brand: 'Dell',
    imageUrl:
      'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-15-9530/media-gallery/black/notebook-xps-15-9530-t-black-gallery-5.psd?fmt=pjpg&pscan=auto&scl=1&wid=3491&hei=2621',
    rating: 4.7,
    reviewCount: 876,
    stock: 55,
    isFeatured: true,
    specs: {
      processor: 'Intel Core i9-13900H',
      ram: '32GB DDR5',
      storage: '1TB NVMe SSD',
      display: '15.6" OLED 3.5K',
      gpu: 'NVIDIA RTX 4060',
      os: 'Windows 11 Pro',
    },
    tags: ['dell', 'laptop', 'gaming', 'creator'],
  },
  {
    externalId: 'tk-007',
    title: 'Apple AirPods Pro 2nd Gen',
    description:
      'Active noise cancellation, Adaptive Audio, Conversation Awareness, MagSafe charging case with speaker.',
    price: 24900,
    originalPrice: 26900,
    category: 'audio',
    brand: 'Apple',
    imageUrl:
      'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83?wid=572&hei=572&fmt=jpeg&qlt=95',
    rating: 4.8,
    reviewCount: 12453,
    stock: 300,
    isFeatured: false,
    specs: {
      type: 'In-ear',
      connectivity: 'Bluetooth 5.3',
      battery: '6 hours (30 with case)',
      anc: 'Active Noise Cancellation',
      spatialAudio: true,
      chip: 'H2',
    },
    tags: ['apple', 'airpods', 'earbuds', 'anc'],
  },
  {
    externalId: 'tk-008',
    title: 'Samsung 55" Neo QLED 4K Smart TV',
    description:
      'Neo QLED with Mini LED, Quantum HDR 32x, 120Hz, Game Mode Pro, Object Tracking Sound+.',
    price: 89990,
    originalPrice: 109990,
    category: 'televisions',
    brand: 'Samsung',
    imageUrl:
      'https://images.samsung.com/is/image/samsung/p6pim/in/qa55qn85cakxxl/gallery/in-neo-qled-qn85c-qa55qn85cakxxl-thumb-535867835',
    rating: 4.6,
    reviewCount: 2109,
    stock: 60,
    isFeatured: true,
    specs: {
      size: '55 inches',
      resolution: '4K UHD',
      displayTech: 'Neo QLED Mini LED',
      refresh: '120Hz',
      hdr: 'Quantum HDR 32x',
      smartOs: 'Tizen 7.0',
    },
    tags: ['samsung', 'tv', '4k', 'qled'],
  },
  {
    externalId: 'tk-009',
    title: 'Logitech MX Master 3S Mouse',
    description:
      'Ergonomic wireless mouse with MagSpeed scroll wheel, 8000 DPI, USB-C quick charging, multi-device pairing.',
    price: 9495,
    originalPrice: 10995,
    category: 'accessories',
    brand: 'Logitech',
    imageUrl: 'https://resource.logitech.com/content/dam/logitech/en/products/mice/mx-master-3s/gallery/mx-master-3s-mouse-top-view-graphite.png',
    rating: 4.8,
    reviewCount: 4521,
    stock: 250,
    isFeatured: false,
    specs: {
      type: 'Wireless',
      dpi: '8000',
      battery: '70 days',
      connectivity: 'Bluetooth / USB Receiver',
      buttons: '7',
    },
    tags: ['logitech', 'mouse', 'accessory', 'productivity'],
  },
  {
    externalId: 'tk-010',
    title: 'Keychron K2 Pro Mechanical Keyboard',
    description:
      '75% layout wireless mechanical keyboard, hot-swappable switches, QMK/VIA support, white backlight, aluminum frame.',
    price: 13990,
    originalPrice: 15990,
    category: 'accessories',
    brand: 'Keychron',
    imageUrl: 'https://www.keychron.com/cdn/shop/products/Keychron-K2-Pro-QMK-VIA-wireless-custom-mechanical-keyboard-aluminum-frame-for-Mac-Windows-Linux-with-RGB-backlight-and-hot-swappable-K-Pro-switch.jpg',
    rating: 4.7,
    reviewCount: 1820,
    stock: 90,
    isFeatured: false,
    specs: {
      layout: '75%',
      switches: 'Hot-swappable Gateron',
      connectivity: 'Bluetooth 5.1 / USB-C',
      battery: '4000 mAh',
      backlight: 'White LED',
    },
    tags: ['keychron', 'keyboard', 'mechanical', 'accessory'],
  },
  {
    externalId: 'tk-011',
    title: 'OnePlus 12 5G',
    description:
      'Snapdragon 8 Gen 3, 16GB RAM, 256GB, Hasselblad triple camera, 100W SuperVOOC charging.',
    price: 64999,
    originalPrice: 69999,
    category: 'smartphones',
    brand: 'OnePlus',
    imageUrl: 'https://image01.oneplus.net/ebp/202312/04/1-m00-50-9d-rb8bwmvtklualv6daahgo7twmfa185.png',
    rating: 4.6,
    reviewCount: 3120,
    stock: 140,
    isFeatured: false,
    specs: {
      processor: 'Snapdragon 8 Gen 3',
      ram: '16GB',
      storage: '256GB',
      display: '6.82" QHD+ AMOLED',
      camera: '50MP Hasselblad',
      battery: '5400mAh',
    },
    tags: ['oneplus', 'smartphone', 'flagship'],
  },
  {
    externalId: 'tk-012',
    title: 'Bose QuietComfort Ultra Earbuds',
    description:
      'Immersive Audio with head tracking, world-class ANC, CustomTune sound calibration, IPX4 rated.',
    price: 27900,
    originalPrice: 31900,
    category: 'audio',
    brand: 'Bose',
    imageUrl: 'https://assets.bose.com/content/dam/cloudassets/Bose_DAM/Web/consumer_electronics/global/products/headphones/qc_ultra_earbuds/product_silo_images/QCUE_PDP_Ecom-Gallery-B01.png',
    rating: 4.6,
    reviewCount: 1670,
    stock: 110,
    isFeatured: false,
    specs: {
      type: 'In-ear',
      connectivity: 'Bluetooth 5.3',
      battery: '6 hours (24 with case)',
      anc: 'Active Noise Cancellation',
      waterResistant: 'IPX4',
    },
    tags: ['bose', 'earbuds', 'anc', 'audio'],
  },
];

export async function syncProductsFromAPI() {
  console.log('[Sync] Fetching products...');
  try {
    const res = await fetch('https://fakestoreapi.com/products');
    if (res.ok) {
      const products = await res.json();
      for (const p of products.filter((p) => p.category === 'electronics')) {
        const product = await prisma.product.upsert({
          where: { externalId: String(p.id) },
          update: { price: p.price, rating: p.rating.rate, reviewCount: p.rating.count },
          create: {
            externalId: String(p.id),
            title: p.title,
            description: p.description,
            price: p.price,
            category: p.category,
            imageUrl: p.image,
            rating: p.rating.rate,
            reviewCount: p.rating.count,
          },
        });
        await prisma.priceHistory.create({
          data: { productId: product.id, price: p.price },
        });
      }
    }
  } catch (e) {
    console.error('[Sync] External API failed, using seeded data only:', e.message);
  }

  for (const p of SEEDED_PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { externalId: p.externalId },
      update: { price: p.price, rating: p.rating, reviewCount: p.reviewCount },
      create: p,
    });
    const existing = await prisma.priceHistory.count({ where: { productId: product.id } });
    if (existing < 5) {
      const base = Number(p.price);
      const entries = Array.from({ length: 90 }, (_, i) => ({
        productId: product.id,
        price: Math.round(base * (1 + (Math.random() - 0.45) * 0.12)),
        recordedAt: new Date(Date.now() - (90 - i) * 86400000),
        source: 'historical',
      }));
      await prisma.priceHistory.createMany({ data: entries, skipDuplicates: true });
    }
  }
  console.log('[Sync] Done.');
}
