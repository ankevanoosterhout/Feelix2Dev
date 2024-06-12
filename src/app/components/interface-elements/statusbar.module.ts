import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from "@angular/forms";
import { NgxFsModule } from "ngx-fs";
import { MatDialogModule } from "@angular/material/dialog";
import { StatusbarComponent } from './statusbar.component';

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    NgxFsModule,
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
