import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BrowserModule } from '@angular/platform-browser';
import { TensorflowDataComponent } from "./datasets/tensorflow-data.component";
import { TensorflowComponent } from "./tensorflow.component";
import { TensorflowModelComponent } from "./tensorflow-model/tensorflow-model.component";
import { TensorflowDefaultModelComponent } from "./tensorflow-model/tensorflow-default-model.component";
import { TensorflowDeployComponent } from "./deploy/tensorflow-deploy.component";
import { TensorflowTrainComponent } from "./train/tensorflow-train.component";
import { LoadDataSetsComponent } from './loadData/load-datasets.component';
import { TensorFlowModelDrawService } from 'src/app/services/tensorflow-model-draw.service';
import { TensorFlowModelService } from 'src/app/services/tensorflow-model.service';
import { TensorFlowDrawService } from 'src/app/services/tensorflow-draw.service';
import { TensorFlowTrainService } from 'src/app/services/tensorflow-train.service';
import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';
import { DataSetService } from 'src/app/services/dataset.service';
import { FormsModule } from "@angular/forms";
import { NgxFsModule } from "ngx-fs";
import { MatDialogModule } from "@angular/material/dialog";
import { StatusbarModule } from "../interface-elements/statusbar.module";
import { GraphComponent } from "./graph.component";
import { SidebarComponent } from "./sidebar.component";

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    NgxFsModule,
    MatDialogModule,
    StatusbarModule
  ],
  declarations: [
    TensorflowComponent,
    TensorflowDataComponent,
    TensorflowModelComponent,
    TensorflowDefaultModelComponent,
    TensorflowDeployComponent,
    TensorflowTrainComponent,
    LoadDataSetsComponent,
    GraphComponent,
    SidebarComponent,
  ],
  providers: [
    TensorFlowModelDrawService,
    TensorFlowModelService,
    TensorFlowDrawService,
    TensorFlowTrainService,
    TensorFlowMainService,
    DataSetService
  ]

})
export class TensorflowModule {}
