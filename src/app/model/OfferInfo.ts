export class OfferInfo {
  constructor(public requestedMoney: string,
              public buyOfferPrice: string,
              public buyOfferCurrency: string,
              public sellOfferPrice: string,
              public sellOfferCurrency: string,
              public rate: number
  ) {
  }
}
