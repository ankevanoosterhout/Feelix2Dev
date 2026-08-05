import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';

import * as d3 from 'd3';
import { IpcRendererEvent } from 'electron';

import { ElectronService } from '../../../services/electron.service';
import { MicroController } from '../../../models/hardware.model';
import { HardwareService } from '../../../services/hardware.service';
import { UploadService } from '../../../services/upload.service';

//import { UploadStringModel } from 'src/app/models/effect-upload.model';


@Component({
  selector: 'app-anti-cogging',
  standalone: true,
  imports: [ CommonModule, FormsModule ],
  templateUrl: './anti-cogging.component.html',
  styleUrls: ['../../windows/effects/effects.component.css'],
})
export class AntiCoggingComponent implements OnInit {

    coggingData: Array<any> = [];
    microcontroller?: MicroController;
    motor_id?: string;
    scaleX: any;
    scaleY: any;


    constructor(@Inject(DOCUMENT) private document: Document, private electronService: ElectronService, private uploadService: UploadService, public hardwareService: HardwareService) {

        this.electronService.ipcRenderer.on('cogging_data', (event: IpcRendererEvent, data: any) => {
            console.log(data);
            this.coggingData.push(data);
            this.drawGraphData();
        });

        this.electronService.ipcRenderer.on('cogging_data_output', (event: IpcRendererEvent, data: any) => {
            // console.log(data);
            (this.document.getElementById('direction') as HTMLDivElement).innerHTML = 'Direction: ' + data.direction;
            (this.document.getElementById('mean-error') as HTMLDivElement).innerHTML = 'Mean error (alignment): ' + data.meanError + ' deg (electrical) ';
            (this.document.getElementById('standard-deviation') as HTMLDivElement).innerHTML = 'Standard Deviation (cogging): ' + data.standardDeviation + ' deg (electrical)';
            (this.document.getElementById('plot') as HTMLDivElement).innerHTML = 'Plotting 3rd column of data (electricAngleError) will likely show sinusoidal cogging pattern with a frequency of 4xpole_pairs per rotation';
        });
    }


    ngOnInit(): void {
        this.drawGraph();
    }


    @HostListener('window:resize', ['$event'])
    onResize(event: Event) {
      this.drawGraph();
    }


    closeWindow() {
        if (this.electronService.isElectronApp) {
            this.electronService.ipcRenderer.send('closeTmpWindow');
        }
    }


    startTest() {
        if (this.microcontroller) {
           
            if (this.coggingData.length > 0) {
                this.coggingData = [];
                this.drawGraph();
            }

            (this.document.getElementById('direction') as HTMLDivElement).innerHTML = '';
            (this.document.getElementById('mean-error') as HTMLDivElement).innerHTML = '';
            (this.document.getElementById('standard-deviation') as HTMLDivElement).innerHTML = '';
            (this.document.getElementById('plot') as HTMLDivElement).innerHTML = '';

            const model = this.createUploadModel();

            if (model !== undefined)  {
                const data = {
                    config: model.config,
                    dataString: 'FA'
                };
                

                console.log(data);
                // const newUploadStringModel = new UploadStringModel(this.microcontroller, 'FA');

                // console.log(newUploadStringModel);

                this.electronService.ipcRenderer.send('send_data_str', data);
            }
        }
    }


    createUploadModel() {
        const uploadModel = this.uploadService.createUploadModel_TT('FA', this.microcontroller);
        const motor = this.microcontroller?.motors.filter(m => m.id === this.motor_id)[0];
        if (motor !== undefined && uploadModel !== undefined && uploadModel.config !== undefined) {
            uploadModel.config.motors = [ motor ];
        }
        return uploadModel;
    }


    selectMicrocontroller() {
        if (this.microcontroller && this.microcontroller.motors.length >= 1) {
            this.motor_id = this.microcontroller.motors[0].id;
        }
    }


    drawGraph() {
    
        d3.selectAll('#graph_cogging').remove();
    
        const svg = d3.select('#svg_graph_cogging')
            .append('svg')
            .attr('id', 'graph_cogging')
            .attr('width', window.innerWidth - 80)
            .attr('height', 250);
    
        svg.append('clipPath')
          .attr('id', 'clipPathGraph')
          .append('svg:rect')
          .attr('width', window.innerWidth - 80)
          .attr('height', 250);
    
        svg.append('rect')
          .attr('id', 'border')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', window.innerWidth - 80)
          .attr('height', 250)
          .attr('transform', 'translate(0,0)')
          .style('stroke', '#999')
          .style('stroke-width', 0.5)
          .style('fill', 'white');
    
        this.scaleY = d3.scaleLinear()
            .domain([-10000, 10000])
            .range([400, 0]);
  
        this.scaleX = d3.scaleLinear()
            .domain([-800, 800])
            .range([0, window.innerWidth - 80]);

        if (this.coggingData.length > 0) {
            this.drawGraphData();
        }
    }
    

    drawGraphData() {


        // const electricAngle = d3.line()
        //     .x((d: { angle: number; }) => this.scaleX(d.angle))
        //     .y((d: { electricAngle: number; }) => this.scaleY(d.electricAngle));

        // const sensorElectricAngle = d3.line()
        //     .x((d: { angle: number; }) => this.scaleX(d.angle))
        //     .y((d: { sensorElectricAngle: number; }) => this.scaleY(d.sensorElectricAngle));

        const errorElectricAngle = d3.line<{ angle: number; electricAngleError: number }>()
                                     .x((d) => this.scaleX(d.angle))
                                     .y((d) => this.scaleY(d.electricAngleError));


        
        d3.select('#dataGroup').remove();

        const dataGroup = d3.select('#graph_cogging').append('g')
            .attr('id', 'dataGroup')
            .attr('clip-path', 'url(#clipPathGraph)');


        // for (let i = 0; i < this.coggingData.length - 1; i++) {
            
        //     dataGroup.append('path')
        //         .attr('fill', 'none')
        //         .attr('stroke', i === 0 ? '#7065EB' : i === 1 ? '#5e644f' : '#5e644f')
        //         .attr('stroke-width', 1.5)
        //         .attr('d', i === 0 ? electricAngle(this.coggingData) : i === 1 ? sensorElectricAngle(this.coggingData) : errorElectricAngle(this.coggingData))  
        //         .append('svg:title')
        //             .text(() => i === 0 ? 'Electric angle' : i === 1 ? 'Sensor electric angle' : 'Error electric angle');
        // }
            
        dataGroup.append('path')
            .attr('fill', 'none')
            .attr('stroke', '#5e644f')
            .attr('stroke-width', 1.5)
            .attr('d', errorElectricAngle(this.coggingData))  
            .append('svg:title')
                .text('Error electric angle');
        
    }
}