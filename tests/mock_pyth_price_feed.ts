import { PublicKey, Keypair } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
const { BN } = anchor;

// This is a simplified mock of the Pyth price feed
// In a real test, you would use a real Pyth price feed account
export class MockPythPriceFeed {
  private price: number;
  private expo: number;
  private slot: number;
  
  constructor(price: number = 100, expo: number = -2, slot: number = 0) {
    this.price = price;
    this.expo = expo;
    this.slot = slot;
  }
  
  // Get the current price
  getPrice(): { price: number; expo: number } {
    return {
      price: this.price,
      expo: this.expo,
    };
  }
  
  // Get the price no older than the given slot
  getPriceNoOlderThan(maxAge: number, currentSlot: number): { price: number; expo: number } | null {
    if (currentSlot - this.slot > maxAge) {
      return null;
    }
    
    return {
      price: this.price,
      expo: this.expo,
    };
  }
  
  // Update the price
  updatePrice(price: number, slot: number): void {
    this.price = price;
    this.slot = slot;
  }
}

// Create a mock Pyth price feed account
export function createMockPythPriceFeedAccount(
  price: number = 100,
  expo: number = -2,
  slot: number = 0
): { account: PublicKey; keypair: Keypair; mock: MockPythPriceFeed } {
  const keypair = Keypair.generate();
  const mock = new MockPythPriceFeed(price, expo, slot);
  
  return {
    account: keypair.publicKey,
    keypair,
    mock,
  };
} 