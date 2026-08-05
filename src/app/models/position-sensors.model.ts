export class MagneticSensor {
  part_number: string = 'AS5X4X'
  bit_resolution: number = 14;
  protocol: string = 'SPI';
  spi_mode: string = 'SPI_MODE1';
  angle_register: string = '03xFFF';
  data_start_bit?: number;
  command_rw_bit?: number;
  command_parity_bit?: number;
  clock_speed = 1000000;
  direction = true; //CW: 1, CCW: 0
}

export class Encoder {
  encA?: number;
  encB?: number;
  PPR?: number;
  index_pin?: number;
  quadrature = true;
  pullup: string = 'USE_EXTERN';
}


