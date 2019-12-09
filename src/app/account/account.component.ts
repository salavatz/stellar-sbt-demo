import { Component, OnInit } from "@angular/core";
import * as StellarSdk from "stellar-sdk";

@Component({
  selector: "app-account",
  templateUrl: "./account.component.html",
  styleUrls: ["./account.component.css"]
})
export class AccountComponent implements OnInit {
  account: any;
  sourceAccount: { publicKey: string; privateKey: string } = {
    publicKey: "",
    privateKey: ""
  };
  destinationAccount: { publicKey: string; privateKey: string } = {
    publicKey: "",
    privateKey: ""
  };

  tasks = {
    generateKeypairs: { active: false, status: false, completed: false },
    createAccounts: { active: false, status: false, completed: false }
  };

  sourceIsCreate = false;
  destinationIsCreate = false;

  constructor() {
    this.account = {};
    this.account.signers = [];
    this.account.balances = [{ balance: 0 }];
  }

  ngOnInit() {}

  createAndGetSourceAccount() {
    this.sourceAccount = this.createAccount();
    this.getAccount(this.sourceAccount.publicKey);
    this.sourceIsCreate = true;
  }

  createAndGetDestinationAccount() {
    this.destinationAccount = this.createAccount();
    this.getAccount(this.sourceAccount.publicKey);
    this.destinationIsCreate = true;
  }

  createAccount() {
    console.log(this.account);
    console.log("createAccount");
    return {
      publicKey: "GBCXLZJYBZNB46CKXZSGBXNWXGN2G4IMWKTGH3IP5RLABV2253FS54AS",
      privateKey: "SBCXLZJYBZNB46CKXZSGBXNWXGN2G4IMWKTGH3IP5RLABV2253FS54AS"
    };
    // const pair = StellarSdk.Keypair.random();
    // return { publicKey: pair.publicKey(), privateKey: pair.secret() };
  }

  getAccount(publicKey: string) {
    console.log("getAccount");
    StellarSdk.Network.useTestNetwork();
    const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");
    publicKey = "GBCXLZJYBZNB46CKXZSGBXNWXGN2G4IMWKTGH3IP5RLABV2253FS54AS";
    server
      .accounts()
      .accountId(publicKey)
      .call()
      .then(account => {
        this.account = account;
        console.log(account);
      })
      .catch(error => {
        // set balances and signers to 0
        this.account = {};
        this.account.signers = [];
        this.account.balances = [{ balance: 0 }];
      });
  }
}
