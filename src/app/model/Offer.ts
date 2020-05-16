import * as StellarSdk from 'stellar-sdk';

export class Offer {
  constructor(public from: string,
              public amount: string,
              public buyingAsset: string,
              public sellingAsset: string,
              public priceSellingIs1Buying: string,
              public priceBuyingIs1Selling: string,
              public transaction: StellarSdk.Transaction) {}
}
