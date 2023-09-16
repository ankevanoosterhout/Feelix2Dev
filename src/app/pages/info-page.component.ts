import { Component, OnInit } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'app-info-page',
  template: `
  <div class="image-bg" style="background-image: url('./assets/images/info-window-bg.png');"></div>
  <div class="window-content">

    <div class="row">
      <div class="title">
        <h1>Haptic Interaction Design with Feelix</h1>
      <div class="column">
        Feelix makes use of the <p class="link" (click)="gotToLink('https://simplefoc.com/')">SimpleFOC library</p> for brushless motor control and can be used in combination with the following hardware:
        <ul>
          <li>BLDC (high torque)</li>
          <li>Encoder (e.g., AS5047 / AS5058A)</li>
          <li>3-Phase motor driver (e.g., L6234, DRV8313)</li>
          <li>Various 32-bit microcontrollers are supported including: Teensy, STM32, Arduino, ESP, and Raspberry.
            <p class="link" (click)="gotToLink('https://docs.feelix.xyz/downloads/c-library')"> Download Feelix Library</p></li>
        </ul>
        For more information visit <p class="link inline" (click)="gotToLink('https://docs.feelix.xyz')">www.feelix.xyz<p>
      </div>
    </div>


    <label class="checkbox-container show">Do not show again
        <input type="checkbox" id="show" name="show" [(ngModel)]="dontShowAgain" [checked]="dontShowAgain" (change)="disableInfo();">
        <span class="checkmark checkbox"></span>
    </label>
  </div>`,
  styles: [`

    .image-bg {
      position:absolute;
      margin:0;
      width:802px;
      height:100%;
      z-index:-1;
      top:0;
      left:-1px;
      background-position: center;
      background-repeat: no-repeat;
      background-size: cover;
    }


    h1 {
      font-size: 30px;
      font-weight: 600;
      letter-spacing: 0.05em;
      padding: 110px 36px 35px;
    }

    .window-content {
      width: 100%;
      height: 100vh;
      box-sizing: border-box;
      font-size: 12px;
      color: #fff;
    }

    .logo {
      width: 70%;
      height: auto;
    }

    p.link {
      text-decoration: underline;
      cursor: pointer;
      margin: 0;
      padding:0;
      display:inline-block;
      color: #FFF;
      font-weight: 600px;
      opacity: 0.6;
    }

    p.link:hover {
      opacity: 1;
    }

    p.inline {
      display: inline-block;
    }

    .column {
      display: inline-block;
      width: 55%;
      left: 42%;
      line-height: 22px;
      padding: 10px 15px;
      box-sizing: border-box;
      position: relative;
      letter-spacing: 0.03em;
    }



    .column-wide {
      width: 100%;
      padding: 10px 15px;
      box-sizing: border-box;
    }

    .bldcmotor-img {
      width: 90%;
      margin: 0 5%;
      height: auto;
    }

    .show {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 55%;
      margin: 30px 6px;
      font-size: 11px;
      line-height: 20px;
      color: #fff;
    }

    .checkmark.checkbox {
      background-color: #fff;
      border: 1px solid #1a1a1a;
    }

    .checkbox-container .checkmark:after {
      color: #222;
    }
  `]
})
export class InfoPageComponent implements OnInit {

  public static readonly SHOW = 'ngx-webstorage|showInfo';

  dontShowAgain = false;

  constructor(private electronService: ElectronService) { }

  ngOnInit() {
    localStorage.setItem(InfoPageComponent.SHOW, 'true');
  }

  disableInfo() {
    const show = !this.dontShowAgain;
    localStorage.setItem(InfoPageComponent.SHOW, show.toString());
  }

  gotToLink(link: string) {
    if (this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.send('openExternalLink', link);
    }
  }
}


