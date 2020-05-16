export class Transaction {
  constructor(public type: string,
              public sequence: string,
              public source: string,
              public destination: string,
              public amount: string,
              public assetCode: string,
              public assetIssuer: string) {}
}
