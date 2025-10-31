import { db } from './db';
import { products } from '@shared/schema';

const seedProducts = async () => {
  console.log('Starting product seed...');
  
  const productData = [
    // Card Themes (8 total)
    {
      name: 'Ghosts Online',
      description: 'Classic digital aesthetic with pixelated ghost motifs. Free for everyone!',
      category: 'card_themes',
      price: 0,
      rarity: 'common',
      productData: { designId: 'ghosts-online', type: 'card_theme' },
      imageUrl: '/assets/cards/ghosts-online.png'
    },
    {
      name: 'Cyberpunk Holographic',
      description: 'Neon-lit futuristic design with holographic effects and circuit patterns.',
      category: 'card_themes',
      price: 1500,
      rarity: 'epic',
      productData: { designId: 'cyberpunk-holographic', type: 'card_theme' },
      imageUrl: '/assets/cards/cyberpunk.png'
    },
    {
      name: 'Vintage Weathered',
      description: 'Aged paper texture with sepia tones and classic typography.',
      category: 'card_themes',
      price: 1200,
      rarity: 'rare',
      productData: { designId: 'vintage-weathered', type: 'card_theme' },
      imageUrl: '/assets/cards/vintage.png'
    },
    {
      name: 'Modern Sleek',
      description: 'Minimalist design with clean lines and contemporary color palette.',
      category: 'card_themes',
      price: 1000,
      rarity: 'rare',
      productData: { designId: 'modern-sleek', type: 'card_theme' },
      imageUrl: '/assets/cards/modern.png'
    },
    {
      name: 'Neon Arcade',
      description: 'Retro gaming aesthetic with vibrant neon colors and pixel art elements.',
      category: 'card_themes',
      price: 1800,
      rarity: 'epic',
      productData: { designId: 'neon-arcade', type: 'card_theme' },
      imageUrl: '/assets/cards/neon.png'
    },
    {
      name: 'Dark Carnival',
      description: 'Gothic carnival theme with mysterious purple hues and ornate details.',
      category: 'card_themes',
      price: 500,
      rarity: 'rare',
      productData: { designId: 'dark-carnival', type: 'card_theme' },
      imageUrl: '/assets/cards/carnival.png'
    },
    {
      name: 'Winter Frost',
      description: 'Icy blue seasonal design with crystalline patterns and snowflakes.',
      category: 'card_themes',
      price: 500,
      rarity: 'rare',
      productData: { designId: 'winter-frost', type: 'card_theme' },
      imageUrl: '/assets/cards/winter.png'
    },
    {
      name: 'Gold Anniversary',
      description: 'Luxurious gold-trimmed design celebrating musical milestones.',
      category: 'card_themes',
      price: 2000,
      rarity: 'legendary',
      productData: { designId: 'gold-anniversary', type: 'card_theme' },
      imageUrl: '/assets/cards/gold.png'
    },
    
    // Managers (3 tiers)
    {
      name: 'Junior Manager',
      description: 'Entry-level talent manager. Boosts sales and streams by 20%.',
      category: 'premium_features',
      price: 3000,
      rarity: 'rare',
      productData: { 
        type: 'manager', 
        tier: 'junior',
        experienceMultiplier: 1.2,
        description: 'Increases physical sales, digital downloads, and streams by 20%'
      },
      imageUrl: '/assets/items/manager-junior.png'
    },
    {
      name: 'Senior Manager',
      description: 'Experienced industry professional. Boosts sales and streams by 50%.',
      category: 'premium_features',
      price: 8000,
      rarity: 'epic',
      productData: { 
        type: 'manager', 
        tier: 'senior',
        experienceMultiplier: 1.5,
        description: 'Increases physical sales, digital downloads, and streams by 50%'
      },
      imageUrl: '/assets/items/manager-senior.png'
    },
    {
      name: 'Top-Tier Manager',
      description: 'Elite music industry mogul. Doubles all sales and streams!',
      category: 'premium_features',
      price: 15000,
      rarity: 'legendary',
      productData: { 
        type: 'manager', 
        tier: 'top',
        experienceMultiplier: 2.0,
        description: 'Doubles physical sales, digital downloads, and streams (2x multiplier)'
      },
      imageUrl: '/assets/items/manager-top.png'
    },
    
    // Producers (3 tiers)
    {
      name: 'Indie Producer',
      description: 'Up-and-coming producer. Boosts FAME growth by 15%.',
      category: 'premium_features',
      price: 2500,
      rarity: 'rare',
      productData: { 
        type: 'producer', 
        tier: 'indie',
        fameMultiplier: 1.15,
        description: 'Increases FAME growth rate by 15%'
      },
      imageUrl: '/assets/items/producer-indie.png'
    },
    {
      name: 'Professional Producer',
      description: 'Seasoned studio expert. Boosts FAME growth by 30%.',
      category: 'premium_features',
      price: 6000,
      rarity: 'epic',
      productData: { 
        type: 'producer', 
        tier: 'professional',
        fameMultiplier: 1.3,
        description: 'Increases FAME growth rate by 30%'
      },
      imageUrl: '/assets/items/producer-pro.png'
    },
    {
      name: 'Grammy-Winning Producer',
      description: 'Award-winning production legend. Boosts FAME growth by 50%!',
      category: 'premium_features',
      price: 12000,
      rarity: 'legendary',
      productData: { 
        type: 'producer', 
        tier: 'grammy',
        fameMultiplier: 1.5,
        description: 'Increases FAME growth rate by 50%'
      },
      imageUrl: '/assets/items/producer-grammy.png'
    },
    
    // Collectible Instruments (5 items)
    {
      name: 'Vintage Stratocaster',
      description: 'Iconic electric guitar from the golden age of rock.',
      category: 'collectibles',
      price: 5000,
      rarity: 'epic',
      productData: { 
        type: 'instrument',
        category: 'guitar',
        era: '1960s'
      },
      imageUrl: '/assets/items/guitar-strat.png'
    },
    {
      name: 'Ludwig Vistalite Drums',
      description: 'Legendary transparent acrylic drum kit used by rock icons.',
      category: 'collectibles',
      price: 7000,
      rarity: 'legendary',
      productData: { 
        type: 'instrument',
        category: 'drums',
        era: '1970s'
      },
      imageUrl: '/assets/items/drums-vistalite.png'
    },
    {
      name: 'Minimoog Synthesizer',
      description: 'Classic analog synth that defined electronic music.',
      category: 'collectibles',
      price: 6000,
      rarity: 'epic',
      productData: { 
        type: 'instrument',
        category: 'keyboard',
        era: '1970s'
      },
      imageUrl: '/assets/items/synth-minimoog.png'
    },
    {
      name: 'Gibson Les Paul Gold Top',
      description: 'Rare gold-finished electric guitar beloved by blues legends.',
      category: 'collectibles',
      price: 8000,
      rarity: 'legendary',
      productData: { 
        type: 'instrument',
        category: 'guitar',
        era: '1950s'
      },
      imageUrl: '/assets/items/guitar-lespaul.png'
    },
    {
      name: 'Fender Jazz Bass',
      description: 'Versatile bass guitar that shaped modern music.',
      category: 'collectibles',
      price: 4000,
      rarity: 'rare',
      productData: { 
        type: 'instrument',
        category: 'bass',
        era: '1960s'
      },
      imageUrl: '/assets/items/bass-jazz.png'
    }
  ];

  try {
    // Clear existing products
    await db.delete(products);
    console.log('Cleared existing products');
    
    // Insert new products
    await db.insert(products).values(productData);
    console.log(`✓ Seeded ${productData.length} products successfully!`);
    
    // Display summary
    console.log('\nProduct Summary:');
    console.log('- Card Themes: 8 (including 1 free)');
    console.log('- Managers: 3 tiers');
    console.log('- Producers: 3 tiers');
    console.log('- Collectibles: 5 instruments');
    console.log('\nTotal: 19 products');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts();
