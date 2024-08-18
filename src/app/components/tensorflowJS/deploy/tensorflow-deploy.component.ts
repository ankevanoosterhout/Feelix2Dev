import { AfterViewInit, ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { TensorFlowData } from 'src/app/models/tensorflow-data.model';
import { Classifier, InputColor, InputItem, Label, MLDataSet, MotorEl } from 'src/app/models/tensorflow.model';
import { TensorFlowMainService } from 'src/app/services/tensorflow-main.service';
import { TensorFlowRecordService } from 'src/app/services/tensorflow-record.service';
import { TensorFlowTrainService } from 'src/app/services/tensorflow-train.service';
import { v4 as uuid } from 'uuid';


@Component({
  selector: 'app-tensorflow-deploy',
  templateUrl: 'tensorflow-deploy.component.html',
  styleUrls: ['../../windows/effects/effects.component.css', './../tensorflow.component.scss'],
})
export class TensorflowDeployComponent implements AfterViewInit {

  public d: TensorFlowData;

  public graphID = 'svg_graph_deploy';


  constructor(public tensorflowService: TensorFlowMainService, private electronService: ElectronService,
              public tensorflowRecordService: TensorFlowRecordService, private changeDetection: ChangeDetectorRef, private tensorflowTrainService: TensorFlowTrainService) {


    this.d = this.tensorflowService.d;

    this.tensorflowService.updateGraph.subscribe((data) => {
      if (data) {
        this.tensorflowRecordService.redraw(data.set, null, this.graphID, false);
        // this.tensorflowDrawService.drawTensorFlowGraphData(data.set, null);
      }
    });

    this.tensorflowService.loadMLData.subscribe((res) => {
      this.loadMLdataSet(res);
      this.changeDetection.detectChanges();
    });

    this.tensorflowRecordService.predictOutput.subscribe(() => {
      this.tensorflowTrainService.predictOutput();
    });
  }

  ngAfterViewInit(): void {
    this.tensorflowRecordService.redraw(this.d.selectedMLDataset, this.d.trimLines, this.graphID, false);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.tensorflowRecordService.redraw(this.d.selectedMLDataset, null, this.graphID, false);
  }


  loadDataFromFile() {
    this.electronService.ipcRenderer.send('loadDataFromFile', { storageName: 'loadMLData', storageLocation: 'loadDataLocation' });
  }



  loadMLdataSet(dataSets: Array<any>) {

    if (dataSets) {
      const tmpID = uuid();

      let i = 0;

      for (const mlData of dataSets) {

        if (!mlData.data && mlData.length > 0) {

          console.log(mlData);

          for (const data of mlData) {

            if (data.date && data.classifierID && data.confidencesLevels) {
              this.d.mlOutputData.push(data);
            }
          }

        } else {
          for (const data of mlData.data) {

            for (const dataSequence of data.i) {

              const actuators: Array<MotorEl> = [];

              let nrOfMotors = dataSequence[0].length;
              for (let m = 0; m < nrOfMotors; m++) {
                const motorEl = new MotorEl('actuator-' + (m + 1), 'actuator-' + (m + 1), null, null, m);
                motorEl.record = true;
                motorEl.visible = true;
                motorEl.colors = [ new InputColor('pressure', this.d.colorOptions[m]) ];
                actuators.push(motorEl);
              }

              let j = 0;

              const mlDataSet = new MLDataSet(uuid(), 'ml-output-' + (i + 1));
              mlDataSet.classifierID = tmpID;

              mlDataSet.selected = false;
              mlDataSet.open = false;

              for (const item of dataSequence) {

                let n = 0;
                for (const value of item) {
                  if (mlDataSet.m[n] === undefined) {
                    actuators[n].d = [];
                    mlDataSet.m[n] = actuators[n];
                  }
                  const inputItem = new InputItem('pressure');
                  inputItem.value = value[0];

                  mlDataSet.m[n].d.push({inputs: [ inputItem ], time: j});

                  n++;
                }

                j++;
              }

              let c = 0;
              for (const value of data.p) {
                const label = new Label(mlData.classifier[c].id, mlData.classifier[c].name);
                label.confidence = value;

                mlDataSet.confidencesLevels.push(label);
                c++;
              }

              mlDataSet.bounds = { xMin: 0, xMax: dataSequence.length - 1, yMin: 0.6, yMax: 1.4 };


              this.d.mlOutputData.push(mlDataSet);

            }
            i++;
          }


          if (dataSets.length > 0 && !this.d.selectedModel.outputs.filter(c => c.id === tmpID)[0]) {

            const newClassifier = new Classifier(tmpID, 'Output', false);

            for (let c = 0; c < dataSets[0].classifier.length; c++) {
              newClassifier.labels.push(this.d.mlOutputData[0].confidencesLevels[c]);
            }
            newClassifier.active = true;

            this.d.selectedModel.outputs.push(newClassifier);
          }
        }
      }
    }
  }
}
