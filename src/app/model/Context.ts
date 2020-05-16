import {Asset, Keypair} from 'stellar-sdk';

export class Context {
  constructor(public holdingAccount: Keypair,
              public issuingAccount: Keypair,
              public asset: Asset) {}
}
