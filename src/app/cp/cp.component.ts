import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import * as StellarSdk from 'stellar-sdk';
import {ServerApi, Keypair, Asset, Server, TransactionBuilder, BASE_FEE, Networks, Operation, Account} from 'stellar-sdk';
import AccountRecord = ServerApi.AccountRecord;
import {MatPaginator, MatSort, MatTableDataSource} from '@angular/material';
import {Payment} from '../model/Payment';
import {Offer} from '../model/Offer';
import {Transaction} from '../model/Transaction';
import {OfferInfo} from '../model/OfferInfo';
import {Context} from '../model/Context';
import {StagesColor} from '../model/StagesColor';
import {SpinnerActions} from '../model/SpinnerActions';

@Component({
  selector: 'app-cp',
  templateUrl: './cp.component.html',
  styleUrls: ['./cp.component.css']
})
export class CpComponent implements OnInit, AfterViewInit {
  server = new Server('https://horizon-testnet.stellar.org');
  accountNames = ['Alice', 'Bob', 'John', 'Grace', 'Emma', 'James', 'Anna', 'Kevin', 'Sarah', 'Brian', 'Jane', 'Carl'];
  accountPrivateKeys: string[] = [];
  accountStages: StagesColor[] = [];
  stages: string[] = ['createIssuingAccount', 'createHoldingAccount', 'createAsset', 'createTrust', 'paymentFromIToH',
  'limitTokenSupply', 'addSigner', 'createSellOfferFromH', 'removeSellOfferFromHx', 'createBuyOfferFromHx', 'paymentFromHToA',
  'paymentFromAToH', 'createBuyOfferFromH'];
  accounts: AccountRecord[] = [];
  spinnerActions: SpinnerActions[] = [];
  offers: OfferInfo[] = [];
  offersInNetwork: any[] = [];
  accountContext: Context[] = new Array(this.accountNames.length);
  offerCreators: number[] = [];
  transactionTable: Transaction[] = [];
  dataSource: MatTableDataSource<Transaction>;
  assets = new Map();
  assetNames: string[] = [];
  trustLines = new Map<string, Map<string, Keypair>>();
  displayedColumns: string[] = ['type',
    'sequence', 'source', 'destination', 'amount', 'assetCode',
    'assetIssuer'];
  progressBarValue = false;
  originAccount: { publicKey: string, privateKey: string } = {
    publicKey: '',
    privateKey: '',
  };
  oracleAccount: { publicKey: string, privateKey: string } = {
    publicKey: '',
    privateKey: '',
  };

