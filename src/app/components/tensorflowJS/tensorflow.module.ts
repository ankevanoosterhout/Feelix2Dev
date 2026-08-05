import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from "@angular/forms";
import { MatDialogModule } from '@angular/material/dialog'; 
import { TensorflowDataComponent } from "./datasets/tensorflow-data.component";
import { TensorflowComponent } from "./tensorflow.component";
import { TensorflowModelComponent } from "./tensorflow-model/tensorflow-model.component";
import { TensorflowDefaultModelComponent } from "./tensorflow-model/tensorflow-default-model.component";
import { TensorflowDeployComponent } from "./deploy/tensorflow-deploy.component";
import { TensorflowTrainComponent } from "./train/tensorflow-train.component";
import { LoadDataSetsComponent } from './loadData/load-datasets.component';
import { TensorFlowModelDrawService } from './../../services/tensorflow-model-draw.service';
import { TensorFlowModelService } from './../../services/tensorflow-model.service';
import { TensorFlowDrawService } from './../../services/tensorflow-draw.service';
import { TensorFlowTrainService } from './../../services/tensorflow-train.service';
import { TensorFlowMainService } from './../../services/tensorflow-main.service';
import { DataSetService } from './../../services/dataset.service';
import { StatusbarModule } from "../interface-elements/statusbar.module";
import { TensorFlowRecordService } from "./../../services/tensorflow-record.service";
import { TfWarningComponent } from "./tf-warning.component";
import { SidebarComponent } from "./sidebar.component";
import { GraphComponent } from "./graph.component";


@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    MatDialogModule,
    StatusbarModule,
    TensorflowDataComponent,
    LoadDataSetsComponent,
    TensorflowDeployComponent,
    SidebarComponent,
    GraphComponent
  ],
  declarations: [
    TensorflowComponent,
    TensorflowModelComponent,
    TensorflowDefaultModelComponent,
    TensorflowTrainComponent,
    TfWarningComponent
  ],
  providers: [
    TensorFlowModelDrawService,
    TensorFlowModelService,
    TensorFlowDrawService,
    TensorFlowTrainService,
    TensorFlowMainService,
    TensorFlowRecordService,
    DataSetService
  ]

})
export class TensorflowModule {}
