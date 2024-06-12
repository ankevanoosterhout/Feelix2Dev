import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxWebstorageModule } from 'ngx-webstorage';
import { NgxFsModule } from 'ngx-fs';

import { AppComponent } from './app.component';
import { InfoPageComponent } from './pages/info-page.component';
import { ToolbarComponent } from './components/interface-elements/toolbars/toolbar.component';
import { ToolbarInsetComponent } from './components/interface-elements/toolbars/toolbar-inset.component'
import { NgxElectronModule } from 'ngx-electron';
import { MainPageComponent } from './pages/main-page.component';
import { AppRoutingModule } from './app-routing.module';
import { EffectsComponent } from './components/windows/effects/effects.component';
import { FileListComponent } from './components/file/file-list.component';
import { FileSettingsComponent } from './components/windows/settings/file-settings.component';
import { EffectListComponent } from './components/file/effect-list.component';
import { EffectSettingsComponent } from './components/windows/settings/effect-settings.component';
import { FileComponent } from './components/file/file.component';
import { FileService } from './services/file.service';
import { DataService } from './services/data.service';
import { ToolService } from './services/tool.service';
import { NodeService } from './services/node.service';
import { BezierService } from './services/bezier.service';
import { MotorControlService } from './services/motor-control.service';
import { DialogComponent } from './components/windows/dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FileSaverModule } from 'ngx-filesaver';
import { GridSettingsComponent } from './components/windows/settings/grid-settings.component';
import { ZigZagComponent } from './components/windows/zigzag-effect.component';
import { TransformComponent } from './components/windows/transform.component';
import { DrawingPlaneComponent } from './components/interface-elements/drawing-plane/drawing-plane.component';
import { FixedToolbarComponent } from './components/interface-elements/toolbar-header/fixed-toolbar.component';
import { DrawingService } from './services/drawing.service';
import { BBoxService } from './services/bbox.service';
import { DrawElementsService } from './services/draw-elements.service';
import { HardwareService } from './services/hardware.service';
import { MotorSettingsComponent } from './components/windows/settings/motor-settings.component';
import { MotorControlComponent } from './components/interface-elements/motor-control/motor-control.component';
import { MotorControlToolbarInsetComponent } from './components/interface-elements/toolbars/motor-control-toolbar-inset.component';
import { MotorControlToolbarComponent } from './components/interface-elements/toolbars/motor-control-toolbar.component';
import { UploadService } from './services/upload.service';
import { HistoryService } from './services/history.service';
import { EffectLibraryService } from './services/effect-library.service';
import { EffectVisualizationService } from './services/effect-visualization.service';
import { ExportDialogComponent } from './components/windows/export-dialog.component';
import { CloneService } from './services/clone.service';
import { GridService } from './services/grid.service';
import { FilterService } from './services/filter.service';
import { KinematicsComponent } from './components/kinematics/kinematics.component';
import { KinematicService } from './services/kinematic.service';
import { KinematicsToolbarComponent } from './components/kinematics/kinematics-toolbar.component';
import { KinematicsControlComponent } from './components/kinematics/control/kinematics-controls.component';
import { KinematicsDrawingService } from './services/kinematics-drawing.service';
import { KinematicsCursorComponent } from './components/kinematics/control/kinematics-cursor.component';
import { DragControlsService } from './services/drag-controls.service';
import { IKService } from './services/IK.service';
import { PlaySequenceComponent } from './components/windows/play-sequence.component';
import { DrawAudioService } from './services/draw-audio.service';
import { MidiDataService } from './services/midi-data.service';
import { TensorflowModule } from './components/tensorflowJS/tensorflow.module';
import { StatusbarModule } from './components/interface-elements/statusbar.module';

@NgModule({
    declarations: [
        AppComponent,
        InfoPageComponent,
        MainPageComponent,
        DrawingPlaneComponent,
        FixedToolbarComponent,
        ToolbarComponent,
        ToolbarInsetComponent,
        EffectsComponent,
        FileComponent,
        FileListComponent,
        FileSettingsComponent,
        EffectListComponent,
        EffectSettingsComponent,
        GridSettingsComponent,
        DialogComponent,
        ExportDialogComponent,
        ZigZagComponent,
        TransformComponent,
        MotorSettingsComponent,
        MotorControlComponent,
        MotorControlToolbarInsetComponent,
        MotorControlToolbarComponent,
        PlaySequenceComponent,
        KinematicsComponent,
        KinematicsControlComponent,
        KinematicsToolbarComponent,
        KinematicsCursorComponent
    ],
    imports: [
        BrowserModule,
        NgxWebstorageModule.forRoot(),
        NgxElectronModule,
        AppRoutingModule,
        FormsModule,
        NgxFsModule,
        MatDialogModule,
        BrowserAnimationsModule,
        FileSaverModule,
        StatusbarModule,
        TensorflowModule
    ],
    providers: [
        FileService,
        DataService,
        ToolService,
        NodeService,
        BezierService,
        DrawingService,
        GridService,
        BBoxService,
        DrawElementsService,
        HardwareService,
        UploadService,
        HistoryService,
        EffectLibraryService,
        EffectVisualizationService,
        MotorControlService,
        CloneService,
        FilterService,
        KinematicService,
        KinematicsDrawingService,
        DragControlsService,
        IKService,
        DrawAudioService,
        MidiDataService
        // FullIKService
    ],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule { }
