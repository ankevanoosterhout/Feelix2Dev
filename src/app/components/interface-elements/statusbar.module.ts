import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from "@angular/forms";
import { MatDialogModule } from "@angular/material/dialog";
import { StatusbarComponent } from './statusbar.component';

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    MatDialogModule
  ],
  declarations: [
    StatusbarComponent
  ],
  exports: [
    StatusbarComponent
  ]

})
export class StatusbarModule {}
