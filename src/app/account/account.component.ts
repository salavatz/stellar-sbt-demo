import { Component, OnInit } from '@angular/core';
import {MatInputModule} from '@angular/material/input';
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
  envelop: any;

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
      publicKey: 'GAVRL3KUM3ZA7RAAIZWKU6SQCSDFW3O3G4XOPMTML4U243NPINLBJDUE',
      privateKey: 'SAWD5FXGLRDPCV7Z7R26A6PZ2EAESGUBVI47QGZOFUSMFGMJNJH56WIK'
    };
  }

  async delay(ms: number) {
    await new Promise(resolve => setTimeout(() => resolve(), ms)).then(() => console.log('fired'));
  }

  ngOnInit() {

  }

  createAndGetSourceAccount() {
    this.sourceAccount = this.createAccount('source');
  }

  createAndGetOracleAccount() {
    this.oracleAccount = this.createAccount('oracle');
  }

  createAndGetDestinationAccount() {
    this.destinationAccount = this.createAccount('destination');
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
          console.log(123);
          server.submitTransaction(transaction).then((transactionResult) => {
            console.log(JSON.stringify(transactionResult, null, 2));
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
          this.sourceIsCreate = true;
        } else if (accountName === 'oracle') {
          this.oracle = account;
          this.oracleIsCreate = true;
        } else {
          this.destination = account;
          this.destinationIsCreate = true;
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
        server.submitTransaction(transaction).then((transactionResult) => {
          console.log(JSON.stringify(transactionResult, null, 2));
          this.signerIsAdd = true;
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
        this.envelop = transaction.toEnvelope().toXDR();
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
    const oracleKeys = StellarSdk.Keypair.fromSecret(this.oracleAccount.privateKey);
    const sourceKeys = StellarSdk.Keypair.fromSecret(this.sourceAccount.privateKey);
    const destinationKeys = StellarSdk.Keypair.fromSecret(this.destinationAccount.privateKey);
    server.loadAccount(this.oracleAccount.publicKey)
      .then((oracle) => {
        // Start building the transaction.
        console.log(this.xdr);
        const transaction = new StellarSdk.Transaction(this.xdr, StellarSdk.Networks.TESTNET);
        transaction.sign(oracleKeys);
        server.submitTransaction(transaction).then((transactionResult) => {
          console.log(JSON.stringify(transactionResult, null, 2));
          this.error = false;
          this.signAndSubmitIsDone = true;
          this.getAccount(sourceKeys.publicKey(), 'source');
          this.getAccount(destinationKeys.publicKey(), 'destination');
        });
      });
  }
}
