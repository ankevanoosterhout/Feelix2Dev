import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KinematicsComponent } from './kinematics.component';
import { FileListComponent } from '../../components/file/file-list.component';
import { StatusbarModule } from '../../components/interface-elements/statusbar.module';
import { KinematicsToolbarComponent } from '../../components/kinematics/kinematics-toolbar.component';
import { KinematicsControlComponent } from '../../components/kinematics/control/kinematics-controls.component';
import { KinematicsCursorComponent } from '../../components/kinematics/control/kinematics-cursor.component';
import { KinematicsDrawingService } from '../../services/kinematics-drawing.service';
import { KinematicService } from '../../services/kinematic.service';

@NgModule({
  declarations: [
    KinematicsComponent,
    KinematicsCursorComponent
  ],
  imports: [
    FileListComponent, 
    StatusbarModule,
    CommonModule,
    KinematicsToolbarComponent,
    KinematicsControlComponent
  ],
  providers: [
    KinematicsDrawingService,
    KinematicService
  ]
})
export class KinematicsModule { } // Or AppModule
