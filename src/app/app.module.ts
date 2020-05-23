import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { MaterialModule } from './material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AccountComponent } from './account/account.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTableModule } from '@angular/material/table';
import { AngularFireModule } from '@angular/fire';
import { environment } from '../environments/environment';
import {Routes, RouterModule} from '@angular/router';
import {
  MatCardModule,
  MatFormFieldModule,
  MatInputModule,
  MatPaginatorModule,
  MatProgressBarModule, MatProgressSpinnerModule,
  MatSelectModule,
  MatSortModule
} from '@angular/material';
import {MatExpansionModule} from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';
import { CpComponent } from './cp/cp.component';

const appRoutes: Routes = [
  { path: '', component: CpComponent},
  { path: 'training', component: AccountComponent}
];

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    AccountComponent,
    CpComponent
  ],
  imports: [
    RouterModule.forRoot(appRoutes),
    MatTableModule,
    BrowserModule,
    MatInputModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MaterialModule,
    BrowserAnimationsModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    FlexLayoutModule,
    MatGridListModule,
    MatSelectModule,
    MatCardModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebaseConfig)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
