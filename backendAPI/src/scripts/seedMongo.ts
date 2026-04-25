import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

type SeedDocument = {
  moduleName: string;
  embedding: number[];
};

const seedData: Record<string, SeedDocument[]> = {
  beard: [
    { moduleName: 'no_beard', embedding: [0.12, 0.34, 0.56] },
    { moduleName: 'brown_beard', embedding: [0.22, 0.18, 0.49] },
    { moduleName: 'red_beard', embedding: [0.39, 0.27, 0.61] },
  ],
  eyebrows: [
    { moduleName: 'black_round_eyebrows', embedding: [0.11, 0.45, 0.33] },
    { moduleName: 'thin_eyebrows', embedding: [0.28, 0.31, 0.47] },
    { moduleName: 'thick_black_eyebrows', embedding: [0.35, 0.29, 0.52] },
  ],
  eyes: [
    { moduleName: 'brown_eyes', embedding: [0.15, 0.42, 0.57] },
    { moduleName: 'blue_eyes', embedding: [0.32, 0.21, 0.48] },
    { moduleName: 'green_eyes', embedding: [0.26, 0.37, 0.54] },
  ],
  hair: [
    { moduleName: 'black_hair', embedding: [0.12, 0.34, 0.56] },
    { moduleName: 'blonde_hair', embedding: [0.41, 0.22, 0.35] },
    { moduleName: 'brown_hair', embedding: [0.29, 0.47, 0.31] },
  ],
  hair_color: [
    { moduleName: 'black_hair_color', embedding: [0.19, 0.37, 0.52] },
    { moduleName: 'blonde_hair_color', embedding: [0.33, 0.21, 0.46] },
    { moduleName: 'brown_hair_color', embedding: [0.27, 0.43, 0.39] },
  ],
  skin_tone: [
    { moduleName: 'light_skin_tone', embedding: [0.14, 0.29, 0.55] },
    { moduleName: 'medium_skin_tone', embedding: [0.26, 0.34, 0.48] },
    { moduleName: 'dark_skin_tone', embedding: [0.31, 0.22, 0.44] },
  ],
  glasses: [
    { moduleName: 'no_glasses', embedding: [0.11, 0.25, 0.41] },
    { moduleName: 'round_glasses', embedding: [0.23, 0.39, 0.57] },
    { moduleName: 'square_glasses', embedding: [0.35, 0.28, 0.49] },
  ],
  nose: [
    { moduleName: 'round_nose', embedding: [0.14, 0.25, 0.64] },
    { moduleName: 'small_nose', embedding: [0.27, 0.33, 0.51] },
    { moduleName: 'pointy_nose', embedding: [0.36, 0.19, 0.43] },
  ],
  pants: [
    { moduleName: 'blue_pants', embedding: [0.18, 0.39, 0.44] },
    { moduleName: 'black_pants', embedding: [0.31, 0.28, 0.55] },
    { moduleName: 'gray_pants', embedding: [0.24, 0.36, 0.46] },
  ],
  shirt: [
    { moduleName: 'red_shirt', embedding: [0.13, 0.41, 0.58] },
    { moduleName: 'white_shirt', embedding: [0.34, 0.24, 0.49] },
    { moduleName: 'yellow_shirt', embedding: [0.21, 0.38, 0.53] },
  ],
};

const seedMongo = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not set.');
  }

  console.log('[SeedMongo] Connecting to MongoDB');
  await mongoose.connect(mongoUri);
  console.log('[SeedMongo] Connected to MongoDB');

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('MongoDB connection is missing db instance.');
  }

  for (const [collectionName, documents] of Object.entries(seedData)) {
    const collection = db.collection(collectionName);

    await collection.deleteMany({});
    await collection.insertMany(documents);

    console.log(
      `[SeedMongo] Inserted ${documents.length} documents into collection "${collectionName}"`,
    );
  }

  console.log('Seeding completed successfully');
};

void seedMongo()
  .catch((error: unknown) => {
    console.error('[SeedMongo] Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log('[SeedMongo] MongoDB disconnected');
  });
