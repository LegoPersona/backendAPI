"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
const isDnsResolutionError = (error) => {
    return Boolean(error
        && typeof error === 'object'
        && 'code' in error
        && ['ENOTFOUND', 'EAI_AGAIN'].includes(String(error.code)));
};
const buildDnsResolutionHint = (mongoUri, error) => {
    try {
        const { hostname } = new URL(mongoUri);
        if (hostname === 'mongod' || hostname.endsWith('.search-community')) {
            return [
                `MongoDB hostname \"${hostname}\" could not be resolved (${error.code}).`,
                'This backend is running on your macOS host, not inside the Docker network.',
                'Use localhost or 127.0.0.1 when connecting through the published port 27017.',
            ].join(' ');
        }
        return `MongoDB hostname \"${hostname}\" could not be resolved (${error.code}).`;
    }
    catch {
        return `MongoDB hostname could not be resolved (${error.code}).`;
    }
};
const buildMongoUri = () => {
    return process.env.MONGO_URL || '';
};
const connectDB = async () => {
    const mongoUri = buildMongoUri();
    if (!mongoUri) {
        const message = 'MongoDB connection failed: MONGO_URL is not set.';
        console.error(message);
        throw new Error(message);
    }
    try {
        await mongoose_1.default.connect(mongoUri);
        console.log('MongoDB connected successfully.');
    }
    catch (error) {
        if (isDnsResolutionError(error)) {
            console.error(buildDnsResolutionHint(mongoUri, error));
        }
        console.error('MongoDB connection failed:', error);
        throw error;
    }
};
exports.connectDB = connectDB;
