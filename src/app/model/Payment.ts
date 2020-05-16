import * as StellarSdk from 'stellar-sdk';

export class Payment {
  constructor(public from: string,
              public to: string,
              public amount: string,
              public asset: string,
              public transaction: StellarSdk.Transaction) {}
}
