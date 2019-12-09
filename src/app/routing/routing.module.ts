import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {AccountComponent} from '../account/account.component';

const routes: Routes = [
  { path: '#account', component: AccountComponent},
  { path: '#payment', component: AccountComponent},
  { path: '#multisig', component: AccountComponent},
  { path: '#issue', component: AccountComponent},
  { path: '#offer', component: AccountComponent}
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forRoot(routes, {onSameUrlNavigation: 'reload'}), CommonModule],
  exports: [RouterModule]
})
export class RoutingModule { }