  @ViewChild(MatPaginator, {static: false}) private paginator: MatPaginator;
  @ViewChild(MatSort, {static: false}) private sort: MatSort;
  constructor() {
    console.log(this.stages);
    this.dataSource = new MatTableDataSource(this.transactionTable);
    this.assets.set('XLM', Asset.native());
    for (const name of this.accountNames) {
      this.accountStages.push(new StagesColor());
      this.spinnerActions.push(new SpinnerActions());
    }
    this.originAccount = {
      publicKey: 'GDJ5JBCTMU3Y3ERELXTTT64GRMGCH3AHFXNTUDEZOXZWXPN66PVCO3RA',
      privateKey: 'SAXAVCPXWXNAWLPNQ6VPAF2W24NJETT6TCFSQSLRAU6TUMGVJDP63EZN'
    };
    this.oracleAccount = {
      publicKey: 'GAXED263GOL5QXBPD2FVMWIFYKGBPI5YBANBW5A452C5NSRXKFU7WJLB',
      privateKey: 'SBIVSG47BDEN74PIPV4SPGAPQR22XEBZBOA4AKYJYBTLWACKPJKS47VM'
    };
  }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    this.addTableObjects();
  }

  asIsOrder(a, b) {
    return 1;
  }

  updateAssets() {
    this.assetNames = Array.from(this.assets.keys());
  }

  getAssetName(): string {
    return this.assetNames.find(item => item.startsWith('Alice'));
  }

  f1() {
    console.log(1);
    this.f2('not null');
    console.log(2);
    console.log(this.trustLines);
    this.f2();
  }

  f2(str?: string) {
    if (str == null) {
      str = 'null change 3';
      console.log(str);
    } else {
      console.log(str);
    }
  }

  addToTransactionTable(transaction: StellarSdk.Transaction) {
    for (const offer of transaction.operations) {
      this.transactionTable.push(new Transaction(
        offer.type,
        transaction.sequence,
        transaction.source.substr(0, 5),
        'destination' in offer ? offer.destination.substr(0, 5) : '-',
        'amount' in offer ? parseFloat(offer.amount).toFixed(2) : '-',
        'asset' in offer ? offer.asset.code : '-',
        'asset' in offer && offer.asset.code !== 'XLM' ? offer.asset.issuer.substr(0, 5) : '-'));
    }
    this.dataSource.data = this.transactionTable;
    this.addTableObjects();
    this.dataSource.sortingDataAccessor = (t, colName) => {
      switch (colName) {
        case 'source': {
          return t.source ? t.source : null;
        }
        case 'destination': {
          return t.destination ? t.destination : null;
        }
        case 'assetIssuer': {
          return t.assetIssuer ? t.assetIssuer : null;
        }
      }
    };
  }

  private addTableObjects() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  async createAccount(sourceAccount: string, accountId?: number, startBalance?: string) {
    let balance = startBalance;
    const destination = Keypair.random();
    let sourceKeys = Keypair.fromSecret(this.originAccount.privateKey);
    if (sourceAccount === 'origin') {
      balance = '100';
      this.progressBarValue = true;
    } else {
      sourceKeys = Keypair.fromSecret(sourceAccount);
    }
    const account = await this.server.loadAccount(sourceKeys.publicKey());
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(Operation.createAccount({
        destination: destination.publicKey(),
        startingBalance: balance
      }))
      .setTimeout(30)
      .build();
    transaction.sign(sourceKeys);
    await this.server.submitTransaction(transaction);
    this.addToTransactionTable(transaction);
    if (sourceAccount === 'origin') {
      await this.setAccount(destination);
    } else {
      await this.updateAccount(accountId);
      return destination;
    }
    this.offers.push(new OfferInfo('0', '0', '0', '0', '0', 0,0,0));
  }

  setAccount(keypair: Keypair) {
    const publicKey = keypair.publicKey();
    console.log('setAccount');
    return this.server
      .accounts()
      .accountId(publicKey)
      .call()
      .then(account => {
        this.accounts.push(account);
        this.accountPrivateKeys.push(keypair.secret());
        this.progressBarValue = false;
      })
      .catch(error => {
        console.log('setAccount Error' + error);
      });
  }

  updateAccount(id: number) {
    console.log('updateAccount');
    const publicKey = this.accounts[id].id;
    return this.server
      .accounts()
      .accountId(publicKey)
      .call()
      .then(account => {
        this.accounts[id] = account;
      })
      .catch(error => {
        console.log('updateAccount Error' + error);
      });
  }

  async getMoney(accountId: number) {
    this.spinnerActions[accountId].get = true;
    console.log('getMoney');
    const r = this.offers[accountId].rate;
    const amount = this.offers[accountId].requestedMoney;
    const issuingAccount = await this.createAccount(this.accountPrivateKeys[accountId], accountId, '2');
    this.accountStages[accountId].createIssuingAccount = '#b9f6ca';
    const holdingAccount = await this.createAccount(this.accountPrivateKeys[accountId], accountId, '5'); // '2.0000300' '3'
    this.accountStages[accountId].createHoldingAccount = '#b9f6ca';
    const sourceAccount = Keypair.fromSecret(this.accountPrivateKeys[accountId]);
    const debtAsset = new Asset(
      this.accountNames[accountId] + Math.floor(Math.random() * 100),
      issuingAccount.publicKey()
    );
    this.accountContext[accountId] = {asset: debtAsset, holdingAccount, issuingAccount};
    this.assets.set(debtAsset.code, debtAsset);
    this.updateAssets();
    this.accountStages[accountId].createAsset = '#b9f6ca';
    await this.createTrust(holdingAccount, debtAsset);
    this.accountStages[accountId].createTrust = '#b9f6ca';
    await this.paymentFromIToH(accountId, amount, issuingAccount, holdingAccount, debtAsset.code); // i -> h
    this.accountStages[accountId].paymentFromIToH = '#b9f6ca';
    await this.limitTokenSupply(issuingAccount);
    this.accountStages[accountId].limitTokenSupply = '#b9f6ca';
    await this.addSigner(holdingAccount, accountId);
    this.accountStages[accountId].addSigner = '#b9f6ca';
    await this.createSellOfferFromH(accountId, amount, holdingAccount, debtAsset, '1');
    this.accountStages[accountId].createSellOfferFromH = '#b9f6ca';
    await this.createSellOfferFromH(accountId, '0', holdingAccount, debtAsset, '1');
    this.accountStages[accountId].removeSellOfferFromHx = '#b9f6ca';
    await this.createBuyOfferFromH(accountId, amount, 'XLM', debtAsset.code, '1', holdingAccount, true, 1); // not-submitted
    this.accountStages[accountId].createBuyOfferFromHx = '#b9f6ca';
    await this.paymentFromHToA(accountId, amount, holdingAccount, sourceAccount, 'XLM'); // not-submitted h -> a
    this.accountStages[accountId].paymentFromHToA = '#b9f6ca';
    await this.paymentFromAToH(accountId, (parseFloat(amount) * (1 + r)).toString(), sourceAccount, holdingAccount, 'XLM'); // a -> h
    this.accountStages[accountId].paymentFromAToH = '#b9f6ca';
    await this.createBuyOfferFromH(accountId, amount, 'XLM', debtAsset.code, (1 + r).toString(), holdingAccount, false, 1); // not-submitted
    this.accountStages[accountId].createBuyOfferFromH = '#b9f6ca';
    this.spinnerActions[accountId].get = false;
  }

  async createTrust(accountKeypair: Keypair,
                    asset: Asset) {
    console.log('createTrust');
    const account = await this.server.loadAccount(accountKeypair.publicKey());
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(Operation.changeTrust({
        asset,
      }))
      .setTimeout(30)
      .build();
    transaction.sign(accountKeypair);
    await this.server.submitTransaction(transaction);
    if (! this.trustLines.get(asset.code)) {
      this.trustLines.set(asset.code, new Map([[accountKeypair.publicKey(), accountKeypair]]));
    } else {
      this.trustLines.get(asset.code).set(accountKeypair.publicKey(), accountKeypair);
    }
  }

  async payment(amount: string,
                sourceAccount: Keypair,
                destinationAccount: Keypair,
                assetCurrency: string,
                timeout: number) {
    console.log('payment');
    const asset = this.assets.get(assetCurrency);
    const source = await this.server.loadAccount(sourceAccount.publicKey());
    return new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(Operation.payment({
        destination: destinationAccount.publicKey(),
        asset,
        amount
      }))
      .setTimeout(timeout)
      .build();
  }

  async paymentFromIToH(accountId: number, amount: string, issuingAccount: Keypair, holdingAccount: Keypair, assetCurrency: string) {
    console.log('paymentFromItoH');
    const transaction = await this.payment(amount, issuingAccount, holdingAccount, assetCurrency, 30);
    transaction.sign(issuingAccount);
    await this.server.submitTransaction(transaction);
    this.addToTransactionTable(transaction);
  }

  async limitTokenSupply(issuingAccount: Keypair) {
    console.log('limitTokenSupply');
    const issuingAccountPublicKey = await this.server.loadAccount(issuingAccount.publicKey());
    const transaction = new TransactionBuilder(issuingAccountPublicKey, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(Operation.setOptions({
        signer: {
          ed25519PublicKey: this.oracleAccount.publicKey,
          weight: 1
        }
      }))
      .addOperation(Operation.setOptions({
        masterWeight: 0,
        lowThreshold: 1,
        medThreshold: 1,
        highThreshold: 1
      }))
      .setTimeout(30)
      .build();
    transaction.sign(issuingAccount);
    await this.server.submitTransaction(transaction);
    this.addToTransactionTable(transaction);
  }

  async addSigner(keypair: Keypair, accountId: number) {
    console.log('addSigner');
    const sourceKeys = Keypair.fromSecret(keypair.secret());
    const source = await this.server.loadAccount(keypair.publicKey());
    const transaction = new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(Operation.setOptions({
        signer: {
          ed25519PublicKey: this.oracleAccount.publicKey,
          weight: 1
        }
      }))
      .addOperation(Operation.setOptions({
        signer: {
          ed25519PublicKey: this.accounts[accountId].id,
          weight: 1
        }
      }))
      .addOperation(Operation.setOptions({
        masterWeight: 0,
        lowThreshold: 2,
        medThreshold: 2,
        highThreshold: 2
      }))
      .setTimeout(30)
      .build();
    transaction.sign(sourceKeys);
    await this.server.submitTransaction(transaction);
    this.addToTransactionTable(transaction);
  }

  async createSellOffer(amount: string,
                        sourceAccount: Keypair,
                        sellingAsset: Asset,
                        buyingAsset: Asset,
                        priceBuyingIs1Selling: string,
                        timeout: number,
                        offerId: number) {
    console.log('createSellOffer');
    const source = await this.server.loadAccount(sourceAccount.publicKey());
    return new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(Operation.manageSellOffer({
        selling: sellingAsset,
        buying: Asset.native(),
        amount,
        price: priceBuyingIs1Selling,
        offerId
      }))
      .setTimeout(timeout)
      .build();
  }

  async createSellOfferFromH(accountId: number,
                             amount: string,
                             holdingAccount: Keypair,
                             asset: Asset,
                             priceBuyingIs1Selling: string) {
    console.log('createSellOfferFromH');
    let transaction;
    if (amount !== '0') {
      transaction = await this.createSellOffer(amount, holdingAccount, asset, Asset.native(), priceBuyingIs1Selling, 30, 0);
    } else {
      const offer = await this.server.offers('accounts', holdingAccount.publicKey()).call();
      const offerId = typeof offer.records[0].id === 'string' ? parseInt(offer.records[0].id, 10) : offer.records[0].id;
      transaction = await this.createSellOffer(amount, holdingAccount, asset, Asset.native(), priceBuyingIs1Selling, 0, offerId);
    }
    transaction.sign(Keypair.fromSecret(this.accountPrivateKeys[accountId]));
    transaction.sign(Keypair.fromSecret(this.oracleAccount.privateKey));
    let status = 'not-submitted';
    if (amount !== '0') {
      await this.server.submitTransaction(transaction);
      this.addToTransactionTable(transaction);
      status = 'submitted';
    }
    /*this.server.payments().call();
    const offer = await this.server.offers('accounts', holdingAccount.publicKey()).call();
    this.offersInNetwork.push(['Sell Offer', offer.records[0], 'submitted', transaction.sequence]);
    this.offerCreators.push(accountId);*/
    this.offersInNetwork.push([
      'Sell Offer',
      new Offer(this.accountNames[accountId] + ' Holding Account',
        amount,
        'XLM',
        asset.code,
        '',
        priceBuyingIs1Selling,
        transaction),
      status,
      false]);
    this.offerCreators.push(accountId);
  }

  async paymentFromAToH(accountId: number,
                        amount: string,
                        sourceAccount: Keypair,
                        destinationAccount: Keypair,
                        assetCurrency: string) {
    console.log('paymentFromAToH');
    const transaction = await this.payment(amount, sourceAccount, destinationAccount, assetCurrency, 0);
    transaction.sign(sourceAccount);
    this.offersInNetwork.push(['Payment',
      new Payment(this.accountNames[accountId],
        this.accountNames[accountId] + ' Holding Account',
        amount,
        assetCurrency,
        transaction),
      'not-submitted',
    false]);
    this.offerCreators.push(accountId);
  }

  async submitTransaction(transaction: StellarSdk.Transaction, fromAccountName: string, toAccountName: string, i: number) {
    this.offersInNetwork[i][this.offersInNetwork[i].length - 1] = true;
    let accountId;
    if (fromAccountName.includes('Holding Account')) {
      accountId = this.accountNames.indexOf(toAccountName);
    } else {
      accountId = this.accountNames.indexOf(fromAccountName);
    }
    await this.server.submitTransaction(transaction);
    this.addToTransactionTable(transaction);
    await this.updateAccount(accountId);
    console.log(transaction);
    this.offersInNetwork[i][this.offersInNetwork[i].length - 1] = false;
  }

  async submitClick(transaction: StellarSdk.Transaction, i: number) {
    this.offersInNetwork[i][this.offersInNetwork[i].length - 1] = true;
    await this.submit(transaction);
    this.offersInNetwork[i][this.offersInNetwork[i].length - 1] = false;
  }

  async submitClickBuy(transaction: StellarSdk.Transaction, overwrite: boolean, offer: Offer, accountId: number, i: number) {
    this.offersInNetwork[i][this.offersInNetwork[i].length - 1] = true;
    await this.submit(transaction, overwrite, offer, accountId);
    this.offersInNetwork[i][this.offersInNetwork[i].length - 1] = false;
  }

  async submit(transaction: StellarSdk.Transaction, overwrite?: boolean, offer?: Offer, accountId?: number) {
    if (overwrite) {
      const sellingAsset = this.assets.get(offer.sellingAsset);
      const buyingAsset = this.assets.get(offer.buyingAsset);
      let amount = offer.amount;
      await this.server.accounts().accountId(this.accountContext[accountId].holdingAccount.publicKey())
        .call().then(account => {
          for (const asset of account.balances) {
            console.log(asset.asset_type);
            if (asset.asset_type === 'native') {
              amount = (parseInt(asset.balance, 10) - 4).toString();
              console.log(amount);
              break;
            }
          }
        });
      transaction = await this.createBuyOffer(amount, this.accountContext[accountId].holdingAccount, sellingAsset, buyingAsset, '1', 30);
      transaction.sign(Keypair.fromSecret(this.accountPrivateKeys[accountId]));
      transaction.sign(Keypair.fromSecret(this.oracleAccount.privateKey));
    }
    await this.server.submitTransaction(transaction);
    this.addToTransactionTable(transaction);
    console.log(transaction);
  }

  async paymentFromHToA(accountId: number,
                        amount: string,
                        sourceAccount: Keypair,
                        destinationAccount: Keypair,
                        assetCurrency: string) {
    console.log('paymentFromHToA');
    const transaction = await this.payment(amount, sourceAccount, destinationAccount, assetCurrency, 0);
    transaction.sign(destinationAccount);
    transaction.sign(Keypair.fromSecret(this.oracleAccount.privateKey));
    this.offersInNetwork.push(['Payment',
      new Payment(this.accountNames[accountId] + ' Holding Account',
        this.accountNames[accountId],
        amount,
        assetCurrency,
        transaction),
      'not-submitted',
    false]);
    this.offerCreators.push(accountId);
  }

  async createBuyOffer(amount: string,
                       sourceAccount: Keypair,
                       sellingAsset: Asset,
                       buyingAsset: Asset,
                       priceSellingIs1Buying: string,
                       timeout: number,
                       sequence?: number) {
    console.log('createBuyOffer');
    let source: any;
    source = await this.server.loadAccount(sourceAccount.publicKey());
    if (sequence != null) {
      source = new StellarSdk.Account(sourceAccount.publicKey(), (parseInt(source.sequence, 10) + sequence).toString());
    }
    return new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(Operation.manageBuyOffer({
        selling: sellingAsset,
        buying: buyingAsset,
        buyAmount: amount,
        price: priceSellingIs1Buying,
        offerId: 0
      }))
      .setTimeout(timeout)
      .build();
  }

  async createBuyOfferFromA(accountId: number,
                            amount: string,
                            sellingCurrency: string,
                            buyingCurrency: string,
                            priceSellingIs1Buying: string) {
    this.spinnerActions[accountId].buy = true;
    console.log('createBuyOfferFromA');
    const sellingAsset = this.assets.get(sellingCurrency);
    const buyingAsset = this.assets.get(buyingCurrency);
    const sourceAccountKeyPair = Keypair.fromSecret(this.accountPrivateKeys[accountId]);
    if (sellingCurrency !== 'XLM') {
      await this.createTrust(sourceAccountKeyPair, sellingAsset);
    }
    if (buyingCurrency !== 'XLM') {
      await this.createTrust(sourceAccountKeyPair, buyingAsset);
    }
    const transaction = await this.createBuyOffer(
      amount,
      sourceAccountKeyPair,
      sellingAsset,
      buyingAsset,
      priceSellingIs1Buying,
      30
    );
    transaction.sign(sourceAccountKeyPair);
    await this.server.submitTransaction(transaction);
    this.addToTransactionTable(transaction);
    let offerCreatorAccountId;
    for (let i = 0; i < this.offerCreators.length; i++) {
      if (this.offersInNetwork[i][1].sellingAsset === buyingCurrency) {
        this.offersInNetwork[i][1].amount = (parseFloat(this.offersInNetwork[i][1].amount) - parseFloat(amount)).toString();
        offerCreatorAccountId = this.offerCreators[i];
        break;
        // if negative number
      }
    }
    await this.updateAccount(accountId);
    await this.updateAccount(offerCreatorAccountId);
    // minus
    this.spinnerActions[accountId].buy = false;
  }

  async createBuyOfferFromH(accountId: number,
                            amount: string,
                            sellingCurrency: string,
                            buyingCurrency: string,
                            priceSellingIs1Buying: string,
                            holdingAccount: Keypair,
                            overwrite: boolean,
                            sequence?: number) {
    console.log('createBuyOfferFromH');
    const sellingAsset = this.assets.get(sellingCurrency);
    const buyingAsset = this.assets.get(buyingCurrency);
    const transaction = await this.createBuyOffer(amount, holdingAccount, sellingAsset, buyingAsset, priceSellingIs1Buying, 0, sequence);
    transaction.sign(Keypair.fromSecret(this.accountPrivateKeys[accountId]));
    transaction.sign(Keypair.fromSecret(this.oracleAccount.privateKey));
    this.offersInNetwork.push([
      'Buy Offer',
      new Offer(this.accountNames[accountId] + ' Holding Account',
        amount,
        buyingCurrency,
        sellingCurrency,
        priceSellingIs1Buying,
        '',
        transaction),
      'not-submitted',
      overwrite,
      false]);
    this.offerCreators.push(accountId);
  }

  async createSellOfferFromA(accountId: number,
                             amount: string,
                             sellingCurrency: string,
                             buyingCurrency: string,
                             priceBuyingIs1Selling: string) {
    this.spinnerActions[accountId].sell = true;
    console.log('createSellOfferFromA');
    const sellingAsset = this.assets.get(sellingCurrency);
    const buyingAsset = this.assets.get(buyingCurrency);
    const accountKeyPair = Keypair.fromSecret(this.accountPrivateKeys[accountId]);
    if (sellingCurrency !== 'XLM') {
      await this.createTrust(accountKeyPair, sellingAsset);
    }
    if (buyingCurrency !== 'XLM') {
      await this.createTrust(accountKeyPair, buyingAsset);
    }
    const transaction = await this.createSellOffer(amount, accountKeyPair, sellingAsset, buyingAsset, priceBuyingIs1Selling, 30, 0);
    transaction.sign(accountKeyPair);
    await this.server.submitTransaction(transaction);
    this.addToTransactionTable(transaction);
    // let offerCreatorAccountId;
    for (let i = 0; i < this.offerCreators.length; i++) {
      if (this.offersInNetwork[i][1].buyingAsset === sellingCurrency) {
        this.offersInNetwork[i][1].amount = (parseFloat(this.offersInNetwork[i][1].amount) - parseFloat(amount)).toString();
        // offerCreatorAccountId = this.offerCreators[i];
        break;
        // if negative number
      }
    }
    await this.updateAccount(accountId);
    // minus
    this.spinnerActions[accountId].sell = false;
  }

  async merge(accountId: number) {
    this.spinnerActions[accountId].merge = true;
    console.log('merge');
    const holdingAccount = this.accountContext[accountId].holdingAccount;
    const issuingAccount = this.accountContext[accountId].issuingAccount;
    const asset = this.accountContext[accountId].asset;
    await this.paymentFromHToI(accountId, this.offers[accountId].requestedMoney, holdingAccount, issuingAccount, asset.code);
    await this.closeTrust(accountId, asset, holdingAccount);
    const accountKeyPair = Keypair.fromSecret(this.accountPrivateKeys[accountId]);
    const transactionForH = await this.mergeAccount(holdingAccount, accountKeyPair);
    transactionForH.sign(Keypair.fromSecret(this.accountPrivateKeys[accountId]));
    transactionForH.sign(Keypair.fromSecret(this.oracleAccount.privateKey));
    await this.server.submitTransaction(transactionForH);

    const transactionForI = await this.mergeAccount(issuingAccount, accountKeyPair);
    transactionForI.sign(Keypair.fromSecret(this.oracleAccount.privateKey));
    await this.server.submitTransaction(transactionForI);
    await this.updateAccount(accountId);
    this.spinnerActions[accountId].merge = false;
  }

  async paymentFromHToI(accountId: number, amount: string, holdingAccount: Keypair, issuingAccount: Keypair, assetCurrency: string) {
    console.log('paymentFromHToI');
    const transaction = await this.payment(amount, holdingAccount, issuingAccount, assetCurrency, 30);
    transaction.sign(Keypair.fromSecret(this.accountPrivateKeys[accountId]));
    transaction.sign(Keypair.fromSecret(this.oracleAccount.privateKey));
    await this.server.submitTransaction(transaction);
    this.addToTransactionTable(transaction);
  }

  async closeTrust(accountId: number, asset: Asset, holdingAccount: Keypair) {
    console.log('closeTrust');
    for (const accountKeypair of this.trustLines.get(asset.code).entries()) {
      const account = await this.server.loadAccount(accountKeypair[0]);
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET
      })
        .addOperation(Operation.changeTrust({
          asset,
          limit: '0'
        }))
        .setTimeout(30)
        .build();
      if (holdingAccount.publicKey() === accountKeypair[0]) {
        transaction.sign(Keypair.fromSecret(this.accountPrivateKeys[accountId]));
        transaction.sign(Keypair.fromSecret(this.oracleAccount.privateKey));
      } else {
        transaction.sign(accountKeypair[1]);
      }
      await this.server.submitTransaction(transaction);
      if (this.accountPrivateKeys.includes(accountKeypair[1].secret())) {
        await this.updateAccount(this.accountPrivateKeys.indexOf(accountKeypair[1].secret()));
      }
    }
  }

  async mergeAccount(sourceAccount: Keypair, destinationAccount: Keypair) {
    console.log('mergeAccount');
    const source = await this.server.loadAccount(sourceAccount.publicKey());
    return new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(Operation.accountMerge({
        destination: destinationAccount.publicKey()
      }))
      .setTimeout(0)
      .build();
  }
}


