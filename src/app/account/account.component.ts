import { Component, OnInit } from '@angular/core';
import * as StellarSdk from 'stellar-sdk';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  source: any;
  oracle: any;
  destination: any;
  originAccount: { publicKey: string, privateKey: string} = {
    publicKey: '',
    privateKey: '',
  };
  sourceAccount: { publicKey: string; privateKey: string } = {
    publicKey: '',
    privateKey: ''
  };
  oracleAccount: { publicKey: string; privateKey: string } = {
    publicKey: '',
    privateKey: ''
  };
  destinationAccount: { publicKey: string; privateKey: string } = {
    publicKey: '',
    privateKey: ''
  };

  sourceIsCreate = false;
  oracleIsCreate = false;
  destinationIsCreate = false;
  signerIsAdd = false;
  paymentOneSignerIsAdd = false;
  xdrIsSend = false;
  signAndSubmitIsDone = false;
  error = false;
  xdr: string;

  constructor() {
    this.source = {};
    this.source.signers = [];
    this.source.balances = [{ balance: 0 }];
    this.source.sequence = 0;
    this.oracle = {};
    this.oracle.signers = [];
    this.oracle.balances = [{ balance: 0 }];
    this.oracle.sequence = 0;
    this.destination = {};
    this.destination.signers = [];
    this.destination.balances = [{ balance: 0 }];
    this.destination.sequence = 0;
    this.originAccount = {
      publicKey: 'GCRJGPQNIIDYNX655LWNRN6EAJ2JW7D6OXKFZEMZJRTVQSVSNEGWRHHW',
      privateKey: 'SB5S2MVAJKEMI4CA6DGNZGV4YVO3KSASDKW7PEEWM35P5ICHQP2FIRYP'
    };
  }

  async delay(ms: number) {
    await new Promise(resolve => setTimeout(() => resolve(), ms)).then(() => console.log('fired'));
  }

  ngOnInit() {}

  createAndGetSourceAccount() {
    this.sourceAccount = this.createAccount('source');
    this.sourceIsCreate = true;
  }

  createAndGetOracleAccount() {
    this.oracleAccount = this.createAccount('oracle');
    this.oracleIsCreate = true;
  }

  createAndGetDestinationAccount() {
    this.destinationAccount = this.createAccount('destination');
    this.destinationIsCreate = true;
  }

  createAccount(accountName: string) {
    console.log('createAccount');
    const destination  = StellarSdk.Keypair.random();
    const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
    const sourceKeys = StellarSdk.Keypair.fromSecret(this.originAccount.privateKey);
    server.accounts()
      .accountId(sourceKeys.publicKey())
      .call()
      .then(({ sequence }) => {
          const account = new StellarSdk.Account(sourceKeys.publicKey(), sequence);
          const transaction = new StellarSdk.TransactionBuilder(account, {
              fee: StellarSdk.BASE_FEE,
              networkPassphrase: StellarSdk.Networks.TESTNET
            })
            .addOperation(StellarSdk.Operation.createAccount({
              destination: destination.publicKey(),
              startingBalance: '100'
            }))
            .setTimeout(30)
            .build();
          transaction.sign(sourceKeys);
          console.log(server.submitTransaction(transaction));
        })
      .then(() => {
        this.delay(5000).then(any => {
          this.getAccount(destination.publicKey(), accountName);
        });
      });
    return { publicKey: destination.publicKey(), privateKey: destination.secret() };
  }

  getAccount(publicKey: string, accountName: string) {
    console.log('getAccount');
    const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
    server
      .accounts()
      .accountId(publicKey)
      .call()
      .then(account => {
        if (accountName === 'source') {
          this.source = account;
        } else if (accountName === 'oracle') {
          this.oracle = account;
        } else {
          this.destination = account;
        }
        console.log(account);
      })
      .catch(error => {
        console.log('getAccount Error' + error);
      });
  }

  addSourceAccountOracleSigner() {
    console.log('addSourceAccountOracleSigner');
    const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
    const sourceKeys = StellarSdk.Keypair.fromSecret(this.sourceAccount.privateKey);
    server.loadAccount(this.sourceAccount.publicKey)
      .catch((error) => {
        throw new Error('The escrow account does not exist!');
      })
      .then((source) => {
        // Start building the transaction.
        const transaction = new StellarSdk.TransactionBuilder(source, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET
          })
          .addOperation(StellarSdk.Operation.setOptions({
            signer: {
              ed25519PublicKey: this.oracleAccount.publicKey,
              weight: 1
            }
          }))
          .addOperation(StellarSdk.Operation.setOptions({
            masterWeight: 1,
            lowThreshold: 2,
            medThreshold: 2,
            highThreshold: 2
          }))
          .setTimeout(30)
          .build();
        transaction.sign(sourceKeys);
        server.submitTransaction(transaction);
      })
      .then((result) => {
        this.signerIsAdd = true;
      })
      .then(() => {
        this.delay(5000).then(() => {
          this.getAccount(sourceKeys.publicKey(), 'source');
        });
      });
  }
  paymentFromSourceToDestination() {
    console.log('paymentFromSourceToDestination');
    const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
    const sourceKeys = StellarSdk.Keypair.fromSecret(this.sourceAccount.privateKey);
    server.loadAccount(this.sourceAccount.publicKey)
      .catch((error) => {
        throw new Error('The escrow account does not exist!');
      })
      .then((source) => {
        // Start building the transaction.
        const transaction = new StellarSdk.TransactionBuilder(source, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: StellarSdk.Networks.TESTNET
        })
          .addOperation(StellarSdk.Operation.payment({
            destination: this.destinationAccount.publicKey,
            asset: StellarSdk.Asset.native(),
            amount: '50'
          }))
          .setTimeout(30)
          .build();
        transaction.sign(sourceKeys);
        server.submitTransaction(transaction).catch((error) => {
          this.error = true;
          console.log(error);
        });
        this.xdr = transaction.toEnvelope().toXDR().toString('base64');
      })
      .then(() => {
        this.paymentOneSignerIsAdd = true;
      });
  }
  sendXDRtoOracle() {
    console.log('sendXDRtoOracle');
    this.xdrIsSend = true;
  }
  signAndSubmit() {
    console.log('signAndSubmit');
    const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
    const oracleKeys = StellarSdk.Keypair.fromSecret(this.oracle.privateKey);
    server.loadAccount(this.oracleAccount.publicKey)
      .then((oracle) => {
        // Start building the transaction.
        const transaction = new StellarSdk.Transaction(this.xdr).sign(oracleKeys);
        // server.submitTransaction(transaction).catch((error) => {
        //   console.log(error);
        // });
      })
      .then(() => {
        this.error = false;
        this.signAndSubmitIsDone = true;
      });
  }
}
